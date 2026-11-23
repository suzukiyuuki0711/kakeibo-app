import { useState, useEffect } from "react";
import { apiRequest } from "./api";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import "./App.css";

function App() {
  const [userName, setUserName] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("home"); // 'home' | 'list' | 'form'

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
      {/* 上部ヘッダー（白背景＋下線） */}
      <header className="app-header">
        <div className="header-left">
          <span
            className="header-logo clickable"
            onClick={() => setCurrentPage("home")}
          >
            わたしの家計簿
          </span>
        </div>
        <div className="header-right">
          <span className="user-badge">{userName} さん</span>
        </div>
      </header>

      {/* 左サイドバー ＋ 右メインエリア */}
      <div className="app-body">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-item ${currentPage === "home" ? "active" : ""}`}
              onClick={() => setCurrentPage("home")}
            >
              ホーム
            </button>
            <button
              type="button"
              className={`sidebar-item ${currentPage === "list" ? "active" : ""}`}
              onClick={() => setCurrentPage("list")}
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
            <HomePage onNavigate={(page) => setCurrentPage(page)} />
          )}
          {currentPage !== "home" && (
            <div className="panel-box">
              <p>
                「{currentPage === "list" ? "支出一覧" : "支出登録"}
                」画面は次のステップで作成します。
              </p>
              <button
                className="outline-btn"
                onClick={() => setCurrentPage("home")}
                style={{ marginTop: "16px" }}
              >
                ホームへ戻る
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
