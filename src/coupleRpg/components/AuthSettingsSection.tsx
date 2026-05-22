import { useCallback, useMemo, useState } from 'react';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { SkeletonCard } from '../../components/SkeletonCard';
import { Spinner } from '../../components/SkeletonCard';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { handleAppleSignIn, isAppleSignInAvailable } from '../../services/auth/appleSignIn';
import { mapAuthErrorMessage } from '../../services/auth/authErrors';
import { useLoveQuest } from '../context/LoveQuestContext';
import { resolveLoggedInUserLabel } from '../lib/coupleDisplayNames';
import { lq } from '../theme';

export function AuthSettingsSection() {
  const auth = useSupabaseAuth();
  const { coupleExtended } = useLoveQuest();
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

  const appleEnabled = isAppleSignInAvailable(auth.supabase);

  const displayLabel = useMemo(
    () =>
      resolveLoggedInUserLabel({
        user: auth.user,
        profile: auth.profile,
        myNickname: coupleExtended.myNickname,
        partnerNickname: coupleExtended.partnerNickname,
      }),
    [auth.user, auth.profile, coupleExtended.myNickname, coupleExtended.partnerNickname]
  );

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
    const { error: err } = await auth.signInWithGoogle();
    if (err) setError(mapAuthErrorMessage(err));
    setGoogleBusy(false);
  }, [auth]);

  const handleApple = useCallback(async () => {
    setError(null);
    setAppleNotice(null);
    if (!appleEnabled) {
      setAppleNotice('Apple 登入即將開放，請先使用 Google 或 Email。');
      return;
    }
    setAppleBusy(true);
    const result = await handleAppleSignIn(auth.supabase);
    setAppleBusy(false);
    if (result.message === 'coming_soon') {
      setAppleNotice('Apple 登入即將開放，請先使用 Google 或 Email。');
      return;
    }
    if (!result.ok && result.message) {
      setError(mapAuthErrorMessage(new Error(result.message)));
    }
  }, [appleEnabled, auth.supabase]);

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
          登出只會結束帳號連線，不會刪除本機或雲端的情侶空間資料。
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
    <section className={`mb-4 p-4 ${lq.card}`}>
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
        <AppleSignInButton
          label={appleEnabled ? '使用 Apple 登入' : '使用 Apple 登入（即將開放）'}
          disabled={busy || googleBusy || appleBusy || !appleEnabled}
          onClick={() => void handleApple()}
        />
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
        Supabase 請將 Site URL 設為正式網域，Redirect URLs 需包含{' '}
        <span className="font-mono text-stone-500">/auth/callback</span>（本機與正式環境各一筆）。
      </p>
    </section>
  );
}
