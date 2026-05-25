import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AuthDebugPanel } from '../../components/AuthDebugPanel';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { authLog, isAuthNativeClient } from '../../services/auth/authDebug';
import { GOOGLE_CONSENT_SCREEN_HINT, logGoogleAuthSetupChecklist } from '../../services/auth/googleSignIn';
import { CAPACITOR_AUTH_SCHEME_CALLBACK } from '../../services/auth/authRedirect';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { SkeletonCard } from '../../components/SkeletonCard';
import { Spinner } from '../../components/SkeletonCard';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  getAppleProviderNotReadyMessage,
  handleAppleSignIn,
  isAppleOAuthEnabled,
  isAppleSignInNativeUi,
  isAppleSignInWebComingSoon,
} from '../../services/auth/appleSignIn';
import { mapAuthErrorMessage } from '../../services/auth/authErrors';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { AUTH_LOGIN_ANCHOR_ID } from '../lib/authNav';
import { lq } from '../theme';

export function AuthSettingsSection() {
  const auth = useSupabaseAuth();
  const { displayNames } = useLoveQuest();
  const { pendingScrollElementId, acknowledgePendingScroll } = useCoupleRpgNav();
  const sectionRef = useRef<HTMLElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [appleNotice, setAppleNotice] = useState<string | null>(null);

  const appleNativeUi = isAppleSignInNativeUi();
  const appleWebComingSoon = isAppleSignInWebComingSoon();
  const appleProviderReady = isAppleOAuthEnabled();
  const showAuthDebug = isAuthNativeClient();

  useEffect(() => {
    if (showAuthDebug) logGoogleAuthSetupChecklist();
  }, [showAuthDebug]);

  useLayoutEffect(() => {
    if (pendingScrollElementId !== AUTH_LOGIN_ANCHOR_ID) return;
    if (auth.user) {
      acknowledgePendingScroll();
      return;
    }
    if (!auth.authReady) return;
    acknowledgePendingScroll();
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const focusTimer = window.setTimeout(() => {
      emailInputRef.current?.focus({ preventScroll: true });
    }, 420);
    return () => window.clearTimeout(focusTimer);
  }, [pendingScrollElementId, acknowledgePendingScroll, auth.authReady, auth.user]);

  const displayLabel = displayNames.me;

  const handleEmailAuth = useCallback(async () => {
    setError(null);
    setMessage(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError(mapAuthErrorMessage(new Error('missing_fields')));
      return;
    }
    setBusy(true);
    try {
      if (authMode === 'signIn') {
        const { error: err } = await auth.signInWithEmail(trimmed, password);
        if (err) setError(mapAuthErrorMessage(err));
        else setMessage('登入成功。');
      } else {
        const { error: err } = await auth.signUpWithEmail(trimmed, password, displayName);
        if (err) setError(mapAuthErrorMessage(err));
        else setMessage('註冊成功！請至信箱點擊驗證連結（含垃圾郵件），完成後即可登入。');
      }
    } finally {
      setBusy(false);
    }
  }, [auth, authMode, displayName, email, password]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setMessage(null);
    setGoogleBusy(true);
    authLog('google.ui.click', { href: window.location.href });
    const { error: err } = await auth.signInWithGoogle();
    if (err) {
      authLog('google.ui.error', { message: err.message });
      setError(err.message || mapAuthErrorMessage(err));
    }
    setGoogleBusy(false);
  }, [auth]);

  const handleApple = useCallback(async () => {
    setError(null);
    setAppleNotice(null);
    if (appleWebComingSoon) {
      setAppleNotice('Apple 登入即將開放，請先使用 Google 或 Email。');
      return;
    }
    if (!appleProviderReady) {
      setError(getAppleProviderNotReadyMessage('zh'));
      return;
    }
    setAppleBusy(true);
    authLog('apple.ui.click', { href: window.location.href });
    const result = await handleAppleSignIn(auth.supabase);
    setAppleBusy(false);
    if (result.message === 'coming_soon') {
      setAppleNotice('Apple 登入即將開放，請先使用 Google 或 Email。');
      return;
    }
    if (!result.ok && result.message) {
      authLog('apple.ui.error', { message: result.message, code: result.code });
      setError(result.message || mapAuthErrorMessage(new Error(result.message)));
    }
  }, [appleProviderReady, appleWebComingSoon, auth.supabase]);

  if (!auth.configured) {
    return (
      <section className={`mb-4 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-base font-bold text-stone-900">🔐 帳號登入</h2>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
          雲端登入尚未設定。請在專案根目錄建立 `.env.local`，填入 `VITE_SUPABASE_URL` 與
          `VITE_SUPABASE_ANON_KEY` 後重新啟動。
        </p>
      </section>
    );
  }

  if (!auth.authReady) {
    return (
      <section className={`mb-4 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-base font-bold text-stone-900">🔐 帳號登入</h2>
        <p className="mb-3 text-center text-[11px] text-stone-500">正在確認登入狀態…</p>
        <SkeletonCard rows={3} />
      </section>
    );
  }

  if (auth.user) {
    return (
      <section className={`mb-4 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-base font-bold text-stone-900">🔐 已登入</h2>
        <p className="text-sm text-stone-600">
          <span className="font-bold text-rose-700">{displayLabel}</span>
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
          登出會清除本機帳號資料並回到體驗模式；雲端資料仍保留，下次登入會重新同步。
        </p>
        <button
          type="button"
          onClick={() => void auth.signOut()}
          className={`mt-3 w-full rounded-xl py-2.5 text-sm font-bold ${lq.btnSecondary}`}
        >
          登出
        </button>
      </section>
    );
  }

  return (
    <section
      id={AUTH_LOGIN_ANCHOR_ID}
      ref={sectionRef}
      className={`mb-4 scroll-mt-4 p-4 ${lq.card}`}
    >
      <h2 className="mb-2 text-base font-bold text-stone-900">🔐 帳號登入</h2>
      <p className="mb-3 text-[11px] leading-relaxed text-stone-500">
        登入後可同步雲端資料；Google / Apple 完成後會自動回到 App 首頁。
      </p>

      <div className="mb-3 space-y-2">
        <GoogleSignInButton
          label="使用 Google 登入"
          disabled={busy || googleBusy || appleBusy}
          onClick={() => void handleGoogle()}
        />
        {appleNativeUi || appleWebComingSoon ? (
          <AppleSignInButton
            label={appleNativeUi ? '使用 Apple 登入' : '使用 Apple 登入（即將開放）'}
            disabled={busy || googleBusy || appleBusy || appleWebComingSoon}
            onClick={() => void handleApple()}
          />
        ) : null}
      </div>
      {appleNotice ? (
        <p className="mb-2 text-center text-[12px] text-stone-600">{appleNotice}</p>
      ) : null}

      <p className="my-3 text-center text-[11px] font-medium text-stone-400">— 或 —</p>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${authMode === 'signIn' ? lq.btnPrimary : 'bg-stone-100 text-stone-600'}`}
          onClick={() => {
            setAuthMode('signIn');
            setError(null);
          }}
        >
          登入
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${authMode === 'signUp' ? lq.btnPrimary : 'bg-stone-100 text-stone-600'}`}
          onClick={() => {
            setAuthMode('signUp');
            setError(null);
          }}
        >
          註冊
        </button>
      </div>

      {authMode === 'signUp' ? (
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="顯示名稱（選填）"
          className="mb-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
        />
      ) : null}
      <input
        ref={emailInputRef}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="mb-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
      />
      <input
        type="password"
        autoComplete={authMode === 'signIn' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密碼"
        className="mb-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
      />

      {error ? <p className="mb-2 text-[12px] font-medium text-red-700">{error}</p> : null}
      {message ? <p className="mb-2 text-[12px] font-medium text-emerald-700">{message}</p> : null}

      <button
        type="button"
        disabled={busy || googleBusy || appleBusy}
        onClick={() => void handleEmailAuth()}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-60 ${lq.btnPrimary}`}
      >
        {busy ? <Spinner className="h-4 w-4 border-2 border-white/30 border-t-white" /> : null}
        {authMode === 'signIn' ? 'Email 登入' : 'Email 註冊'}
      </button>

      <p className="mt-3 text-[10px] leading-relaxed text-stone-400">
        Supabase Redirect URLs 需包含{' '}
        <span className="font-mono text-stone-500">/auth/callback</span> 與{' '}
        <span className="font-mono text-stone-500">{CAPACITOR_AUTH_SCHEME_CALLBACK}</span>
        。iOS 版 Google / Apple 登入會以外部瀏覽器開啟，完成後自動回到 App。
      </p>
      <p className="mt-2 text-[10px] leading-relaxed text-amber-800/90">{GOOGLE_CONSENT_SCREEN_HINT}</p>
      {showAuthDebug ? <AuthDebugPanel title="Google 登入 Debug（Xcode: [LQ_AUTH]）" /> : null}
    </section>
  );
}
