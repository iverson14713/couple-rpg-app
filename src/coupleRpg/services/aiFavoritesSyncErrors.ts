/** PostgREST / Supabase errors for AI favorites sync. */
export type AiFavoritesSyncErrorInfo = {
  message: string;
  code: string | null;
  /** Do not auto-retry (e.g. table missing on server). */
  permanent: boolean;
  userMessage: string;
};

function readPostgrestCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

function readPostgrestMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
}

/** True when migration `user_ai_favorites` was not applied to the linked project. */
export function isAiFavoritesTableMissingError(error: unknown): boolean {
  const code = readPostgrestCode(error);
  const message = readPostgrestMessage(error).toLowerCase();
  return (
    code === 'PGRST205' ||
    (message.includes('user_ai_favorites') && message.includes('schema cache'))
  );
}

export function getAiFavoritesSyncErrorInfo(error: unknown): AiFavoritesSyncErrorInfo {
  const message = readPostgrestMessage(error);
  const code = readPostgrestCode(error);

  if (isAiFavoritesTableMissingError(error)) {
    return {
      message,
      code,
      permanent: true,
      userMessage: '雲端收藏尚未啟用（資料表未建立），請更新 Supabase 後再試',
    };
  }

  return {
    message,
    code,
    permanent: false,
    userMessage: '收藏同步失敗，稍後會再試',
  };
}
