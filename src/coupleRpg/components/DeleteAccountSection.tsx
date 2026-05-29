import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Spinner } from '../../components/SkeletonCard';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { postDeleteAccount } from '../lib/accountDeleteApi';
import { AUTH_LOGIN_ANCHOR_ID, DELETE_ACCOUNT_ANCHOR_ID } from '../lib/authNav';
import { clearAllLocalDataForAccountDeletion } from '../storage/clearLoveQuestStorage';
import { setActiveStorageUserId } from '../storage/storageSession';
import { lq } from '../theme';

const CONFIRM_WORD = 'DELETE';

const FIRST_DIALOG_TEXT =
  '刪除帳號會永久刪除你的帳號、情侶綁定、雲端同步資料、回憶、獎勵與本機資料，且無法復原。';

export function DeleteAccountSection() {
  const auth = useSupabaseAuth();
  const { navigateTo, pendingScrollElementId, acknowledgePendingScroll } = useCoupleRpgNav();
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<'idle' | 'warn' | 'confirm'>('idle');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (pendingScrollElementId !== DELETE_ACCOUNT_ANCHOR_ID) return;
    acknowledgePendingScroll();
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pendingScrollElementId, acknowledgePendingScroll]);

  const closeDialogs = useCallback(() => {
    if (busy) return;
    setStep('idle');
    setTyped('');
    setError(null);
  }, [busy]);

  const finishAndReturnToLogin = useCallback(async () => {
    setActiveStorageUserId(null);
    await clearAllLocalDataForAccountDeletion();
    try {
      await auth.supabase?.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('[account-delete] local signOut failed', e);
    }
    navigateTo('profile', {
      profileSection: 'settings',
      scrollToElementId: AUTH_LOGIN_ANCHOR_ID,
    });
  }, [auth.supabase, navigateTo]);

  const handleDelete = useCallback(async () => {
    setError(null);
    if (!auth.user || !auth.session?.access_token) {
      setError('請先登入後再刪除帳號。');
      return;
    }
    if (typed.trim() !== CONFIRM_WORD) {
      setError(`請輸入 ${CONFIRM_WORD} 以確認刪除。`);
      return;
    }

    setBusy(true);
    const result = await postDeleteAccount({
      userId: auth.user.id,
      accessToken: auth.session.access_token,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setStep('idle');
    setTyped('');
    setSuccess(result.message);
    await finishAndReturnToLogin();
  }, [auth.session?.access_token, auth.user, finishAndReturnToLogin, typed]);

  if (!auth.configured || !auth.authReady || !auth.user) {
    return null;
  }

  const dialogOpen = step === 'warn' || step === 'confirm';

  const dialog = dialogOpen ? (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50"
        aria-label="取消"
        disabled={busy}
        onClick={closeDialogs}
      />
      <div className={`relative z-10 w-full max-w-md p-5 sm:p-6 ${lq.cardElevated}`}>
        <p id="delete-account-title" className={`text-[17px] font-bold ${lq.text}`}>
          {step === 'warn' ? '確定要刪除帳號？' : '最後確認'}
        </p>
        <p id="delete-account-desc" className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>
          {step === 'warn' ? FIRST_DIALOG_TEXT : '請在下方輸入 DELETE（全大寫）以永久刪除帳號。'}
        </p>

        {step === 'confirm' ? (
          <input
            type="text"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setError(null);
            }}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="輸入 DELETE"
            className="mt-4 w-full rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-3 text-[15px] font-mono outline-none focus:border-rose-400"
            aria-label="輸入 DELETE 確認刪除"
          />
        ) : null}

        {error ? <p className="mt-3 text-[12px] font-medium text-red-700">{error}</p> : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={closeDialogs}
            className={`min-h-[44px] flex-1 ${lq.btnSecondary}`}
          >
            取消
          </button>
          {step === 'warn' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep('confirm');
                setError(null);
              }}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center rounded-[14px] bg-rose-600 px-4 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-60"
            >
              繼續刪除
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || typed.trim() !== CONFIRM_WORD}
              onClick={() => void handleDelete()}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-[14px] bg-rose-700 px-4 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Spinner className="h-4 w-4 border-2 border-white/30 border-t-white" /> : null}
              永久刪除帳號
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section
      id={DELETE_ACCOUNT_ANCHOR_ID}
      ref={sectionRef}
      className={`mb-4 scroll-mt-4 border border-rose-200/80 bg-rose-50/40 p-4 ${lq.card}`}
    >
      <h2 className={`text-base font-bold text-rose-900`}>帳號</h2>
      <p className={`mt-1 text-[12px] leading-relaxed text-rose-900/80`}>
        若不再使用 LoveQuest，可在此永久刪除帳號與所有相關資料（符合 App Store 帳號刪除規範）。
      </p>

      {success ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
          {success}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setError(null);
          setTyped('');
          setStep('warn');
        }}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-rose-600 bg-white px-4 py-3 text-[15px] font-bold text-rose-700 active:scale-[0.98] disabled:opacity-60"
      >
        刪除帳號
      </button>

      {typeof document !== 'undefined' && dialog ? createPortal(dialog, document.body) : dialog}
    </section>
  );
}
