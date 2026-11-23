package com.example.backend;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "expense_id")
    private Long expenseId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @Column(name = "date", nullable = false)
    private LocalDate date;

    @NotNull
    @Min(1)
    @Max(9999999)
    @Column(name = "amount", nullable = false)
    private Integer amount;

    @NotBlank
    @Size(max = 20)
    @Column(name = "category", nullable = false, length = 20)
    private String category;

    @Size(max = 100)
    @Column(name = "memo", nullable = true, length = 100)
    private String memo;

    public Expense() {}

    public Expense(User user, LocalDate date, Integer amount, String category, String memo) {
        this.user = user;
        this.date = date;
        this.amount = amount;
        this.category = category;
        this.memo = memo;
    }

    public Long getExpenseId() { return expenseId; }
    public void setExpenseId(Long expenseId) { this.expenseId = expenseId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }
}
