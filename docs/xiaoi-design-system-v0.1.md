# 小愛怪 Design System v0.1

> 資料層收斂文件。v0.1 **不含**動畫、養成、Pro 造型、Widget Swift 改動。

## 目的

建立首頁 Hero、Widget、遊戲、分享卡可共用的小愛狀態與視覺 metadata 單一來源（TypeScript），同時維持既有 UI 與對外 API 不變。

## 四種狀態

| state | displayName | 情緒 tone | 觸發情境（App） |
|-------|-------------|-----------|-----------------|
| `happy` | 今天好幸福 | joyful | 已登入、已綁定、火苗 > 0、未斷互動、**今天已互動** |
| `sad` | 小愛在等你 | lonely | 上述皆通過，**今天尚未互動**，且非深夜時段 |
| `sleepy` | 小愛睡著了 | calm | 上述皆通過，**今天尚未互動**，且為深夜時段 |
| `back_angry` | 小愛鬧脾氣了 | upset | 未登入、未綁定、火苗為 0、或連續 2 天以上未互動 |

## 狀態判斷優先順序（App / TypeScript）

實作：`src/coupleRpg/lib/xiaoiState.ts` → `getXiaoiState()`

```
1. isLoggedIn === false          → back_angry（登入提示文案）
2. isCoupleBound === false        → back_angry（綁定提示文案）
3. flameDays <= 0                 → back_angry
4. daysSinceLastInteraction > 1   → back_angry（連續 2 天以上沒互動）
5. hasInteractedToday === true    → happy（必須明確 true；false/undefined 不算）
6. hour >= 22 || hour < 7         → sleepy（22:00–06:59，今天尚未互動）
7. else                           → sad
```

**重要規則**

- `happy` 優先於 `sleepy`：只要今天已互動，深夜也顯示 happy。
- `back_angry` **僅**用於：未登入、未綁定、火苗 0、連續 2 天以上未互動。
- `hasInteractedToday` 必須為 `true` 才進入 happy；`false` / `undefined` 不會 happy。

## TS / Swift 狀態規則對照

| 項目 | TypeScript（App） | Swift（Widget） | v0.1 對齊 |
|------|-------------------|-----------------|-----------|
| 實作檔 | `lib/xiaoiState.ts` | `ios/LoveQuestWidget/LoveQuestXiaoiState.swift` | App 已更新 |
| 未登入文案 | `登入後讓小愛陪你們互動` | `快把愛哄回來` | ⚠️ Swift 待對齊 |
| 未綁定文案 | `綁定另一半，喚醒你們的小愛` | `快把愛哄回來` | ⚠️ Swift 待對齊 |
| 深夜時段 | `hour >= 22 \|\| hour < 7` | `hour >= 22 \|\| hour < 7` | ✅ |
| 火苗 0 | `back_angry` | `back_angry` | ✅ |
| 2 天以上未互動 | `daysSince > 1` → `back_angry` | 同左 | ✅ |
| 今日已互動 | `hasInteractedToday === true` | `hasInteractedToday` payload | ✅（語意相同） |
| happy 優先於 sleepy | ✅ | ✅ | ✅ |

> **Phase 2+ 建議**：在 Swift 對齊深夜 22:00 門檻與 contextual `back_angry` 文案，並以本文件為對照表。

## 圖片對照

### App（React）

| state | imageName | 檔案路徑 |
|-------|-----------|----------|
| happy | `xiaoi_happy` | `src/assets/xiaoi/xiaoi_happy.png` |
| sad | `xiaoi_sad` | `src/assets/xiaoi/xiaoi_sad.png` |
| sleepy | `xiaoi_sleepy` | `src/assets/xiaoi/xiaoi_sleepy.png` |
| back_angry | `xiaoi_back_angry` | `src/assets/xiaoi/xiaoi_back_angry.png` |
| promo | `xiaoi_promo` | `src/assets/xiaoi/xiaoi_promo.png`（設定頁，非狀態） |

解析：`src/assets/xiaoi/index.ts` → `resolveXiaoiImage()`

### Widget（iOS）

| state | 原圖 asset | Pet widget 裁切版 |
|-------|------------|-------------------|
| happy | `xiaoi_happy` | `xiaoi_widget_happy` |
| sad | `xiaoi_sad` | `xiaoi_widget_sad` |
| sleepy | `xiaoi_sleepy` | `xiaoi_widget_sleepy` |
| back_angry | `xiaoi_back_angry` | `xiaoi_widget_back_angry` |

路徑：`ios/LoveQuestWidget/Assets.xcassets/`  
裁切腳本：`scripts/crop-xiaoi-widget-images.py`

## 文案對照

| state | Hero caption（`message`） | API `detailMessage` | Widget（Swift `widgetMessage`） |
|-------|---------------------------|---------------------|----------------------------------|
| happy | 今天好幸福 💕 | 互動完成，小愛超開心 💕 | 今天好幸福 💕 |
| sad | 我在等你們說說話…🥺 | 今天還沒互動，別冷落對方 🥺 | 今天還沒互動 🥺 |
| sleepy | 晚安，明天也要好好愛對方 | 明天也要好好愛對方 | 明天也要愛對方 |
| back_angry | 快把我們的愛哄回來 | 快把我們的愛哄回來 | 快把愛哄回來 |
| back_angry（未登入） | — | 登入後讓小愛陪你們互動 | — |
| back_angry（未綁定） | — | 綁定另一半，喚醒你們的小愛 | — |

Hero caption 來源：`XIAOI_HERO_MESSAGES`（由 `xiaoiStateProfiles.message` 衍生）  
Widget 小卡額外文案：`LoveQuestPetWidget.swift` 的 `petWidgetSmall/MediumStatusLine`（與 Hero caption 接近，細節略有差異）

## 程式碼結構（v0.1）

```
src/coupleRpg/xiaoi/
├── types.ts                 # XiaoiState, XiaoiStateProfile, XiaoiStateResult
├── xiaoiStateProfiles.ts    # XIAOI_STATE_PROFILES（單一真相來源）
└── index.ts                 # 對外 export

src/coupleRpg/lib/
├── xiaoiState.ts            # getXiaoiState()、XIAOI_HERO_MESSAGES（相容層）
└── xiaoiVisualConfig.ts     # XIAOI_VISUAL_CONFIG（委派 profiles.heroLayout）
```

### Profile 欄位

每個 state 的 `XIAOI_STATE_PROFILES` 包含：

- `state`, `displayName`, `message`, `detailMessage`, `widgetMessage`
- `imageName`, `widgetImageName`
- `animationClass`（v0.1 為空字串，預留）
- `shadowStyle`, `mainColor`, `emotionalTone`
- `heroLayout`（`scale`, `offsetX`, `offsetY`）

## 未來消費端（尚未實作）

| 場景 | 建議元件 / API | 狀態 |
|------|----------------|------|
| 首頁 Hero | `XiaoiHeroStage` → 未來 `XiaoiAnimatedPet` | 現用 Hero，layout 未動 |
| Widget | Swift `LoveQuestXiaoiState` + profiles 對照文件 | Swift 待對齊 |
| 遊戲 | `XiaoiStaticPet` + `getXiaoiState()` | Phase 2 |
| 分享卡 | `XiaoiStaticPet` variant | Phase 2 |
| 設定頁預覽 | `XiaoiStaticPet` | Phase 2 |

## v0.1 明確不做

- 2.5D / CSS 動畫
- Hero layout / CSS 調整
- Widget UI / Swift resolver 改動
- 養成、商店、等級、換裝、Pro 造型
- 刪除 `src/coupleRpg/assets/xiaoi/` 重複目錄

## Phase 2 建議

1. 新增 `XiaoiStaticPet` / `XiaoiAnimatedPet`（薄封裝，DOM 不變）
2. `XiaoiHeroStage` 改從 `getXiaoiStateProfile()` 讀 profile
3. `xiaoiDevPreview.ts` 改讀 profiles，移除 `XIAOI_DEV_PREVIEW` 重複常數
4. Swift 對齊深夜 22:00 與 contextual `back_angry` 文案
5. 可選：`SettingsWidgetScreen` 接 `XiaoiStaticPet` 預覽
