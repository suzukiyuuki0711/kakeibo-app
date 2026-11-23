package com.example.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 1. ユーザー登録API
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        String userName = request.get("user_name");
        String email = request.get("email");
        String password = request.get("password");

        // 入力チェック（400：入力不備）
        if (userName == null || userName.isBlank() || userName.length() > 50 ||
                email == null || email.isBlank() || !email.contains("@") ||
                password == null || password.length() < 8) {
            response.put("message", "入力内容に不備があります（ユーザー名は50文字以内、パスワードは8文字以上）");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // メールアドレス重複チェック（409：メールアドレス登録済み）
        if (userRepository.existsByEmail(email)) {
            response.put("message", "このメールアドレスは既に登録されています");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        // パスワードをハッシュ化して保存
        User newUser = new User(userName, email, DataInitializer.hashPassword(password));
        User savedUser = userRepository.save(newUser);

        // 登録成功後そのままログイン状態（セッション開始）にする
        session.setAttribute("userId", savedUser.getUserId());

        response.put("message", "ユーザー登録が完了しました");
        response.put("user_id", savedUser.getUserId());
        response.put("user_name", savedUser.getUserName());
        response.put("email", savedUser.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. ログイン用API
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        String email = request.get("email");
        String password = request.get("password");

        // 入力チェック（400：入力不備）
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            response.put("message", "メールアドレスとパスワードを入力してください");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // ユーザー検索とパスワード照合（401：認証失敗）
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty() || !userOpt.get().getPasswordHash().equals(DataInitializer.hashPassword(password))) {
            response.put("message", "メールアドレスまたはパスワードが正しくありません");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // セッション開始（セッションCookie発行）
        User user = userOpt.get();
        session.setAttribute("userId", user.getUserId());

        response.put("message", "ログインに成功しました");
        response.put("user_name", user.getUserName());

        return ResponseEntity.ok(response);
    }

    // 3. ログアウト用API
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        if (session.getAttribute("userId") == null) {
            response.put("message", "ログインしていません");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // セッション終了
        session.invalidate();
        response.put("message", "ログアウトしました");
        return ResponseEntity.ok(response);
    }

    // 4. ログイン状態確認API（画面遷移・リロード時のチェック用）
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            response.put("message", "未認証です");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            response.put("message", "ユーザーが見つかりません");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        response.put("user_id", userOpt.get().getUserId());
        response.put("user_name", userOpt.get().getUserName());
        response.put("email", userOpt.get().getEmail());
        return ResponseEntity.ok(response);
    }
}