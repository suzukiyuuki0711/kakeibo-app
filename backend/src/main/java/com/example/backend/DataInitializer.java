package com.example.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.HexFormat;

@Configuration
public class DataInitializer {

    // パスワードをSHA-256でハッシュ化する共通メソッド
    public static String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, ExpenseRepository expenseRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User testUser = new User("テスト太郎", "test@example.com", hashPassword("password123"));
                userRepository.save(testUser);

                LocalDate today = LocalDate.now();
                expenseRepository.save(new Expense(testUser, today, 1200, "食費", "スーパーで食材購入"));
                expenseRepository.save(new Expense(testUser, today.withDayOfMonth(1), 580, "日用品", "洗剤とティッシュ"));
                expenseRepository.save(new Expense(testUser, today.withDayOfMonth(1), 440, "交通費", "電車代"));
            }
        };
    }
}
