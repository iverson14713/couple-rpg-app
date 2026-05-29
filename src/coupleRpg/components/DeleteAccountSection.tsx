import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Spinner } from '../../components/SkeletonCard';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { postDeleteAccount } from '../lib/accountDeleteApi';
import {
  setAccountDeletionInProgress,
} from '../lib/accountDeletionGuard';
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
  const [finishingDelete, setFinishingDelete] = useState(false);
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

  const finishAfterDeleteSuccess = useCallback(async () => {
    const supabase = auth.supabase;
    try {
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (e) {
      console.warn('[account-delete] signOut after delete failed', e);
    }
    setActiveStorageUserId(null);
    await clearAllLocalDataForAccountDeletion();
    navigateTo('profile', {
      profileSection: 'settings',
      scrollToElementId: AUTH_LOGIN_ANCHOR_ID,
    });
  }, [auth.supabase, navigateTo]);

  const handleDelete = useCallback(async () => {
    setError(null);
    const accessToken = auth.session?.access_token;
    const userId = auth.user?.id;
    if (!userId || !accessToken) {
      setError('請先登入後再刪除帳號。');
      return;
    }
    if (typed.trim() !== CONFIRM_WORD) {
      setError(`請輸入 ${CONFIRM_WORD} 以確認刪除。`);
      return;
    }

    setBusy(true);
    setAccountDeletionInProgress(true);
    console.log('[account-delete] API request start', { userId });

    try {
      const result = await postDeleteAccount({ userId, accessToken });

      if (!result.ok) {
        console.warn('[account-delete] API failed', result.message);
        setError(result.message);
        return;
      }

      console.log('[account-delete] API success');
      setStep('idle');
      setTyped('');
      setSuccess(result.message);
      setFinishingDelete(true);
      await finishAfterDeleteSuccess();
    } catch (e) {
      console.error('[account-delete] unexpected error', e);
      setError('刪除帳號時發生錯誤，請稍後再試。');
    } finally {
      setAccountDeletionInProgress(false);
      setBusy(false);
      setFinishingDelete(false);
    }
  }, [auth.session?.access_token, auth.user?.id, finishAfterDeleteSuccess, typed]);

  const showSection = Boolean(auth.user) || finishingDelete || busy;

  if (!auth.configured || !auth.authReady || !showSection) {
    return null;
  }

  const dialogOpen = step === 'warn' || step === 'confirm';

  const dialog = dialogOpen ? (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center sm:p-6 md:p-8"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-stone-900/45"
        aria-label="取消"
        disabled={busy}
        onClick={closeDialogs}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-[0_20px_50px_-12px_rgba(28,25,23,0.35)] dark:border-stone-600 dark:bg-neutral-900 dark:text-stone-100 sm:max-w-lg sm:p-8">
        <p
          id="delete-account-title"
          className="text-[18px] font-bold leading-snug text-stone-950 dark:text-stone-50 sm:text-[20px]"
        >
          {step === 'warn' ? '確定要刪除帳號？' : '最後確認'}
        </p>

        <div
          id="delete-account-desc"
          className={
            step === 'warn'
              ? 'mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-800 dark:bg-rose-950 sm:px-5 sm:py-5'
              : 'mt-5 rounded-xl border-2 border-stone-300 bg-stone-100 px-4 py-4 dark:border-stone-500 dark:bg-stone-800 sm:px-5 sm:py-5'
          }
        >
          <p
            className={
              step === 'warn'
                ? 'text-[15px] font-semibold leading-[1.55] text-stone-950 dark:text-stone-50 sm:text-[16px] sm:leading-[1.6]'
                : 'text-[16px] font-bold leading-[1.6] text-stone-950 dark:text-stone-50 sm:text-[17px]'
            }
          >
            {step === 'warn' ? (
              FIRST_DIALOG_TEXT
            ) : (
              <>
                請在下方輸入{' '}
                <span className="font-mono text-rose-700 dark:text-rose-300">DELETE</span>
                （全大寫）以永久刪除帳號。
              </>
            )}
          </p>
        </div>

        {step === 'confirm' ? (
          <div className="mt-5">
            <label
              htmlFor="delete-account-confirm-input"
              className="mb-2 block text-[14px] font-bold text-stone-950 dark:text-stone-50"
            >
              確認文字
            </label>
            <input
              id="delete-account-confirm-input"
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
              className="min-h-[44px] w-full rounded-xl border-2 border-stone-400 bg-white px-4 py-3 text-[16px] font-mono font-bold text-stone-950 placeholder:font-sans placeholder:font-semibold placeholder:text-stone-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-300 dark:border-stone-500 dark:bg-stone-950 dark:text-stone-50 dark:placeholder:text-stone-400 dark:focus:border-rose-400 dark:focus:ring-rose-900"
              aria-label="輸入 DELETE 確認刪除"
              aria-invalid={error ? true : undefined}
            />
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-[14px] font-semibold leading-snug text-red-950 sm:text-[15px]"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={closeDialogs}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[14px] border-2 border-stone-300 bg-stone-100 px-4 py-3 text-[15px] font-semibold text-stone-900 active:scale-[0.98] disabled:opacity-60"
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
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[14px] bg-rose-600 px-4 py-3 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-60"
            >
              繼續刪除
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || typed.trim() !== CONFIRM_WORD}
              onClick={() => void handleDelete()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-rose-700 px-4 py-3 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-50"
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
