/** Map Supabase / Postgres RPC errors to user-facing Traditional Chinese copy. */
export function mapCoupleSpaceError(err: unknown): string {
  if (!err) return '發生未知錯誤，請稍後再試';

  const raw =
    err instanceof Error
      ? err.message
      : String((err as { message?: string }).message ?? (err as { error_description?: string }).error_description ?? err);

  const msg = raw.toLowerCase();

  if (msg.includes('not_authenticated') || msg.includes('not authenticated')) {
    return '請先登入';
  }
  if (msg.includes('invalid_invite')) {
    return '邀請碼不存在';
  }
  if (msg.includes('couple_full')) {
    return '情侶空間已滿';
  }
  if (msg.includes('already_in_couple')) {
    return '你已經有綁定空間';
  }
  if (msg.includes('not_configured') || msg.includes('supabase')) {
    return '尚未設定雲端服務，無法綁定';
  }
  if (msg.includes('invite_code_generation_failed')) {
    return '邀請碼產生失敗，請再試一次';
  }
  if (msg.includes('forbidden')) {
    return '沒有權限執行此操作';
  }
  if (msg.includes('jwt') || msg.includes('session')) {
    return '登入已過期，請重新登入';
  }
  if (msg.includes('does not exist') || msg.includes('schema cache')) {
    return '雲端資料庫尚未設定，請先執行 Supabase migration';
  }

  return raw.length > 120 ? '操作失敗，請稍後再試' : raw;
}
