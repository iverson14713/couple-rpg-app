export type AuthLang = 'zh' | 'en';

const zh: Record<string, string> = {
  not_configured: '雲端登入尚未設定，請稍後再試。',
  generic: '登入時發生問題，請稍後再試。',
  invalid_credentials: '帳號或密碼不正確。',
  email_not_confirmed: '請先到信箱完成驗證，再登入。',
  already_registered: '此信箱已註冊，請改為登入。',
  weak_password: '密碼不符合要求，請改用更長或更複雜的密碼。',
  missing_fields: '請輸入電子郵件與密碼。',
  oauth_cancelled: '已取消登入，可隨時再試一次。',
  link_expired: '驗證連結已過期，請重新註冊或申請新信件。',
  link_invalid: '連結無效或已使用，請重新登入。',
  no_session: '無法完成登入，請回到 App 再試一次。',
  no_client: '無法連線驗證服務，請稍後再試。',
  apple_coming_soon: 'Apple 登入即將開放，請先使用 Google 或 Email。',
  apple_web_coming_soon: 'Apple 登入即將開放，請先使用 Google 或 Email。',
  apple_provider_not_ready:
    'Apple 登入尚未完成後台設定。請至 Supabase 啟用 Apple Provider，並設定 VITE_APPLE_OAUTH_ENABLED=true 後重新 build:ios。',
};

const en: Record<string, string> = {
  not_configured: 'Cloud sign-in is not configured yet.',
  generic: 'Something went wrong while signing in. Please try again.',
  invalid_credentials: 'Invalid email or password.',
  email_not_confirmed: 'Please confirm your email from the inbox, then sign in.',
  already_registered: 'This email is already registered — try signing in.',
  weak_password: 'Password does not meet requirements — try a longer password.',
  missing_fields: 'Please enter email and password.',
  oauth_cancelled: 'Sign-in was cancelled. You can try again anytime.',
  link_expired: 'This verification link has expired. Request a new email or sign up again.',
  link_invalid: 'This link is invalid or already used. Please sign in again.',
  no_session: 'Could not finish sign-in. Go back to the app and try again.',
  no_client: 'Verification service is unavailable. Please try again later.',
  apple_coming_soon: 'Sign in with Apple is coming soon. Use Google or email for now.',
  apple_web_coming_soon: 'Sign in with Apple is coming soon. Use Google or email for now.',
  apple_provider_not_ready:
    'Sign in with Apple is not configured. Enable Apple in Supabase and set VITE_APPLE_OAUTH_ENABLED=true, then rebuild the iOS app.',
};

function dict(lang: AuthLang): Record<string, string> {
  return lang === 'zh' ? zh : en;
}

export function mapAuthErrorMessage(
  err: unknown,
  lang: AuthLang = 'zh'
): string {
  const d = dict(lang);
  if (err instanceof Error) {
    if (err.message === 'not_configured') return d.not_configured;
    if (err.message === 'no_session') return d.no_session;
    if (err.message === 'missing_fields') return d.missing_fields;
    if (err.message === 'apple_not_enabled' || err.message === 'apple_web_coming_soon') {
      return d.apple_coming_soon;
    }
    if (err.message === 'apple_provider_not_ready') return d.apple_provider_not_ready;
    const low = err.message.toLowerCase();
    if (low.includes('invalid login credentials')) return d.invalid_credentials;
    if (low.includes('email not confirmed')) return d.email_not_confirmed;
    if (low.includes('already registered') || low.includes('user already registered')) {
      return d.already_registered;
    }
    if (low.includes('password')) return d.weak_password;
    if (low.includes('expired') || low.includes('otp_expired')) return d.link_expired;
    if (low.includes('access_denied') || low.includes('user cancelled')) return d.oauth_cancelled;
    if (low.includes('invalid') && low.includes('link')) return d.link_invalid;
    if (err.message.trim()) return err.message;
    return d.generic;
  }
  if (typeof err === 'string') return mapAuthErrorMessage(new Error(err), lang);
  return d.generic;
}

function decodeOAuthDescription(raw: string | null): string {
  if (!raw?.trim()) return '';
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
  } catch {
    return raw.trim();
  }
}

/** Prefer full error_description on screen (do not hide behind generic copy). */
export function mapOAuthCallbackError(
  errorCode: string | null,
  description: string | null,
  lang: AuthLang = 'zh'
): string {
  const d = dict(lang);
  const decoded = decodeOAuthDescription(description);
  const code = (errorCode ?? '').trim();

  const parts: string[] = [];
  if (decoded) parts.push(decoded);
  if (code) parts.push(lang === 'zh' ? `錯誤代碼：${code}` : `error_code: ${code}`);

  if (parts.length > 0) return parts.join('\n\n');

  const descLow = decoded.toLowerCase();
  const codeLow = code.toLowerCase();
  if (codeLow === 'access_denied' || descLow.includes('access_denied')) return d.oauth_cancelled;
  if (codeLow.includes('expired') || descLow.includes('expired') || descLow.includes('otp_expired')) {
    return d.link_expired;
  }
  return d.link_invalid;
}
