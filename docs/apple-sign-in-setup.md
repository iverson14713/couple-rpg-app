# LoveQuest — Sign in with Apple（iOS / Supabase）

App 已提供 Google 第三方登入，**iOS 上架須提供 Sign in with Apple**。LoveQuest iOS 版使用與 Google 相同流程：Supabase OAuth → 外部瀏覽器 → `lovequest://auth/callback`。

---

## 一、Apple Developer（developer.apple.com）

### 1. App ID

1. **Certificates, Identifiers & Profiles** → **Identifiers** → 選 `com.lovequest.app`（或建立）
2. 勾選 **Sign In with Apple** → Save
3. 若已存在 App ID，Edit → 啟用 **Sign In with Apple**

### 2. Services ID（給 Supabase / Web OAuth 回調）

1. **Identifiers** → **+** → **Services IDs**
2. Identifier 範例：`com.lovequest.app.auth`（需與 Supabase 內填的一致）
3. 勾選 **Sign In with Apple** → Configure：
   - **Primary App ID**：`com.lovequest.app`
   - **Domains and Subdomains**：你的 Supabase 專案網域（不含 `https://`）  
     例：`vshkphziukpmrdpjmtpg.supabase.co`
   - **Return URLs**（必須完全一致）：
     ```
     https://<PROJECT_REF>.supabase.co/auth/v1/callback
     ```
     例：`https://vshkphziukpmrdpjmtpg.supabase.co/auth/v1/callback`
4. Save

### 3. Key（Supabase 用 Client Secret 簽章）

1. **Keys** → **+**
2. 名稱例：`LoveQuest Supabase Apple Auth`
3. 勾選 **Sign In with Apple** → Configure → 選 Primary App ID `com.lovequest.app`
4. Register 後 **下載 `.p8`（僅一次）**，記下 **Key ID**
5. 記下 **Team ID**（Membership 頁面）

### 4. Xcode（本機）

1. 開啟 `ios/App/App.xcworkspace`
2. Target **App** → **Signing & Capabilities** → **+ Capability** → **Sign In with Apple**
3. Bundle ID：`com.lovequest.app`
4. 確認 **Info.plist** 已有 URL Scheme：`com.lovequest.app`（專案已設定）

---

## 二、Supabase Dashboard

專案：`https://<PROJECT_REF>.supabase.co`

### 1. Authentication → Providers → Apple

| 欄位 | 填寫 |
|------|------|
| Enable Apple provider | ON |
| Client IDs | Services ID，例 `com.lovequest.app.auth`（若 Supabase 要求可多個，以逗號分隔） |
| Secret Key | 貼上由 **Team ID + Key ID + `.p8` + Services ID** 產生的 JWT（見 Supabase 文件「Generate Apple client secret」） |

Supabase 文件：[Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)

### 2. Authentication → URL Configuration

**Redirect URLs** 須包含（與 Google 共用）：

```
lovequest://auth/callback
https://lovequest.app/auth/callback
https://couple-rpg-app.vercel.app/auth/callback
```

（開發時可另加 `http://localhost:5173/auth/callback`）

### 3. 驗證

- Authentication → Logs：點 Apple 登入後查看是否有 `token` / `oauth` 錯誤

---

## 三、LoveQuest 專案環境變數

建置 iOS 時使用 `npm run build:capacitor`（`--mode capacitor`）。

在 **`.env`** 或 **`.env.capacitor`**（建議）加入：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APPLE_OAUTH_ENABLED=true
```

未設 `VITE_APPLE_OAUTH_ENABLED=true` 時，iOS 仍會顯示 Apple 按鈕，點擊會提示後台尚未啟用（不會白屏）。

---

## 四、測試步驟（真機建議）

1. `npm run build:ios` → Xcode Run
2. 設定 → Google / Apple 登入
3. 點 **使用 Apple 登入** → 外部 Safari → 登入 → 回到 App
4. Xcode Console 搜尋 `[LQ_AUTH]`：
   - `apple.click`
   - `apple.response`
   - `apple.callback`
5. 確認已登入、雲端同步正常

---

## 五、常見錯誤

| 現象 | 可能原因 |
|------|----------|
| `Provider apple is not enabled` | Supabase Apple Provider 未開啟 |
| `invalid_client` | Services ID / Secret / Return URL 與 Supabase 不一致 |
| 回到 App 但沒登入 | Redirect URLs 缺少 `lovequest://auth/callback` |
| 無法開啟瀏覽器 | 非 Capacitor 原生環境 |
