import { useState, useEffect } from 'react';
import { startLogin, logout, isLoggedIn, onSessionExpired } from './utils/auth.js';
import { queryFreebusy } from './utils/api.js';
import { computeFreeSlots, checkAvailability } from './utils/freebusy.js';
import { CLIENT_ID } from './config.js';
import { PRESET_CONTACTS } from './contacts.js';
// 全域 contact map，供 warning 顯示姓名用
window.__contactMap = Object.fromEntries(PRESET_CONTACTS.map(c => [c.email, c.name]));
import EmailTagInput from './components/EmailTagInput.jsx';
import QueryConfig from './components/QueryConfig.jsx';
import SlotList from './components/SlotList.jsx';
import ContactPicker from './components/ContactPicker.jsx';
import SlotDetail from './components/SlotDetail.jsx';
import SlotQueryForm from './components/SlotQueryForm.jsx';
import AvailabilityResult from './components/AvailabilityResult.jsx';

export default function App() {
  const [authState, setAuthState]   = useState('loggedOut'); // loggedOut | loggingIn | loggedIn
  const [userEmail, setUserEmail]   = useState(null);
  const [activeTab, setActiveTab]   = useState('common');    // 'common' | 'check'
  const [error, setError]           = useState(null);
  const [warning, setWarning]       = useState(null); // 略過人員的提示

  // ── 頁籤一：找共同空檔 ──────────────────────────────────────
  const [emails, setEmails]         = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [results, setResults]       = useState([]);
  const [queried, setQueried]       = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ── 頁籤二：指定時段查誰有空 ───────────────────────────────
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult]   = useState(null);
  const [checkQueried, setCheckQueried] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) setAuthState('loggedIn');

    // 當 token 靜默刷新失敗時，自動跳回登入畫面並提示
    onSessionExpired(() => {
      logout();
      setAuthState('loggedOut');
      setError('登入已過期（超過 1 小時），請重新登入。');
    });
  }, []);

  // 切換頁籤時清除錯誤
  function switchTab(tab) {
    setActiveTab(tab);
    setError(null);
    setWarning(null);
  }

  async function handleLogin() {
    setAuthState('loggingIn');
    setError(null);
    try {
      const { userEmail: email } = await startLogin();
      setUserEmail(email);
      setAuthState('loggedIn');
    } catch (err) {
      setError(err.message || 'Google 授權失敗，請再試一次');
      setAuthState('loggedOut');
    }
  }

  // ── 頁籤一：查共同空閒 ──────────────────────────────────────
  async function handleCommonQuery({ startDate, endDate, workStart, workEnd, minDuration }) {
    setIsLoading(true);
    setError(null);
    setWarning(null);
    setQueried(false);
    try {
      const timeMin = `${startDate}T00:00:00+08:00`;
      const timeMax = `${endDate}T23:59:59+08:00`;
      const { calendars, skipped } = await queryFreebusy({ emails, timeMin, timeMax });
      if (skipped.length > 0) {
        setWarning({ skipped, queried: Object.keys(calendars).length });
      }
      setResults(computeFreeSlots(calendars, { startDate, endDate, workStart, workEnd, minDuration }));
      setQueried(true);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  // ── 頁籤二：指定時段查誰有空 ───────────────────────────────
  async function handleCheckQuery({ emails: queryEmails, timeMin, timeMax, date, startTime, endTime }) {
    setCheckLoading(true);
    setError(null);
    setWarning(null);
    setCheckQueried(false);
    try {
      const { calendars, skipped } = await queryFreebusy({ emails: queryEmails, timeMin, timeMax });
      if (skipped.length > 0) {
        setWarning({ skipped, queried: Object.keys(calendars).length });
      }
      const { free, busy } = checkAvailability(calendars, timeMin, timeMax);
      setCheckResult({ free, busy, date, startTime, endTime, skipped });
      setCheckQueried(true);
    } catch (err) {
      setError(err.message);
      setCheckResult(null);
    } finally {
      setCheckLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setAuthState('loggedOut');
    setUserEmail(null);
    setEmails([]);
    setResults([]);
    setQueried(false);
    setSelectedSlot(null);
    setCheckResult(null);
    setCheckQueried(false);
    setError(null);
  }

  // ─── 未設定 CLIENT_ID 警告 ──────────────────────────────────
  if (!CLIENT_ID) {
    return (
      <div className="app">
        <div className="setup-warning">
          <h1>設定尚未完成</h1>
          <p>請在專案根目錄建立 <code>.env.local</code> 檔案，並加入：</p>
          <pre>VITE_GOOGLE_CLIENT_ID=你的_Google_OAuth_Client_ID</pre>
          <p>詳細設定步驟請參閱 <code>README.md</code>。</p>
        </div>
      </div>
    );
  }

  // ─── 未登入 / 登入中 ────────────────────────────────────────
  if (authState !== 'loggedIn') {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <h1 className="app-title">共同空閒查詢工具</h1>
            <p className="app-subtitle">弈樂科技 YILE Technology</p>
            <p className="login-desc">
              查詢多位同事在指定時間內的共同空閒時段，輕鬆安排面試與跨部門會議。
            </p>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn-google" onClick={handleLogin} disabled={authState === 'loggingIn'}>
              {authState === 'loggingIn' ? (
                <><span className="spinner" />授權中...</>
              ) : (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  使用 Google 登入
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 已登入 ─────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title-sm">共同空閒查詢工具</h1>
          <span className="header-subtitle">弈樂科技</span>
        </div>
        <div className="header-right">
          {userEmail && <span className="user-email">{userEmail}</span>}
          <button className="btn-logout" onClick={handleLogout}>登出</button>
        </div>
      </header>

      {/* 頁籤列 */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'common' ? 'active' : ''}`}
          onClick={() => switchTab('common')}
        >
          🔍 找共同空檔
        </button>
        <button
          className={`tab-btn ${activeTab === 'check' ? 'active' : ''}`}
          onClick={() => switchTab('check')}
        >
          👤 指定時段查誰有空
        </button>
      </div>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {warning && (
          <div className="alert alert-warning">
            <div style={{flex:1}}>
              <strong>⚠️ 以下 {warning.skipped.length} 人的日曆無法存取，已略過（其餘 {warning.queried} 人查詢正常）：</strong>
              <div className="warning-skipped">
                {warning.skipped.map(({ email, errors }) => {
                  const reason = errors?.[0]?.reason || errors?.[0]?.message || '未知原因';
                  const name = window.__contactMap?.[email] || email;
                  return <div key={email}>• {name}（{email}）— <em>{reason}</em></div>;
                })}
              </div>
            </div>
            <button className="alert-close" onClick={() => setWarning(null)}>×</button>
          </div>
        )}

        {/* ── 頁籤一：找共同空檔 ── */}
        {activeTab === 'common' && (
          <>
            <section className="card">
              <EmailTagInput emails={emails} onChange={setEmails} />
              <ContactPicker selectedEmails={emails} onChange={setEmails} />
            </section>
            <section className="card">
              <QueryConfig onQuery={handleCommonQuery} isLoading={isLoading} emailCount={emails.length} />
            </section>
            <SlotList results={results} isLoading={isLoading} queried={queried} onSlotClick={setSelectedSlot} />
            <SlotDetail slot={selectedSlot?.slot} date={selectedSlot?.date} emails={emails} onClose={() => setSelectedSlot(null)} />
          </>
        )}

        {/* ── 頁籤二：指定時段查誰有空 ── */}
        {activeTab === 'check' && (
          <>
            <section className="card">
              <SlotQueryForm onQuery={handleCheckQuery} isLoading={checkLoading} />
            </section>
            <AvailabilityResult result={checkResult} isLoading={checkLoading} queried={checkQueried} />
          </>
        )}
      </main>
    </div>
  );
}
