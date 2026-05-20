# LoveQuest 第七階段：雙人同步與邀請另一半

> **本輪交付**：SQL migration + 實作計畫 + 同步策略 + 風險清單。  
> **尚未實作**：前端綁定 UI、同步程式（依本文件分 PR 進行）。

| 檔案 | 說明 |
|------|------|
| `supabase/migrations/20260523120000_lovequest_phase7_app_state_sync.sql` | Phase 7 schema（JSONB 單表同步） |
| `supabase/migrations/20260521120000_lovequest_couples_phase5.sql` | Phase 5 多表版（可選；已跑過也相容） |

---

## 1. 與 Phase 5 的差異

| 項目 | Phase 5 | Phase 7（本階段採用） |
|------|---------|----------------------|
| 資料模型 | `food_*`, `chores`, `love_task_records`… 多表 | **`couple_app_state.state` 單一 JSONB** |
| 複雜度 | 高、mapper 多 | 低、與現有 localStorage 結構對齊 |
| 衝突處理 | 逐表 `updated_at` | 整包 state + `save_couple_app_state` RPC |
| 適用 | 長期細粒度查詢 | **MVP 雙人同步優先** |

若你**尚未**執行 Phase 5：建議只跑 **Phase 7** migration。  
若**已執行** Phase 5：再跑 Phase 7 會補上 `couple_app_state`、相容 `owner_id` / `couple_name`；舊細表可暫時不用。

---

## 2. Supabase 資料模型

### 2.1 `couples`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | uuid PK | 情侶空間 ID |
| `owner_id` | uuid FK → auth.users | 建立者 |
| `invite_code` | text UNIQUE (case-insensitive) | 6 碼邀請碼 |
| `couple_name` | text | 空間顯示名稱（可選） |
| `created_at` | timestamptz | 建立時間 |

### 2.2 `couple_members`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `couple_id` | uuid FK | |
| `user_id` | uuid FK | |
| `role` | `owner` \| `partner` | |
| `joined_at` | timestamptz | |

約束：

- PK `(couple_id, user_id)`
- **每 couple 最多 2 人**（trigger `enforce_couple_member_limit`）
- **每 user 最多 1 個 couple**（unique index on `user_id`）

### 2.3 `couple_app_state`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `couple_id` | uuid PK FK | |
| `state` | jsonb | 完整 App 狀態（見 §3） |
| `updated_at` | timestamptz | 最後寫入時間（衝突判斷） |
| `updated_by` | uuid | 最後寫入者 |

### 2.4 RPC（前端僅 anon key + 使用者 JWT）

| RPC | 用途 |
|-----|------|
| `create_couple_space(couple_name?)` | 建立空間 + owner + 空 state |
| `accept_couple_invite(code)` | 以 partner 加入 |
| `regenerate_couple_invite(couple_id)` | owner 重產邀請碼 |
| `save_couple_app_state(couple_id, state, base_updated_at?)` | 帶樂觀鎖的整包寫入 |
| `my_couple_id()` | 查目前使用者所屬 couple |

---

## 3. `state` JSONB 結構（對齊 localStorage）

```ts
/** couple_app_state.state — version 供日後 migration */
type CoupleAppStateV1 = {
  version: 1;
  couple: CoupleProfile;           // lovequest-couple
  dinner: DinnerData;              // lovequest-dinner
  housework: HouseworkData;      // lovequest-housework
  tasks: TasksData;                // lovequest-tasks
  flirtGames: FlirtGamesData;      // lovequest-flirt-games
  datePlanner: DatePlannerData;    // lovequest-date-planner
  anniversaries: AnniversaryData;  // lovequest-anniversaries
  rewards: RewardsData;            // lovequest-rewards
  rpg: RpgState;                   // lovequest-rpg
  completionHistory: CompletionRecord[];
  activity: ActivityLogEntry[];
};
```

對應現有 keys：`src/coupleRpg/storage/keys.ts` 全部納入，**一次 serialize / deserialize**，減少 mapper。

建議在 `src/coupleRpg/sync/appStateSchema.ts` 定義：

- `buildAppStateFromLocal()` — 從各 store 組裝
- `applyAppStateToLocal(state)` — 寫回各 store + context
- `mergeAppState(local, remote)` — 衝突時策略（見 §5）

---

## 4. 前端修改計畫（分步、不大改）

### Step 7.0 — 本輪 ✅

- [x] Phase 7 SQL migration
- [x] 本計畫文件
- [ ] 你在 Supabase SQL Editor 執行 migration

### Step 7.1 — 綁定 UI（約 1 PR）

**新增**

| 檔案 | 職責 |
|------|------|
| `services/coupleSpaceApi.ts` | RPC 封裝：create / accept / regenerate / fetchMembers / fetchAppState |
| `components/CoupleBindSection.tsx` | 建立空間、顯示邀請碼、輸入加入、成員列表、同步狀態 |
| `hooks/useCoupleSpace.ts` | `coupleId`, `members`, `inviteCode`, `syncStatus`, `lastSyncedAt` |

**修改**

| 檔案 | 變更 |
|------|------|
| `ProfileHubPage.tsx` 或 `SettingsPage.tsx` | 用 `CoupleBindSection` 取代「敬請期待」占位 |
| `storage/keys.ts` | 新增 `coupleSpaceId`, `syncMeta` |
| `LoveQuestContext.tsx` | 僅加 `coupleSpace` slice，**尚不自動 sync 遊戲資料** |

**UI 行為**

| 狀態 | 顯示 |
|------|------|
| 未登入 | 提示先登入 |
| 已登入、未綁定 | 「建立情侶空間」+ 邀請碼輸入框 |
| 已綁定 | 邀請碼、成員 1/2 或 2/2、email 末四碼、同步狀態 |
| 同步中 / 失敗 | 黃/紅提示，不阻擋操作 |

### Step 7.2 — 首次遷移 Push（約 1 PR）

**新增**

| 檔案 | 職責 |
|------|------|
| `sync/appStateSchema.ts` | 型別 + build / apply |
| `sync/pushLocalToCloud.ts` | 綁定成功後：本地 → `save_couple_app_state` |
| `sync/pullCloudToLocal.ts` | 登入恢復：雲端 → 本地 + context |

**流程**

1. 使用者建立 / 加入 couple 成功 → 寫入 `lovequest-couple-space-id`
2. 若雲端 `state` 為空、`version` only → **Push** 本地全套
3. 若雲端已有資料 → **Pull** 覆蓋本地（首次綁定時提示「以雲端為準」可選）

### Step 7.3 — 操作後背景同步（約 1–2 PR）

在 `LoveQuestContext` 各 action 末尾：

```ts
if (syncMode === 'cloud') {
  debouncedSaveAppState(); // 300–800ms debounce
}
```

- 仍先寫 React state + localStorage（現狀不變）
- 背景呼叫 `save_couple_app_state`
- 回傳 `conflict: true` 時 → 觸發 Pull + toast「對方剛更新，已為你同步」

### Step 7.4 — Polish

- 「手動重新同步」按鈕
- 錯誤碼中文：`couple_full`, `invalid_invite`, `already_in_couple`, `forbidden`
- 可選：Realtime（`couple_app_state` postgres_changes）→ Phase 7b

---

## 5. 同步策略

### 5.1 三種執行模式

```
                    ┌─────────────────┐
                    │  LoveQuest App  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   localOnly            localOnly              cloud
 (未登入)          (已登入未綁定)         (已登入已綁定)
         │                   │                   │
         ▼                   ▼                   ▼
   localStorage only    localStorage only   localStorage
                                              + Supabase
                                              couple_app_state
```

| 模式 | 條件 | 讀 | 寫 |
|------|------|----|----|
| `localOnly` | 無 session | localStorage | localStorage |
| `localBound` | 有 session、無 couple_id | localStorage | localStorage |
| `cloud` | 有 session + couple_id | 啟動 Pull；日常以本地為準 + debounced Push | |

**Supabase 失敗**：維持 `localOnly` 行為，設 `syncStatus: 'error'`，不 throw、不白屏。

### 5.2 啟動序列（`LoveQuestProvider`）

1. 從 localStorage 載入（現狀）
2. `auth` ready 後查 `my_couple_id()` 或 `couple_members`
3. 有 `couple_id`：
   - `pullCloudToLocal()`
   - 成功 → `syncStatus: 'synced'`，更新 `syncMeta.lastPulledAt`
   - 失敗 → `syncStatus: 'offline'`，繼續用本地
4. 無 `couple_id` → `syncStatus: 'local'`

### 5.3 寫入序列（每次操作）

1. 更新 React state
2. `saveJson` 各 key（現有 store）
3. 若 `cloud` → `debouncedSaveAppState(baseUpdatedAt)`

### 5.4 衝突（MVP）

| 情境 | 策略 |
|------|------|
| 兩人同時改不同功能 | Last-write-wins（整包 state，`updated_at` 較新者勝） |
| RPC 回傳 `conflict: true` | Pull 雲端 → 覆蓋本地 → toast |
| 綁定當下本地 vs 雲端都有資料 | 預設：雲端非空用雲端；雲端空則 Push 本地 |
| 刪除資料 | MVP 整包覆蓋；細粒度 tombstone 留 Phase 7b |

### 5.5 不做的（本階段）

- CRDT / 逐欄位 merge
- 離線操作佇列持久化（僅記憶體 debounce）
- Realtime 訂閱（可 7b）
- 離開情侶空間 / 轉移 owner

---

## 6. UI 規格（設定 / 我的）

**區塊：情侶空間**

1. **建立情侶空間** — 可選輸入空間名稱 → `create_couple_space`
2. **邀請碼** — 建立後顯示 6 碼 + 複製按鈕；owner 可「重新產生」
3. **加入** — 輸入框 +「加入」→ `accept_couple_invite`
4. **成員** — 列表：角色（建立者/伴侶）、email 或 user id 末段、joined_at
5. **同步狀態** — `本地模式` / `同步中…` / `已同步 HH:mm` / `同步失敗（仍可使用）`

放置位置：**我的 → 設定** 分頁最上方（`CoupleBindSection`），與 `AuthSettingsSection` 相鄰。

---

## 7. 可能風險

| 風險 | 影響 | 緩解 |
|------|------|------|
| **整包 JSON 過大** | 請求慢、Postgres 行鎖競爭 | debounce；state 壓縮；日後拆表或分 domain key |
| **Last-write-wins 蓋掉對方** | 兩人同時玩會丟一方進度 | 衝突 Pull + toast；7b 加 Realtime / 分區版本號 |
| **Phase 5 已跑與 Phase 7 並存** | 兩套表混淆 | 文件明確：Phase 7 只用 `couple_app_state`；舊表擱置 |
| **一人綁兩個 couple** | 資料錯亂 | DB unique on `user_id`；RPC `already_in_couple` |
| **未登入卻有本地進度** | 綁定後覆蓋驚喜 | 首次 Push 前確認對話框 |
| **邀請碼暴力嘗試** | 安全 | 6 碼 + rate limit（Supabase Edge / 7b） |
| **RLS 設定錯誤** | 資料外洩 | 僅 `authenticated`；禁止 service role 進前端 |
| **JSON schema 演進** | 舊版 App 讀不懂新 state | `version` 欄 + `migrateAppState()` |
| **email 顯示隱私** | 成員列表暴露 email | 只顯示暱稱或 `***@domain`（auth metadata） |
| **PWA 快取舊 bundle** | 部署後行為不一致 | Vercel 部署後強刷；sync 失敗不 crash |

---

## 8. 測試清單（手動）

1. A 登入 → 建立空間 → 看到邀請碼、成員 1/2、`syncStatus: local→synced`
2. B 登入 → 輸入邀請碼 → 2/2；A 重新整理看到 B
3. C 輸入同碼 → `couple_full` 中文提示
4. B 完成一項戀愛任務 → A 手動同步或重開 → 看到相同進度
5. 關網操作 → 本地可玩；恢復網路 → debounced Push
6. 兩人同時改 → 後寫者覆蓋或 conflict Pull（依 RPC 結果）
7. 未登入 → 無綁定 UI 要求登入；資料僅本地
8. RLS：未加入的 D 無法 `select` 該 couple 的 `couple_app_state`

---

## 9. 建議實作順序

1. Supabase 執行 `20260523120000_lovequest_phase7_app_state_sync.sql`
2. **Step 7.1** 綁定 UI（不改遊戲邏輯）
3. **Step 7.2** 首次 Push / Pull
4. **Step 7.3** debounced 背景同步
5. **Step 7.4** polish + 手動測試

確認後下一個 PR 只做 **Step 7.1**。
