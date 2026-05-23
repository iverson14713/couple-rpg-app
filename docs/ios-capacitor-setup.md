# LoveQuest — Capacitor iOS 包裝

最小可運作 iOS 殼（無推播、無 IAP）。Web 技術棧：Vite + React，原生殼：Capacitor。

## 已安裝套件

| 套件 | 用途 |
|------|------|
| `@capacitor/core` | 執行期 API |
| `@capacitor/cli` | `cap` 指令 |
| `@capacitor/ios` | Xcode 專案 (`/ios`) |
| `@capacitor/app` | OAuth 深連結 `appUrlOpen` |

## 專案設定摘要

- **App ID：** `com.lovequest.app`
- **顯示名稱：** LoveQuest
- **Web 輸出：** `dist`（`vite build`）
- **Native WebView 網址：** `https://lovequest.app`（Capacitor 本機 HTTPS，非真實網域）
- **路由：** 既有 `Root.tsx` pathname 路由（非 React Router）；Capacitor 本機 server 會載入 `index.html`，`/auth/callback` 等路徑可正常運作

## npm scripts

```bash
npm run build          # 僅建置 Web
npm run build:ios      # build + cap sync ios（改 UI 後常用）
npm run cap:sync       # build + cap sync（全平台）
npm run cap:sync:ios   # 同 build:ios
npm run cap:copy:ios   # 只複製 dist，不更新原生插件
npm run cap:open:ios   # 用 Xcode 開啟 ios/App/App.xcworkspace
```

## 第一次安裝（Windows 或 Mac）

```bash
git clone <repo>
cd Couple-RPG-app
npm install
```

建立 `.env`（與 Vercel 相同），至少要有：

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

建置並產生 / 同步 iOS 專案：

```bash
npm run build:ios
```

若尚未有 `ios` 資料夾（新 clone）：

```bash
npx cap add ios
npm run build:ios
```

> **注意：** 在 Windows 可 `npm install`、`npm run build`、`npx cap add ios`、`npx cap sync ios` 並把 `ios/` 提交到 Git。**編譯、模擬器、TestFlight 必須在 Mac + Xcode 上執行。**

---

## Mac 上開發與上架流程

### 1. 環境需求

- macOS 13+
- [Xcode](https://developer.apple.com/xcode/)（建議最新穩定版）
- Apple Developer 帳號（TestFlight / App Store）
- Node.js 18+、npm

```bash
cd Couple-RPG-app
npm install
npm run build:ios
npm run cap:open:ios
```

Xcode 會開啟 **`ios/App/App.xcworkspace`**（請勿只開 `.xcodeproj`）。

### 2. Signing

1. Xcode → 選專案 **App** → **Signing & Capabilities**
2. Team：選你的 Apple Developer Team
3. Bundle Identifier：`com.lovequest.app`（須與 `capacitor.config.ts` 一致）

### 3. 模擬器執行

1. 上方裝置選 iPhone 模擬器
2. **Product → Run** (⌘R)
3. 確認：App 開啟、首頁載入、可進入登入流程

### 4. 真機測試

1. iPhone 接線，信任電腦
2. Signing 選 Personal Team 或公司 Team
3. Run 到真機
4. 測試：Google / Apple / Email 登入 → 回到 App → 雲端同步（情侶空間、LoveCoin 等）

### 5. TestFlight

1. Xcode → **Product → Archive**
2. **Distribute App** → App Store Connect
3. App Store Connect 建立 App（Bundle ID `com.lovequest.app`）
4. 上傳建置版本 → TestFlight 邀請測試員

---

## Supabase Redirect URLs（必設）

Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**，加入：

```
https://lovequest.app/auth/callback
lovequest://auth/callback
```

（若仍有 Vercel 網域，請保留 production URL，例如：）

```
https://<your-vercel-domain>/auth/callback
```

**Site URL** 可維持 production 網址；原生 App 登入使用 `getAuthCallbackUrl()`，在 iOS 上固定為 `https://lovequest.app/auth/callback`。

### OAuth 行為說明

- App 內 WebView：`https://lovequest.app/...` 由 Capacitor 提供，`/auth/callback` 由 `AuthCallbackPage` + PKCE 兌換 session。
- 若 OAuth 改由系統瀏覽器完成並以 **`lovequest://auth/callback?code=...`** 回到 App，`src/native/capacitorAuthBridge.ts` 會轉成 in-app `/auth/callback` 並觸發路由。
- `Info.plist` 已註冊 URL Schemes：`lovequest`（OAuth 回 App）、`LoveQuest`（Capacitor）。

---

## 改程式後的工作流

```bash
# 1. 改 src/
# 2. 建置並同步到 iOS
npm run build:ios

# 3. Mac 上
npm run cap:open:ios
# Xcode → Run
```

僅改原生設定（Info.plist、Signing）時，可只執行：

```bash
npx cap sync ios
```

---

## 本機 Live Reload（選用，僅開發）

在 Mac 上讓實機 / 模擬器連開發中的 Vite：

1. 查 Mac 區網 IP（例如 `192.168.1.10`）
2. 暫時修改 `capacitor.config.ts`：

```ts
server: {
  url: 'http://192.168.1.10:5173',
  cleartext: true,
},
```

3. `npm run dev:client`（或 `vite`）
4. `npx cap sync ios` → Xcode Run

**上架前務必移除 `server.url`，改回僅 `hostname` + `iosScheme`。**

---

## 驗收清單（最小殼）

- [ ] `npm run build` 成功
- [ ] `npm run build:ios` 成功，`ios/App/App/public` 有最新 `index.html` / assets
- [ ] Xcode Run：App 開啟、無白屏
- [ ] 首頁與分頁路由正常（pathname）
- [ ] 登入後 Supabase session 存在，雲端同步可拉資料
- [ ] `/auth/callback` 不白屏（成功或顯示錯誤 UI）
- [ ] 未接入推播、IAP

---

## 疑難排解

| 現象 | 可能原因 | 處理 |
|------|----------|------|
| 白屏、JS 404（iOS） | Web 用了相對 base | iOS 請用 `npm run build:capacitor`（`base: './'`） |
| `/auth/callback` MIME text/html | Vercel 用了 `base: './'` | 網頁部署用 `npm run build`（`base: '/'`） |
| OAuth 後回不来 | Redirect URL 未加 | 補 Supabase 兩條 callback URL |
| callback 白屏 | env 未打入 build | Mac 上 `.env` 存在後重新 `npm run build:ios` |
| Google 登入失敗 | WebView 限制 | 改用系統瀏覽器 + `lovequest://auth/callback` scheme（見 `docs/google-oauth-ios-deeplink.md`） |
| AI 顯示「請求失敗 HTTP 200」 | 打到本機 `index.html` 而非 API | 重新 `npm run build:ios`（原生會連 `couple-rpg-app.vercel.app`）；本機測 API 可設 `VITE_ASSISTANT_SERVER_URL=http://<Mac IP>:8788` |
| `cap open ios` 失敗 | 不在 Mac | 只能在 macOS 開 Xcode |

---

## 相關檔案

- `capacitor.config.ts` — App ID、webDir、hostname
- `src/native/capacitorAuthBridge.ts` — 深連結 → `/auth/callback`
- `src/services/auth/authRedirect.ts` — `getAuthCallbackUrl()` 原生固定 origin
- `ios/App/App/Info.plist` — URL Schemes
- `ios/App/App.xcworkspace` — Xcode 入口
