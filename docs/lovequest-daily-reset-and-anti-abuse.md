# LoveQuest 每日重置、防刷與日期來源

> 狀態：**現況說明**（2026-06）  
> 本文件描述目前實作，**不代表已採用雲端時間**。現階段刻意維持本機日期判斷，避免高風險大範圍重構。

---

## 摘要

| 項目 | 現況 |
|------|------|
| 「今日」邊界 | 幾乎全部使用本機 `todayKey()`（手機曆法 `YYYY-MM-DD`） |
| 防刷主體 | localStorage：`dailyRewardLedger`、`coupleExp`、`choreRewardClaims` 等 |
| LoveCoin / growth 雲端 | Supabase RPC + `idempotency_key` 防重複送單，但 key 內嵌的日期由 client 組裝 |
| AI 每日配額 | Supabase `lovequest_ai_daily_usage`，但 `usage_date` 由 client 傳入 YMD |
| 改手機時間 | **可能**影響每日獎勵與 streak（見下文風險） |
| 是否改雲端時間 | **暫不** — 待產品／穩定度允許再分階段遷移 |

---

## 1. 日期來源：`todayKey()` 與本機時間

### 核心函式

位置：`src/coupleRpg/lib/dates.ts`

```ts
todayKey(d = new Date()) → "YYYY-MM-DD"  // getFullYear / getMonth / getDate（本機時區）
offsetDateKey(days, base?)               // 從某日 key 偏移
weekKey(d)                               // "YYYY-Www"（UTC 週一制，與 todayKey 時區不一致）
```

另有與 `todayKey()` 等價的 `todayUsageDateYmd()`（`src/coupleRpg/lib/coupleAssistantApi.ts`），供 AI 配額使用。

### 換日機制

多數功能**沒有午夜 timer**。而是在下次讀取／操作時比對：

- 儲存的 `date` / `anchorDate` / `days[dateKey]` 是否等於 `todayKey()`
- 若不等 → 視為新的一天，建立新的 day record 或重置 guard

### 儲存 scope

- User 資料 key：`lovequest-*-{userId}`（`src/coupleRpg/storage/persist.ts`）
- 防刷帳本登出後仍保留：`dailyRewardLedger`、`coupleExp`、`choreRewardClaims`、`weeklyChallenge`（見 `LOGOUT_PRESERVED_USER_SCOPED_KEYS`）
- 未登入：`isLedgerWritable()` 為 false → **不寫帳本、不發獎**

---

## 2. 防刷架構（local 為主）

### 2.1 `dailyRewardLedger`（Phase 2 主帳本）

檔案：`src/coupleRpg/storage/dailyRewardLedgerStore.ts`

- Scope key：`{userId}::{coupleId}`（未綁定情侶時 `solo`）
- 每日紀錄：`scopes[...].days["YYYY-MM-DD"]`

| 欄位 | 用途 |
|------|------|
| `loveTaskSlotsClaimed[]` | 今日戀愛任務 2 槽，各領一次 |
| `loveTaskAllComplete` | 2/2 加碼是否已領 |
| `miniGameRewardCount` | 小遊戲獎勵次數（Free 3 / Pro 5） |
| `loveFlameRecorded` | 當日火苗是否已記錄 |
| `level3ComboClaimed` | Lv.3+ 連擊加成（每日一次） |
| `currentStreak` / `lastInteractionDate` | 愛情火苗連續天數 |

發獎流程：**先** `tryClaim*` 寫入帳本，成功後才發 LoveCoin / EXP。

### 2.2 `coupleExp`（情侶 EXP，與 LoveCoin 分離）

檔案：`src/coupleRpg/storage/coupleExpStore.ts`

- 每日上限：`DAILY_EXP_CAP = 80`
- 家事 EXP：每日最多 `CHORE_EXP_DAILY_MAX = 3` 次
- 結構：`scopes[...].days[dateKey].claims` + `expEarned`
- 發放：`tryGrantCoupleExp()` 先寫 claim 再累加 `totalExp`

### 2.3 `choreRewardClaims`（家事 LoveCoin）

檔案：`src/coupleRpg/storage/choreRewardClaimsStore.ts`

- Key：`{dateKey}::{taskId}`（與重新分配無關，防刷自訂家事）
- 每日次數：Free 5 / Pro 10（`choreRewardLimits.ts`）

### 2.4 其他 local 防刷

| 儲存 | 檔案 | 說明 |
|------|------|------|
| `weeklyChallenge` | `weeklyChallengeStore.ts` | 週一為週起點；進度來自本週 ledger 累計 |
| `rpg.dailyGuard` | `rpgLogic.ts` | 舊版每日 guard：晚餐 ≤2、約會 1 次、檔案重要日子 1 次（與 ledger 部分並行） |
| `flirtGames.completedToday` | `flirtGamesStore.ts` | 每種撩妹遊戲每日完成一次 |
| `tasks.date` + reroll | `tasksStore.ts` | 跨日 `ensureTodayTasks()` 重生任務與 reroll 計數 |
| `rpg.lastLoginDate` / `loginStreak` | `rewardsStore.ts` | 登入獎勵與連續登入天數（local） |

### 2.5 未登入

`isLedgerWritable(ctx)` 要求 `getActiveStorageUserId() === ctx.userId`。未登入時完成互動**不發獎**，避免刷新重複領取。

---

## 3. 雲端 wallet：`idempotency_key` 與 client 日期

檔案：`src/coupleRpg/services/coinWalletSyncService.ts`、`src/coupleRpg/lib/coinIdempotency.ts`

- LoveCoin：`user_wallets` + `user_coin_transactions`
- Couple growth： `couple_wallets` + `couple_growth_transactions`
- RPC：`lovequest_post_user_coin_transaction`、`lovequest_post_growth_event` 等

**防重複**：同一 `idempotency_key` 重送不會雙重入帳。

**限制**：key 字串由 **client 組裝**，通常內嵌 `todayKey()`，例如：

```
earn:task:2026-06-05:slot-0
earn:minigame:2026-06-05:1
earn:housework:2026-06-05:{taskId}
```

因此：

- Server 防的是「同一 key 重複提交」
- **不是**「使用者改手機日期後用新 key 再領一次」

本地仍須先通過 `dailyRewardLedger` / `coupleExp` 等帳本，才會觸發 `recordGrowthEvent` 上雲。

---

## 4. AI 配額：Supabase table + client YMD

檔案：`src/coupleRpg/services/aiUsageService.ts`、`src/coupleRpg/context/AiUsageContext.tsx`

- Table：`lovequest_ai_daily_usage`（`user_id` + `usage_date`）
- `usage_date` 預設：`todayUsageDateYmd()` ≡ 本機 `YYYY-MM-DD`
- 上限：Free 1 / Pro 10（`aiUsageLimits.ts`，與 server guard 對齊）

Server 有持久化列，但**哪一天**仍信任 client 傳入的日期字串。

---

## 5. 使用每日判斷的功能一覽

| 功能 | 每日規則 | 主要防刷依據 |
|------|----------|--------------|
| 今日戀愛任務 | 2 槽 + 2/2 加碼 | `dailyRewardLedger` |
| 任務 reroll | Free 1 / Pro 3 每槽 | `tasks.rerollsByTaskId`（換日重置） |
| 小遊戲獎勵 | Free 3 / Pro 5 | `dailyRewardLedger.miniGameRewardCount` |
| EXP | 80 / 天 | `coupleExp` |
| 家事 LoveCoin | Free 5 / Pro 10 | `choreRewardClaims` |
| 家事 EXP | ≤3 / 天 | `coupleExp` |
| 愛情火苗 / streak | 每日首次互動 | `dailyRewardLedger` |
| 登入獎勵 | 跨日 heart+EXP（無 LoveCoin） | `rpg.lastLoginDate` |
| 晚餐 / 約會 / 檔案獎勵 | 2 / 1 / 1 次 | `rpg.dailyGuard` |
| 每週挑戰 | 週一累計 | `weeklyChallenge` + ledger |
| 今日獲得顯示 | 當日 earn 加總 | `earnHistory` / 雲端 tx |
| 今日動態 | 依 `dateKey` 分組 | local `activityLog`（可雲端 sync） |
| 今日一句 | 跨日換句 | `dailyMessage` |
| 今日推薦 | 無每日邏輯 | 僅 UI |
| 題庫 | 無每日次數限制 | Pro 解鎖靜態題量 |

**LoveCoin 沒有全站「每日總上限」**，為各功能分開計次。

---

## 6. 改手機時間的風險

| 風險等級 | 影響 |
|----------|------|
| **高** | 戀愛任務、小遊戲獎勵、EXP 80、家事獎勵、登入 streak — 全依 local `todayKey()` 與 local ledger |
| **中高** | 火苗 streak（`lastInteractionDate` 與昨日比對）、`dailyGuard` 雙軌 |
| **中** | 雲端 LoveCoin：可組新 idempotency key；每週挑戰週界 |
| **低～中** | AI：`usage_date` 由 client 傳入 |
| **低／無** | 今日推薦、題庫、純顯示類 |

**結論**：在現架構下，調整裝置日期**可能**繞過每日次數與 streak 意圖。這是已知取捨，非近期 bug 單點修復目標。

---

## 7. 現階段決策：暫不改成雲端時間

### 為何不現在改

1. **影響面大**：任務、小遊戲、EXP、火苗、家事、wallet RPC、UI hydrate 皆綁 `todayKey()`
2. **雙軌狀態**：`dailyRewardLedger` 與 `rpg.dailyGuard` 並存，遷移需收斂
3. **離線／登入競態**：近期已強化 wallet hydrate；再加 server day 需更謹慎的 merge
4. **產品風險**：改「幾點算換日」可能改變使用者已習慣的本地行為

**現行策略**：維持本機 `todayKey()` + local ledger 防刷 + 雲端 idempotency；文件化行為與風險，待版本規劃再分階段遷移。

---

## 8. 未來遷移建議（僅規劃，未實作）

優先順序：

### Phase 1 — 帳本權威化（最高優先）

1. **`dailyRewardLedger`** → Supabase 每日獎勵列（或 JSON blob per user/couple/day）
2. **`coupleExp`** → 同上，保留 claim + 80 cap 語意
3. **RPC `date_key`** → 由 server 依 `timezone('utc', now())` 或使用者時區產生，client 只送 `action`，不組「今日」

### Phase 2 — 周邊與收斂

4. **`choreRewardClaims`**、**`weeklyChallenge`** 雲端化  
5. **收斂 `rpg.dailyGuard`** 進 ledger，避免雙軌  
6. **AI `usage_date`** 改 server 決定  

### Phase 3 — 體驗統一

7. Boot 時拉 **server day offset**（可選），單一 `getLoveQuestDayKey()` 取代散落 `todayKey()`  
8. 統一 `weekKey()`（UTC）與 `getWeekStartDateMonday()`（local）的時區策略  

### 遷移原則（建議）

- Remote 有資料 → **以 remote 為準**（與 wallet hydrate 相同精神）
- 合併採 `max(count)` / union claims，不要用空陣列覆蓋
- 保留 `idempotency_key`，但 key 的 date 段由 server 填入或驗證

---

## 9. 相關程式路徑速查

| 主題 | 路徑 |
|------|------|
| 日期工具 | `src/coupleRpg/lib/dates.ts` |
| 每日獎勵帳本 | `src/coupleRpg/storage/dailyRewardLedgerStore.ts` |
| 情侶 EXP | `src/coupleRpg/storage/coupleExpStore.ts` |
| 家事領獎 | `src/coupleRpg/storage/choreRewardClaimsStore.ts` |
| 今日任務 | `src/coupleRpg/storage/tasksStore.ts` |
| RPG daily guard | `src/coupleRpg/storage/rpgLogic.ts` |
| Idempotency keys | `src/coupleRpg/lib/coinIdempotency.ts` |
| 雲端 wallet | `src/coupleRpg/services/coinWalletSyncService.ts` |
| Hydrate / 發獎編排 | `src/coupleRpg/context/LoveQuestContext.tsx` |
| AI 配額 | `src/coupleRpg/services/aiUsageService.ts` |
| Storage keys | `src/coupleRpg/storage/keys.ts` |

---

## 10. 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-06 | 初版：盤點現況；明確暫不遷移雲端時間 |
