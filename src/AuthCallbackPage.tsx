import { useEffect, useState } from 'react';
import { AuthDebugPanel } from './components/AuthDebugPanel';
import { completeAuthCallback, type AuthCallbackFlow } from './services/auth/completeAuthCallback';
import { authLog, isAuthNativeClient } from './services/auth/authDebug';
import { redirectAfterAuthSuccess, scrubAuthCallbackUrl } from './services/auth/authRedirect';
import { AUTH_ROUTE_EVENT, hasOAuthCallbackParams } from './services/auth/authRoute';
import { waitForOAuthCallbackParams } from './services/auth/waitForOAuthCallbackParams';
import { getSupabaseClient } from './supabaseClient';

type Status = 'pending' | 'ok' | 'fail';

const copy = {
  zh: {
    pending: '正在完成登入…',
    okEmail: '信箱驗證成功，歡迎回到 LoveQuest ❤️',
    okOauth: '登入成功，歡迎回到 LoveQuest ❤️',
    okSub: '正在帶你回到 App…',
    failTitle: '無法完成登入',
    back: '返回 LoveQuest',
    noClient: '無法連線驗證服務，請稍後再試。',
  },
  en: {
    pending: 'Finishing sign-in…',
    okEmail: 'Email verified — welcome back to LoveQuest ❤️',
    okOauth: 'Signed in — welcome back to LoveQuest ❤️',
    okSub: 'Taking you back to the app…',
    failTitle: 'Sign-in could not be completed',
    back: 'Back to LoveQuest',
    noClient: 'Verification service is unavailable. Please try again later.',
  },
} as const;

function detectLang(): keyof typeof copy {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function okTitle(flow: AuthCallbackFlow, lang: keyof typeof copy): string {
  const t = copy[lang];
  return flow === 'email' ? t.okEmail : t.okOauth;
}

function CallbackSpinner() {
  return (
    <span
      className="inline-block h-10 w-10 shrink-0 animate-spin rounded-full border-[3px] border-rose-200 border-t-rose-500"
      aria-hidden
    />
  );
}

function callbackUrlKey(): string {
  return `${window.location.search}|${window.location.hash}`;
}

export function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('pending');
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const [flow, setFlow] = useState<AuthCallbackFlow>('unknown');
  const [urlKey, setUrlKey] = useState(() => callbackUrlKey());
  const lang = detectLang();
  const t = copy[lang];
  const showDebug = isAuthNativeClient();

  useEffect(() => {
    authLog('AuthCallbackPage.mount', { href: window.location.href, urlKey });
  }, [urlKey]);

  useEffect(() => {
    const sync = () => setUrlKey(callbackUrlKey());
    window.addEventListener(AUTH_ROUTE_EVENT, sync);
    return () => window.removeEventListener(AUTH_ROUTE_EVENT, sync);
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) {
      setFailMessage(t.noClient);
      setStatus('fail');
      return;
    }

    let cancelled = false;
    setStatus('pending');
    setFailMessage(null);

    const run = async () => {
      try {
        if (!hasOAuthCallbackParams()) {
          const ready = await waitForOAuthCallbackParams();
          if (cancelled) return;
          if (!ready) {
            setFailMessage(
              lang === 'zh'
                ? '未取得登入回傳參數，請再試一次 Google 登入。'
                : 'Missing sign-in callback parameters. Please try Google sign-in again.'
            );
            setStatus('fail');
            return;
          }
        }

        authLog('AuthCallbackPage.start', {
          href: window.location.href,
          search: window.location.search,
          hash: window.location.hash,
        });

        const outcome = await completeAuthCallback(sb);

        scrubAuthCallbackUrl();

        if (!outcome.ok) {
          const { data: { session: recovered } } = await sb.auth.getSession();
          if (recovered?.access_token) {
            authLog('AuthCallbackPage.recover_session_after_fail', {
              message: outcome.message,
            });
            setFlow('oauth');
            setStatus('ok');
            await redirectAfterAuthSuccess(sb);
            return;
          }
          if (cancelled) return;
          setFailMessage(outcome.message);
          setStatus('fail');
          authLog('AuthCallbackPage.fail', { message: outcome.message });
          return;
        }

        if (cancelled) {
          const { data: { session: recovered } } = await sb.auth.getSession();
          if (!recovered?.access_token) return;
        }

        setFlow(outcome.flow);
        setStatus('ok');
        authLog('AuthCallbackPage.success', { flow: outcome.flow });
        await redirectAfterAuthSuccess(sb);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { data: { session: recovered } } = await sb.auth.getSession();
        if (recovered?.access_token) {
          authLog('AuthCallbackPage.recover_session_after_exception', { message: msg });
          setFlow('oauth');
          setStatus('ok');
          await redirectAfterAuthSuccess(sb);
          return;
        }
        if (cancelled) return;
        authLog('AuthCallbackPage.exception', { message: msg });
        setFailMessage(lang === 'zh' ? `登入處理失敗：${msg}` : `Sign-in failed: ${msg}`);
        setStatus('fail');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lang, t.noClient, urlKey]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-rose-50/95 via-[#fef8fa] to-pink-50/90 px-6 py-12 text-[#3a2e34]">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-rose-200/50 bg-white/85 p-8 text-center shadow-[0_16px_48px_-16px_rgba(244,114,182,0.28)] backdrop-blur-md">
        {status === 'pending' ? (
          <>
            <div className="mb-6 flex justify-center">
              <CallbackSpinner />
            </div>
            <p className="text-[15px] font-semibold text-[#3a2e34]">{t.pending}</p>
          </>
        ) : status === 'ok' ? (
          <>
            <p className="text-3xl leading-none" aria-hidden>
              ❤️
            </p>
            <h1 className="mt-4 text-lg font-bold leading-snug text-[#3a2e34]">
              {okTitle(flow, lang)}
            </h1>
            <p className="mt-3 text-[14px] text-[#8a7a84]">{t.okSub}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-[#3a2e34]">{t.failTitle}</h1>
            <p className="mt-3 whitespace-pre-wrap text-left text-[13px] leading-relaxed text-red-800">
              {failMessage ?? (getSupabaseClient() ? t.failTitle : t.noClient)}
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.replace('/');
              }}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-rose-400 to-pink-400 py-3 text-[15px] font-bold text-white shadow-md shadow-rose-300/40 transition active:scale-[0.99]"
            >
              {t.back}
            </button>
          </>
        )}
        {showDebug ? <AuthDebugPanel /> : null}
      </div>
    </div>
  );
}
