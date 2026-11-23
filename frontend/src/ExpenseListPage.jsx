import { useState, useEffect } from "react";
import { apiRequest } from "./api";

const CATEGORIES = ["すべて", "食費", "日用品", "交通費", "娯楽費", "その他"];

// 前後1年分の年月リスト（2026年11月 など）を生成
function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = -12; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    options.push({ value, label });
  }
  return options;
}

export default function ExpenseListPage({ onNavigate, onEdit }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [category, setCategory] = useState("すべて");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthOptions = generateMonthOptions();

  const fetchExpenses = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ month });
    if (category !== "すべて") {
      params.append("category", category);
    }

    apiRequest(`/expenses?${params.toString()}`)
      .then((data) => {
        setExpenses(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, [month, category]);

  const handleDelete = async (expense) => {
    const ok = window.confirm(
      `${expense.date} の「${expense.category}（${expense.amount.toLocaleString()}円）」を削除してもよろしいですか？`,
    );
    if (!ok) return;

    try {
      await apiRequest(`/expenses/${expense.expense_id}`, {
        method: "DELETE",
      });
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="page-container">
      <div className="page-title-row">
        <h1 className="page-heading">支出一覧</h1>
      </div>

      {/* 年月・カテゴリ絞り込み ＋ 登録ボタン */}
      <div className="list-toolbar">
        <div className="list-filters">
          <div className="filter-item">
            <label htmlFor="month-filter">年月</label>
            <select
              id="month-filter"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="filter-select"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="category-filter">カテゴリ</label>
            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="filter-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="solid-green-btn"
          onClick={() => onNavigate("form")}
        >
          ＋ 支出を登録する
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* 支出合計ボックス（ホーム画面と統一デザイン） */}
      <div className="total-summary-box">
        <span className="total-summary-label">支出合計</span>
        <span className="total-summary-value">
          {totalAmount.toLocaleString()}円
        </span>
      </div>

      {/* 一覧テーブル or 空メッセージ */}
      {loading ? (
        <div className="panel-box loading-text">一覧データを読み込み中...</div>
      ) : expenses.length === 0 ? (
        <div className="panel-box empty-text">支出はありません</div>
      ) : (
        <table className="category-table">
          <thead>
            <tr>
              <th>日付</th>
              <th>カテゴリ</th>
              <th>メモ</th>
              <th className="text-right">金額</th>
              <th className="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((item) => (
              <tr key={item.expense_id}>
                <td>{item.date}</td>
                <td>{item.category}</td>
                <td className="memo-cell">{item.memo || ""}</td>
                <td className="text-right">{item.amount.toLocaleString()}円</td>
                <td className="text-center action-cell">
                  <button
                    type="button"
                    className="table-edit-btn"
                    onClick={() => onEdit(item)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="table-delete-btn"
                    onClick={() => handleDelete(item)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
