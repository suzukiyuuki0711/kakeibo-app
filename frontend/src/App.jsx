import { useState, useEffect } from "react";
import { apiRequest } from "./api";
import LoginPage from "./LoginPage";
import "./App.css";

function App() {
  const [userName, setUserName] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 起動時にログイン状態を確認
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
  };

  if (checkingAuth) {
    return <div className="loading-screen">読み込み中...</div>;
  }

  // 未ログイン時はログイン・新規登録画面を表示
  if (!userName) {
    return <LoginPage onLoginSuccess={(name) => setUserName(name)} />;
  }

  // ログイン後の仮ホーム画面（次のステップで作り込みます）
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">わたしの家計簿</span>
        </div>
        <div className="header-right">
          <span className="user-badge">{userName} さん</span>
          <button onClick={handleLogout} className="logout-btn">
            ログアウト
          </button>
        </div>
      </header>
      <main className="main-content">
        <div className="card">
          <h2>ログイン成功！</h2>
          <p>
            ようこそ、{userName}{" "}
            さん。次のステップでホーム画面・一覧画面を作成します。
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
