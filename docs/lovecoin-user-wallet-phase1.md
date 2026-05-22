# LoveCoin Phase 1 — 個人錢包

## Migration（請在 Supabase 執行）

`supabase/migrations/20260605120000_lovequest_user_coin_wallet.sql`

### 新增

- `user_wallets` — 每人 `love_coin_balance`
- `user_coin_transactions` — 個人流水（含 `couple_id` 供歸屬）
- `lovequest_post_user_coin_transaction`
- `lovequest_init_user_coin_from_local`

### 調整

- `lovequest_post_growth_event` — **不再**改 couple 的 LoveCoin；`p_love_coin_delta <> 0` 會拒絕
- `lovequest_init_growth_from_local` — couple 只寫 heart/bond/exp；LoveCoin 改走 user init

### Deprecated（不再寫入）

- `couple_wallets.love_coin_balance`
- `couple_wallets.balance`（舊共用 coin 欄位）

## 驗證：兩帳號不互扣

1. 執行 migration 後，用情侶 A、B 各登入一台裝置（或兩個瀏覽器 profile）。
2. A 完成家事／任務領 LoveCoin → A「我的 LoveCoin」增加；B 餘額不變。
3. B 完成任務 → B 增加；A 不變。
4. A 兌換商城卡券 → 只扣 A；B 仍可正常兌換自己的餘額。
5. 今日動態：雙方可看到「對方 +20 LoveCoin」文案；**不**顯示對方錢包餘額。
6. Supabase：`user_wallets` 兩列（各 `user_id`）；`couple_wallets.love_coin_balance` 不再隨 RPC 變動。

## SQL 快查

```sql
select user_id, love_coin_balance from user_wallets;
select user_id, amount, source, note, created_at
from user_coin_transactions
order by created_at desc
limit 20;
```
