# 共同空閒查詢工具

弈樂科技 YILE Technology — HR 人員查詢多位同事共同空閒時段的 Web App。

## 功能

- 輸入多位同事 Email（Tag 形式），查詢指定日期範圍內的共同空閒時段
- 自動跳過週末，依工作時段起迄與最短空閒時間過濾
- Google OAuth 2.0 PKCE 登入，純前端，無需後端伺服器
- 繁體中文介面

---

## 使用前設定（必要）

### Step 1：建立 GCP Project 並啟用 Calendar API

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案（或選擇既有專案）
3. 前往 **APIs & Services → Library**，搜尋並啟用 **Google Calendar API**

### Step 2：建立 OAuth 2.0 憑證

1. 前往 **APIs & Services → Credentials**
2. 點選 **Create Credentials → OAuth client ID**
3. 應用程式類型選 **Web application**
4. **Authorized redirect URIs** 加入：
   - `http://localhost:5173`（本機開發）
   - 正式部署的網域（e.g. `https://你的帳號.github.io/yile-gcal-freebusy`）
5. 建立後複製 **Client ID**（**不需要** Client Secret）

### Step 3：設定 OAuth Consent Screen

1. 前往 **APIs & Services → OAuth consent screen**
2. User Type 選 **Internal**（限組織內成員）
3. Scopes 加入：`https://www.googleapis.com/auth/calendar.readonly`

> **安全提醒：** Client ID 可公開，Client Secret **絕對不可**置於前端程式碼或 Git Repository。

### Step 4：建立本地環境變數檔案

在專案根目錄建立 `.env.local`（已在 `.gitignore` 中排除）：

```
VITE_GOOGLE_CLIENT_ID=你的_Client_ID_貼在這裡
```

---

## 本機開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（http://localhost:5173）
npm run dev
```

---

## 部署到 GitHub Pages

1. 修改 `vite.config.js`，將 `base` 改為你的 repo 名稱：

```js
base: '/yile-gcal-freebusy/',
```

2. 建置靜態檔案：

```bash
npm run build
```

3. 將 `dist/` 目錄推送到 `gh-pages` 分支（可使用 [gh-pages](https://github.com/tschaub/gh-pages) 套件）：

```bash
npm install -D gh-pages
npx gh-pages -d dist
```

4. 在 GCP Console 的 OAuth 憑證中，將正式網域加入 Authorized redirect URIs。

---

## 專案結構

```
src/
├── config.js              # OAuth 設定（CLIENT_ID 等）
├── App.jsx                # 主應用：OAuth 狀態機、整體佈局
├── main.jsx               # React 入口
├── index.css              # 樣式
├── utils/
│   ├── auth.js            # OAuth 2.0 PKCE 流程
│   ├── api.js             # Google Calendar Freebusy API
│   └── freebusy.js        # 共同空閒計算演算法
└── components/
    ├── EmailTagInput.jsx  # Email Tag 輸入元件
    ├── QueryConfig.jsx    # 查詢條件表單
    └── SlotList.jsx       # 空閒時段結果列表
```

---

## 基本測試情境

| 情境 | 預期結果 |
|------|----------|
| 輸入格式錯誤的 Email | 顯示「格式不正確」 |
| 輸入重複的 Email | 顯示「已在清單中」 |
| 結束日期早於開始日期 | 顯示「結束日期不可早於開始日期」 |
| 最短空閒設為 10 分鐘 | 顯示「最短空閒時間至少 15 分鐘」 |
| 無共同空閒 | 顯示「該期間內無共同空閒時段」 |
| 對方日曆無法存取 | 顯示「無法取得 X 的日曆，請確認共享設定」 |
| Access Token 過期 | 自動 refresh，查詢繼續 |
