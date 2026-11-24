import { useState, useEffect } from "react";
import { apiRequest } from "./api";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import ExpenseListPage from "./ExpenseListPage";
import ExpenseFormPage from "./ExpenseFormPage";
import "./App.css";

function App() {
  const [userName, setUserName] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("home"); // 'home' | 'list' | 'form'
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    apiRequest("/auth/me")
      .then((data) => {
        setUserName(data.user_name);
      })
      .catch(() => {
        setUserName(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    setUserName(null);
    setCurrentPage("home");
    setEditingExpense(null);
  };

  const navigateTo = (page) => {
    if (page !== "form") {
      setEditingExpense(null);
    }
    setCurrentPage(page);
  };

  const handleStartEdit = (expense) => {
    setEditingExpense(expense);
    setCurrentPage("form");
  };

  if (checkingAuth) {
    return <div className="loading-screen">読み込み中...</div>;
  }

  if (!userName) {
    return (
      <LoginPage
        onLoginSuccess={(name) => {
          setUserName(name);
          setCurrentPage("home");
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <span
            className="header-logo clickable"
            onClick={() => navigateTo("home")}
          >
            わたしの家計簿
          </span>
        </div>
        <div className="header-right">
          <span className="user-badge">{userName} さん</span>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-item ${currentPage === "home" ? "active" : ""}`}
              onClick={() => navigateTo("home")}
            >
              ホーム
            </button>
            <button
              type="button"
              className={`sidebar-item ${currentPage === "list" ? "active" : ""}`}
              onClick={() => navigateTo("list")}
            >
              支出一覧
            </button>
          </nav>

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-logout"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </aside>

        <main className="main-content">
          {currentPage === "home" && (
            <HomePage onNavigate={(page) => navigateTo(page)} />
          )}
          {currentPage === "list" && (
            <ExpenseListPage
              onNavigate={(page) => navigateTo(page)}
              onEdit={(expense) => handleStartEdit(expense)}
            />
          )}
          {currentPage === "form" && (
            <ExpenseFormPage
              editingExpense={editingExpense}
              onSaved={() => navigateTo("list")}
              onCancel={() => navigateTo("list")}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
