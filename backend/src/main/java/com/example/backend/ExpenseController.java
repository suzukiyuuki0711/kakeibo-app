package com.example.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    private static final List<String> VALID_CATEGORIES = List.of("食費", "日用品", "交通費", "娯楽費", "その他");

    public ExpenseController(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    // セッションからログイン中ユーザーを取得する共通メソッド
    private Optional<User> getLoginUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return Optional.empty();
        }
        return userRepository.findById(userId);
    }

    // Expenseエンティティをレスポンス用のMapに変換する共通メソッド
    private Map<String, Object> toExpenseMap(Expense e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("expense_id", e.getExpenseId());
        map.put("date", e.getDate().toString());
        map.put("amount", e.getAmount());
        map.put("category", e.getCategory());
        map.put("memo", e.getMemo() != null ? e.getMemo() : "");
        return map;
    }

    // 1. 支出一覧取得API（GET /api/expenses?month=YYYY-MM&category=...）
    @GetMapping
    public ResponseEntity<?> getExpenses(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String category,
            HttpSession session) {

        Optional<User> userOpt = getLoginUser(session);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "ログインが必要です"));
        }

        // 年月の指定（省略時は当月）
        YearMonth targetMonth;
        try {
            targetMonth = (month != null && !month.isBlank()) ? YearMonth.parse(month) : YearMonth.now();
        } catch (DateTimeParseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "月の指定形式が不正です（YYYY-MM形式で指定してください）"));
        }

        // カテゴリの指定チェック
        if (category != null && !category.isBlank() && !category.equals("すべて") && !VALID_CATEGORIES.contains(category)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "カテゴリの指定が不正です"));
        }

        LocalDate start = targetMonth.atDay(1);
        LocalDate end = targetMonth.atEndOfMonth();

        List<Expense> expenses;
        if (category == null || category.isBlank() || category.equals("すべて")) {
            expenses = expenseRepository.findByUserAndDateBetweenOrderByDateDescExpenseIdDesc(userOpt.get(), start, end);
        } else {
            expenses = expenseRepository.findByUserAndCategoryAndDateBetweenOrderByDateDescExpenseIdDesc(userOpt.get(), category, start, end);
        }

        List<Map<String, Object>> resultList = expenses.stream().map(this::toExpenseMap).toList();
        return ResponseEntity.ok(resultList);
    }

    // 2. 月別集計取得API（GET /api/expenses/summary?month=YYYY-MM）
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestParam(required = false) String month,
            HttpSession session) {

        Optional<User> userOpt = getLoginUser(session);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "ログインが必要です"));
        }

        if (month == null || month.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "monthパラメータ（YYYY-MM形式）は必須です"));
        }

        YearMonth targetMonth;
        try {
            targetMonth = YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "月の指定形式が不正です（YYYY-MM形式で指定してください）"));
        }

        LocalDate start = targetMonth.atDay(1);
        LocalDate end = targetMonth.atEndOfMonth();
        List<Expense> expenses = expenseRepository.findByUserAndDateBetweenOrderByDateDescExpenseIdDesc(userOpt.get(), start, end);

        // 月間合計とカテゴリ別合計を計算（0円のカテゴリも含める）
        int totalAmount = 0;
        Map<String, Integer> categoryTotals = new LinkedHashMap<>();
        for (String cat : VALID_CATEGORIES) {
            categoryTotals.put(cat, 0);
        }

        for (Expense e : expenses) {
            totalAmount += e.getAmount();
            categoryTotals.put(e.getCategory(), categoryTotals.getOrDefault(e.getCategory(), 0) + e.getAmount());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("month", targetMonth.toString());
        response.put("total_amount", totalAmount);
        response.put("category_totals", categoryTotals);

        return ResponseEntity.ok(response);
    }

    // 3. 支出詳細取得API（GET /api/expenses/{id}）
    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id, HttpSession session) {
        Optional<User> userOpt = getLoginUser(session);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "ログインが必要です"));
        }

        Optional<Expense> expenseOpt = expenseRepository.findByExpenseIdAndUser(id, userOpt.get());
        if (expenseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "対象の支出が見つからないか、閲覧権限がありません"));
        }

        return ResponseEntity.ok(toExpenseMap(expenseOpt.get()));
    }

    // 4. 支出登録API（POST /api/expenses）
    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> request, HttpSession session) {
        Optional<User> userOpt = getLoginUser(session);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "ログインが必要です"));
        }

        try {
            String dateStr = (String) request.get("date");
            Object amountObj = request.get("amount");
            String category = (String) request.get("category");
            String memo = request.get("memo") != null ? request.get("memo").toString() : null;

            if (dateStr == null || dateStr.isBlank() || amountObj == null || category == null || !VALID_CATEGORIES.contains(category)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "必須項目が未入力か、内容に不備があります"));
            }

            LocalDate date = LocalDate.parse(dateStr);
            int amount = Integer.parseInt(amountObj.toString());

            if (amount < 1 || amount > 9999999 || (memo != null && memo.length() > 100)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "金額は1〜9,999,999円、メモは100文字以内で入力してください"));
            }

            Expense expense = new Expense(userOpt.get(), date, amount, category, memo);
            Expense saved = expenseRepository.save(expense);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "支出を登録しました");
            response.put("expense", toExpenseMap(saved));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "入力内容の形式が正しくありません"));
        }
    }

    // 5. 支出更新API（PUT /api/expenses/{id}）
    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody Map<String, Object> request, HttpSession session) {
        Optional<User> userOpt = getLoginUser(session);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "ログインが必要です"));
        }

        Optional<Expense> expenseOpt = expenseRepository.findByExpenseIdAndUser(id, userOpt.get());
        if (expenseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "対象の支出が見つからないか、更新権限がありません"));
        }

        try {
            String dateStr = (String) request.get("date");
            Object amountObj = request.get("amount");
            String category = (String) request.get("category");
            String memo = request.get("memo") != null ? request.get("memo").toString() : null;

            if (dateStr == null || dateStr.isBlank() || amountObj == null || category == null || !VALID_CATEGORIES.contains(category)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "必須項目が未入力か、内容に不備があります"));
            }

            LocalDate date = LocalDate.parse(dateStr);
            int amount = Integer.parseInt(amountObj.toString());

            if (amount < 1 || amount > 9999999 || (memo != null && memo.length() > 100)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "金額は1〜9,999,999円、メモは100文字以内で入力してください"));
            }

            Expense expense = expenseOpt.get();
            expense.setDate(date);
            expense.setAmount(amount);
            expense.setCategory(category);
            expense.setMemo(memo);
            Expense updated = expenseRepository.save(expense);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("message", "支出を更新しました");
            response.put("expense", toExpenseMap(updated));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "入力内容の形式が正しくありません"));
        }
    }

// 6. 支出削除API（DELETE /api/expenses/{id}）
@DeleteMapping("/{id}")
public ResponseEntity<?> deleteExpense(@PathVariable Long id, HttpSession session) {
    Optional<User> userOpt = getLoginUser(session);
    if (userOpt.isEmpty()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "ログインが必要です"));
    }
    Optional<Expense> expenseOpt = expenseRepository.findByExpenseIdAndUser(id, userOpt.get());
    if (expenseOpt.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "対象の支出が見つからないか、削除権限がありません"));
    }
    expenseRepository.delete(expenseOpt.get());
    return ResponseEntity.ok(Map.of("message", "支出を削除しました"));
}
}