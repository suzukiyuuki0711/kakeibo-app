import { useState } from "react";
import { apiRequest } from "./api";

const CATEGORIES = ["食費", "日用品", "交通費", "娯楽費", "その他"];

export default function ExpenseFormPage({ editingExpense, onSaved, onCancel }) {
  const isEditMode = Boolean(editingExpense);

  // 今日の日付（YYYY-MM-DD）
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(isEditMode ? editingExpense.date : todayStr);
  const [amount, setAmount] = useState(
    isEditMode ? String(editingExpense.amount) : "",
  );
  const [category, setCategory] = useState(
    isEditMode ? editingExpense.category : "食費",
  );
  const [memo, setMemo] = useState(isEditMode ? editingExpense.memo || "" : "");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const payload = {
        date,
        amount: Number(amount),
        category,
        memo,
      };

      if (isEditMode) {
        // 支出更新API（PUT）
        await apiRequest(`/expenses/${editingExpense.expense_id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // 支出登録API（POST）
        await apiRequest("/expenses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      onSaved();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-title-row">
        <h1 className="page-heading">{isEditMode ? "支出編集" : "支出登録"}</h1>
      </div>

      <div className="panel-box form-panel">
        {errorMessage && <div className="error-box">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="form-group">
          <div className="input-field">
            <label htmlFor="expense-date">日付（必須）</label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <label htmlFor="expense-amount">金額（円・必須）</label>
            <input
              id="expense-amount"
              type="number"
              min={1}
              max={9999999}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例：1200"
              required
            />
          </div>

          <div className="input-field">
            <label htmlFor="expense-category">カテゴリ（必須）</label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="expense-memo">メモ（任意・100文字以内）</label>
            <input
              id="expense-memo"
              type="text"
              maxLength={100}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例：スーパーで買い物"
            />
          </div>

          <div className="form-action-row">
            <button
              type="submit"
              className="solid-green-btn"
              disabled={loading}
            >
              {loading ? "保存中..." : isEditMode ? "更新する" : "登録する"}
            </button>
            <button
              type="button"
              className="outline-btn"
              onClick={onCancel}
              disabled={loading}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
