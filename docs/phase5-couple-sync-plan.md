# LoveQuest 第五階段：雙人綁定與資料同步 MVP

> 本文件為**實作計畫**；SQL 已放在 `supabase/migrations/20260521120000_lovequest_couples_phase5.sql`。  
> 原則：**不大改現有功能**，localStorage 優先，登入且綁定後才雙向同步。

---

## 1. 目標與範圍

| 項目 | MVP 內 | 第五階段後續 |
|------|--------|----------------|
| 建立 / 加入情侶空間 | ✅ | 離開空間、轉移 owner |
| 邀請碼 | ✅ 6 碼、RPC 產生 | 過期、撤銷、用量上限 |
| 成員列表（最多 2 人） | ✅ | 頭像、slot 自訂 |
| 晚餐選項 / 決定 | ✅ 表 + 同步 | realtime |
| 家事項目 / 完成紀錄 | ✅ | pending spin 正規化 |
| 每日戀愛任務 | ✅ `love_task_records` | 與本地 seed 對齊 |
| 約會完成紀錄 | ✅ `date_idea_records` | 收藏 / 當前建議 |
| RPG 數值 | ✅ `couple_stats` | conflict 策略細化 |
| 曖昧小遊戲 / 完成歷史 / activity | ⏳ `couple_stats.app_state` JSON | 拆表（5b） |
| Realtime 訂閱 | ❌ | 5c |
| 離線佇列 | ❌ 仍用本地 | 5c `offlineSync` 擴充 |

---

## 2. 資料表對照（localStorage ↔ Supabase）

| localStorage key | 本地型別 | Supabase 表 | 備註 |
|------------------|----------|-------------|------|
| `lovequest-couple` | `CoupleProfile` | `couples.partner_*_label` | 顯示名，非 auth 帳號 |
| `lovequest-dinner` | `DinnerData` | `food_options` + `food_decisions` | options ↔ options；history ↔ decisions |
| `lovequest-housework` | `HouseworkData` | `chores` + `chore_records` | `pendingSpin` → `couple_stats.app_state.pending_spin` |
| `lovequest-tasks` | `TasksData` | `love_task_records` | 以 `task_date` + `client_id` upsert |
| `lovequest-flirt-games` | `FlirtGamesData` | `couple_stats.app_state.flirt_games` | 5b 可拆表 |
| `lovequest-date-planner` | `DatePlannerData` | `date_idea_records` + `app_state` | history ↔ records；filters/favorites/current → app_state |
| `lovequest-rpg` | `RpgState` | `couple_stats` | 欄位一對一 |
| `lovequest-completion-history` | `CompletionRecord[]` | `app_state.completion_history` 或 5b | MVP 可先不同步 |
| `lovequest-activity` | `ActivityLogEntry[]` | 不同步或 app_state | 低優先 |

**新增本地 key（建議）：**

- `lovequest-couple-space-id` — 目前綁定的 `couple_id`
- `lovequest-sync-meta` — `{ lastPulledAt, lastPushedAt, version }`

---

## 3. RLS 與安全

- 所有業務表以 `couple_id` 隔離。
- `is_couple_member()` / `is_couple_owner()` 為 `SECURITY DEFINER`，避免 `couple_members` 遞迴 RLS（比照 `is_cat_member`）。
- 前端僅使用 **anon key**；建立 / 加入走 RPC：`create_couple_space`、`accept_couple_invite`。
- `couple_members` 上限 2：`enforce_couple_member_limit` trigger + RPC 內檢查。
- MVP：每位使用者僅允許加入 **一個** couple（RPC 拋 `already_in_couple`）。

---

## 4. 同步策略（MVP）

```
┌─────────────┐     登入 + 已綁定      ┌──────────────┐
│ localStorage│ ◄──────────────────► │   Supabase   │
└─────────────┘                      └──────────────┘
       ▲                                      │
       │ 未登入 / 未綁定 / 離線 / API 失敗      │
       └──────────── 僅本地讀寫 ────────────────┘
```

### 4.1 啟動流程（`LoveQuestProvider` 擴充）

1. 載入 localStorage（現狀不變）。
2. 若 `auth.user` 且存在 `couple_id`：
   - **Pull**：依表拉取 → 合併進 context state → 寫回 localStorage（快取）。
   - 若雲端為空、本地有資料 → **Push** 一次（初次遷移）。
3. 若 Supabase 錯誤 → `syncStatus: 'offline'`，繼續用本地。

### 4.2 寫入流程（各 action 不變對外 API）

1. 先更新 React state + localStorage（現有 `saveJson`）。
2. 若已綁定且線上 → 背景 `upsert` 對應表（失敗只 log，不阻擋 UI）。
3. **衝突（MVP）**：以 `updated_at` 較新者為準；同欄位以雲端列 `id` 存在為準做 last-write-wins。

### 4.3 不做的（本階段）

- 全表雙向 merge 演算法、CRDT、Realtime channel。
- 刪除同步（MVP 以 upsert 為主，刪除可標記 `deleted_at` 留到 5b）。

---

## 5. 前端修改計畫（分 PR / 小步）

### Step 5.0 — 本輪交付 ✅

- [x] SQL migration + 本計畫文件
- [ ] 你在 Supabase Dashboard 執行 migration 或 `supabase db push`

### Step 5.1 — 綁定 UI（最小改動）

**新增檔案**

| 檔案 | 職責 |
|------|------|
| `src/coupleRpg/services/coupleSpaceApi.ts` | `createCoupleSpace`, `acceptInvite`, `fetchMembers`, `fetchMyCouple` |
| `src/coupleRpg/components/CoupleBindSection.tsx` | 設定頁：建立 / 輸入邀請碼 / 成員狀態 |
| `src/coupleRpg/hooks/useCoupleSpace.ts` | 讀寫 `couple_id`、成員列表、loading / error |

**修改檔案**

| 檔案 | 變更 |
|------|------|
| `SettingsPage.tsx` | 插入 `<CoupleBindSection />`（在 `AuthSettingsSection` 下方） |
| `storage/keys.ts` | `coupleSpaceId`, `syncMeta` |
| `LoveQuestContext.tsx` | 僅加 `coupleSpace` slice（id、members、inviteCode、syncStatus）— **尚不接資料同步** |

**UI 行為**

- 未登入：提示先登入。
- 已登入未綁定：按鈕「建立情侶空間」、輸入框「輸入邀請碼加入」。
- 已綁定：顯示邀請碼、成員 1/2 或 2/2、另一半顯示名（來自 `profiles`）。

### Step 5.2 — 單向 Push（本地 → 雲端）

**新增**

| 檔案 | 職責 |
|------|------|
| `src/coupleRpg/sync/mappers.ts` | local ↔ row 轉換 |
| `src/coupleRpg/sync/pushLocalToCloud.ts` | 綁定後首次上傳 |
| `src/coupleRpg/sync/pullCloudToLocal.ts` | 拉取並覆寫/合併本地 |

**修改**

| 檔案 | 變更 |
|------|------|
| `LoveQuestContext.tsx` | 綁定成功後呼叫 `pushLocalToCloud`；登入恢復時 `pull` |
| 各 `*Store.ts` | 可選：抽出 `loadX`/`saveX` 不變，sync 層呼叫它們 |

### Step 5.3 — 操作時背景同步

在既有 context action 末尾加 `syncQueue.enqueue(...)`：

- `addDinnerOption` / `saveDinnerResult` → `food_options`, `food_decisions`
- `addHouseworkItem` / `completeHouseworkSpin` → `chores`, `chore_records`
- `toggleDailyTask` → `love_task_records`
- `completeCurrentDate` → `date_idea_records` + `couple_stats`
- `grantReward` 路徑 → `couple_stats`

`app_state` 同步：`pending_spin`, `flirt_games`, `date_planner`（filters/favorites/current）。

### Step 5.4 —  polish

- 設定頁「重新同步」按鈕
- 錯誤碼對應中文：`couple_full`, `invalid_invite`, `already_in_couple`
- `SettingsPage` 雲端區塊改為真實 sync 狀態
- 可選：TypeScript 型別 `src/types/supabase.lovequest.ts`（手寫或 codegen）

---

## 6. RPC 一覽

| 函式 | 說明 |
|------|------|
| `create_couple_space(display_name?, partner_a?, partner_b?)` | 建立空間 + owner + 空 stats + 回傳邀請碼 |
| `accept_couple_invite(code)` | 加入為 partner（slot B），滿員則錯誤 |
| `regenerate_couple_invite(couple_id)` | owner 重產邀請碼（UI 可選） |

---

## 7. 測試清單（手動）

1. 使用者 A 登入 → 建立空間 → 看到 6 碼邀請碼、成員 1/2。
2. 使用者 B 登入 → 輸入邀請碼 → 成員 2/2；A 重新整理也看到 B。
3. 第三人輸入同碼 → `couple_full`。
4. B 在晚餐頁新增選項 → A 拉取後看到（5.2+）。
5. 登出 / 離線 → 本地仍可玩；上線後再同步。
6. RLS：未加入的 C 無法 `select` 該 `couple_id` 資料。

---

## 8. 與舊 Pet Calendar schema 的關係

- **不修改** `cats`, `cat_members`, `cat_invite_codes` 等表。
- LoveQuest 使用獨立 `couples` 命名空間，避免與寵物「貓咪空間」混淆。
- `App.tsx` / `cloudDataSync.ts` 暫不動；僅 `src/coupleRpg/**` 接入新 API。

---

## 9. 建議實作順序（給下一個 PR）

1. 執行 SQL migration  
2. Step 5.1 綁定 UI + API  
3. Step 5.2 首次 push / pull  
4. Step 5.3 逐功能背景 sync（先 `couple_stats` + dinner，再 housework / tasks / dates）  
5. Step 5.4 polish + 手動測試  

確認本計畫後，下一輪可只做 **Step 5.1**（約 3–4 個新檔 + 2 個小改）。
