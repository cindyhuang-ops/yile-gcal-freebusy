/**
 * Google Identity Services (GIS) Token 模式
 * 純前端 SPA 推薦作法，直接取得 access_token，完全不需要 client_secret
 */

import { CLIENT_ID, SCOPES, USERINFO_ENDPOINT } from '../config.js';

let _accessToken = null;
let _tokenExpiry  = null;
let _tokenClient  = null;

// token 過期時通知 App 重新登入的 callback
let _onSessionExpired = null;
export function onSessionExpired(cb) { _onSessionExpired = cb; }

// ─── GIS 初始化 ────────────────────────────────────────────────

function waitForGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.oauth2) { clearInterval(interval); resolve(); }
      else if (attempts > 50) { clearInterval(interval); reject(new Error('Google Identity Services 載入失敗，請重新整理頁面')); }
    }, 100);
  });
}

async function getTokenClient() {
  if (_tokenClient) return _tokenClient;
  await waitForGIS();
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {},
  });
  return _tokenClient;
}

// ─── 登入 ──────────────────────────────────────────────────────

export async function startLogin() {
  const client = await getTokenClient();
  return new Promise((resolve, reject) => {
    client.callback = async (response) => {
      if (response.error) {
        reject(new Error(`Google 授權失敗：${response.error}`));
        return;
      }
      _accessToken = response.access_token;
      _tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
      const userEmail = await fetchUserEmail(_accessToken).catch(() => null);
      resolve({ accessToken: _accessToken, userEmail });
    };
    client.requestAccessToken({ prompt: '' });
  });
}

async function fetchUserEmail(accessToken) {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const info = await res.json();
  return info.email || null;
}

// ─── Token 管理 ────────────────────────────────────────────────

/**
 * 取得有效 token：若快過期則先靜默刷新；
 * 若刷新失敗（Google session 也過期）則觸發重新登入提示。
 */
export async function getValidAccessToken() {
  if (_accessToken && _tokenExpiry && Date.now() < _tokenExpiry) {
    return _accessToken;
  }
  // token 已過期，嘗試靜默刷新
  try {
    return await refreshAccessToken();
  } catch {
    // 靜默刷新失敗 → 通知 App session 已過期
    _onSessionExpired?.();
    throw new SessionExpiredError();
  }
}

/**
 * 靜默刷新（GIS requestAccessToken prompt:''）
 * 若使用者的 Google session 仍有效，不會顯示任何視窗。
 * 若 session 已失效，GIS 會回傳 error，此時拋出錯誤。
 */
export async function refreshAccessToken() {
  const client = await getTokenClient();
  return new Promise((resolve, reject) => {
    // 設一個 timeout，避免 GIS 靜默失敗時無限等待
    const timeout = setTimeout(() => {
      reject(new SessionExpiredError());
    }, 8000);

    client.callback = (response) => {
      clearTimeout(timeout);
      if (response.error) {
        logout();
        reject(new SessionExpiredError());
        return;
      }
      _accessToken = response.access_token;
      _tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
      resolve(_accessToken);
    };
    client.requestAccessToken({ prompt: '' });
  });
}

export function logout() {
  if (_accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(_accessToken, () => {});
  }
  _accessToken  = null;
  _tokenExpiry  = null;
  _tokenClient  = null;
}

export function isLoggedIn() {
  return !!(_accessToken && _tokenExpiry && Date.now() < _tokenExpiry);
}

// ─── 自訂錯誤 ─────────────────────────────────────────────────

export class SessionExpiredError extends Error {
  constructor() {
    super('登入已過期，請重新登入');
    this.name = 'SessionExpiredError';
  }
}
