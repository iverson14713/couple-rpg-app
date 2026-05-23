# iOS Google OAuth — Deep link 設定

外部瀏覽器完成 Google 登入後，Supabase 會導向 **custom URL scheme**，由 iOS 喚回 LoveQuest。若 Xcode 沒有 `[LQ_AUTH] appUrlOpen`，代表 deep link 未到 App。

## 1. Supabase（必做）

**Authentication → URL Configuration → Redirect URLs** 加入（逐字複製）：

```
lovequest://auth/callback
https://couple-rpg-app.vercel.app/auth/callback
https://lovequest.app/auth/callback
```

- 原生 OAuth 使用：`lovequest://auth/callback`
- 不要用 `com.lovequest.app://`（iOS Safari 常無法喚回帶點的 scheme）

儲存後等約 1 分鐘再測。

## 2. iOS Info.plist（專案已設定）

`ios/App/App/Info.plist` → **CFBundleURLSchemes**：

```xml
<string>lovequest</string>
```

Bundle ID 仍是 `com.lovequest.app`；**URL scheme 與 Bundle ID 不必相同**。

## 3. 程式碼對應

| 項目 | 值 |
|------|-----|
| `getOAuthRedirectUrl()` | `lovequest://auth/callback` |
| `NATIVE_OAUTH_URL_SCHEME` | `lovequest` |

## 4. 成功時 Xcode Console 應出現

```
[LQ_AUTH] bridge.init
[LQ_AUTH] google.click { isNative: true, redirectTo: "lovequest://auth/callback" }
[LQ_AUTH] Browser.open.success
[LQ_AUTH] appUrlOpen { url: "lovequest://auth/callback?code=...", matchesCallback: true }
[LQ_AUTH] navigateToAuthCallback.start
[LQ_AUTH] AuthCallbackPage.start
```

## 5. 仍沒有 appUrlOpen 時

1. 確認 Supabase Redirect URLs **已儲存** `lovequest://auth/callback`（不是舊的 `com.lovequest.app://`）
2. Xcode **Clean Build Folder** 後重新 Run（Info.plist 變更需重裝）
3. 刪除模擬器上的 App 再安裝
4. 在設定 → Google 登入 Debug 查看 `supabaseRedirectUrlsChecklist`
