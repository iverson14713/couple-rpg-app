import { useEffect, useState } from 'react';
import { AuthDebugPanel } from './components/AuthDebugPanel';
import { completeAuthCallback, type AuthCallbackFlow } from './services/auth/completeAuthCallback';
import { authLog, isAuthNativeClient } from './services/auth/authDebug';
import { redirectAfterAuthSuccess, scrubAuthCallbackUrl } from './services/auth/authRedirect';
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

export function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('pending');
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const [flow, setFlow] = useState<AuthCallbackFlow>('unknown');
  const lang = detectLang();
  const t = copy[lang];
  const showDebug = isAuthNativeClient();

  useEffect(() => {
    authLog('AuthCallbackPage.mount', { href: window.location.href });
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) {
      setFailMessage(t.noClient);
      setStatus('fail');
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const outcome = await completeAuthCallback(sb);
        if (cancelled) return;

        scrubAuthCallbackUrl();

        if (!outcome.ok) {
          setFailMessage(outcome.message);
          setStatus('fail');
          authLog('AuthCallbackPage.fail', { message: outcome.message });
          return;
        }

        setFlow(outcome.flow);
        setStatus('ok');
        authLog('AuthCallbackPage.success', { flow: outcome.flow });
        redirectAfterAuthSuccess(1400);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        authLog('AuthCallbackPage.exception', { message: msg });
        setFailMessage(lang === 'zh' ? `登入處理失敗：${msg}` : `Sign-in failed: ${msg}`);
        setStatus('fail');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [lang, t.noClient]);

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
