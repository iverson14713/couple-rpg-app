import { authLog } from './authDebug';
import { hasOAuthCallbackParams } from './authRoute';

/** 等 deep link 把 ?code= 寫進 WebView URL（避免尚未帶參數就判定失敗）。 */
export async function waitForOAuthCallbackParams(options?: {
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const intervalMs = options?.intervalMs ?? 40;
  const deadline = Date.now() + timeoutMs;

  if (hasOAuthCallbackParams()) return true;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    if (hasOAuthCallbackParams()) {
      authLog('waitForOAuthCallbackParams.ok', { waitedMs: timeoutMs - (deadline - Date.now()) });
      return true;
    }
  }

  authLog('waitForOAuthCallbackParams.timeout', { timeoutMs, href: window.location.href });
  return hasOAuthCallbackParams();
}
