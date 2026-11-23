import { useState } from "react";
import { apiRequest } from "./api";

export default function LoginPage({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      if (isRegisterMode) {
        // 新規登録API
        const data = await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            user_name: userName,
            email,
            password,
          }),
        });
        onLoginSuccess(data.user_name);
      } else {
        // ログインAPI
        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        });
        onLoginSuccess(data.user_name);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (register) => {
    setIsRegisterMode(register);
    setErrorMessage("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="app-title">わたしの家計簿</h1>
        <p className="app-subtitle">
          毎日の支出を記録して、お金の使い道を見える化
        </p>

        {/* タブ切り替え */}
        <div className="tab-group">
          <button
            type="button"
            className={`tab-btn ${!isRegisterMode ? "active" : ""}`}
            onClick={() => switchMode(false)}
          >
            ログイン
          </button>
          <button
            type="button"
            className={`tab-btn ${isRegisterMode ? "active" : ""}`}
            onClick={() => switchMode(true)}
          >
            新規登録
          </button>
        </div>

        {/* エラーメッセージ表示 */}
        {errorMessage && <div className="error-box">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="form-group">
          {isRegisterMode && (
            <div className="input-field">
              <label>ユーザー名（50文字以内）</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="例：家計簿 太郎"
                maxLength={50}
                required
              />
            </div>
          )}

          <div className="input-field">
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="input-field">
            <label>パスワード{isRegisterMode && "（8文字以上）"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上で入力"
              minLength={isRegisterMode ? 8 : 1}
              required
            />
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading
              ? "処理中..."
              : isRegisterMode
                ? "アカウントを登録する"
                : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
