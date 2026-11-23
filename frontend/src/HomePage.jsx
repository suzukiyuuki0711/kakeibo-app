import { useState, useEffect } from "react";
import { apiRequest } from "./api";

const CATEGORIES = ["食費", "日用品", "交通費", "娯楽費", "その他"];

export default function HomePage({ onNavigate }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiRequest(`/expenses/summary?month=${month}`)
      .then((data) => {
        setSummary(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month]);

  const changeMonth = (diff) => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, m - 1 + diff, 1);
    setMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const formatDisplayMonth = (ym) => {
    const [y, m] = ym.split("-");
    return `${y}年${Number(m)}月の支出`;
  };

  return (
    <div className="page-container">
      {/* 見出し ＋ 年月切り替え */}
      <div className="page-title-row">
        <h1 className="page-heading">{formatDisplayMonth(month)}</h1>
        <div className="month-controls">
          <button
            type="button"
            className="month-step-btn"
            onClick={() => changeMonth(-1)}
          >
            ◀ 前月
          </button>
          <button
            type="button"
            className="month-step-btn"
            onClick={() => changeMonth(1)}
          >
            次月 ▶
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="panel-box loading-text">集計データを読み込み中...</div>
      ) : (
        summary && (
          <>
            {/* 今月の合計ボックス */}
            <div className="total-summary-box">
              <span className="total-summary-label">今月の合計</span>
              <span className="total-summary-value">
                {summary.total_amount.toLocaleString()}円
              </span>
            </div>

            {/* カテゴリ別テーブル */}
            <table className="category-table">
              <thead>
                <tr>
                  <th>カテゴリ</th>
                  <th className="text-right">金額</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => {
                  const amount = summary.category_totals?.[cat] || 0;
                  return (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td className="text-right">
                        {amount.toLocaleString()}円
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )
      )}

      {/* 下部ボタン */}
      <div className="bottom-action-row">
        <button
          type="button"
          className="solid-green-btn"
          onClick={() => onNavigate("form")}
        >
          ＋ 支出を登録する
        </button>
        <button
          type="button"
          className="outline-btn"
          onClick={() => onNavigate("list")}
        >
          支出一覧を見る
        </button>
      </div>
    </div>
  );
}
