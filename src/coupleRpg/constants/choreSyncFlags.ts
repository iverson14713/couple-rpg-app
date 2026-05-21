/** 家事項目清單（public.chores）是否同步 Supabase */
export const ENABLE_CHORE_ITEMS_CLOUD_SYNC = true;

/** 今日家事分配 / chore_records 是否強制同步 — 預設關閉，僅本機 + 今日動態 */
export const ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC = false;

/** @deprecated 請改用 ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC */
export const ENABLE_CHORE_CLOUD_SYNC = ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC;
