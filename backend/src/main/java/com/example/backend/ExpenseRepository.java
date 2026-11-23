package com.example.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserAndDateBetweenOrderByDateDescExpenseIdDesc(User user, LocalDate start, LocalDate end);
    List<Expense> findByUserAndCategoryAndDateBetweenOrderByDateDescExpenseIdDesc(User user, String category, LocalDate start, LocalDate end);
    Optional<Expense> findByExpenseIdAndUser(Long expenseId, User user);
}