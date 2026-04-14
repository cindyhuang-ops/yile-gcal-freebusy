// Google OAuth 設定
// CLIENT_ID 請在 .env.local 中設定 VITE_GOOGLE_CLIENT_ID=your_client_id
// 絕對不可將 Client Secret 放入前端程式碼或 Git Repository
// Client ID 可安全公開（這是 OAuth 的設計，不是密碼）
// 注意：絕對不可放 Client Secret，這裡只放 Client ID
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '948040829282-568l11g1971qg3muuv3qrrangt6cmre5.apps.googleusercontent.com';

export const REDIRECT_URI = window.location.origin + window.location.pathname.replace(/\/$/, '');

export const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export const OAUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

export const FREEBUSY_ENDPOINT = 'https://www.googleapis.com/calendar/v3/freeBusy';

export const TIMEZONE = 'Asia/Taipei';
