import { useCallback, useState } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  formatPromoGrantedUntilZh,
  postPromoRedeem,
} from '../lib/promoRedeemApi';
import { savePromoGrantedUntil } from '../storage/promoGrantStore';
import { setUserPlan } from '../storage/planStore';
import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

export function PromoCodeSection() {
  const auth = useSupabaseAuth();
  const { refreshPlan } = useUserPlan();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onRedeem = useCallback(async () => {
    setError(null);
    setSuccess(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError('請輸入兌換碼');
      return;
    }

    if (!auth.user?.id || !auth.session?.access_token) {
      setError('請先登入後再兌換');
      return;
    }

    setBusy(true);
    try {
      const result = await postPromoRedeem(
        { userId: auth.user.id, accessToken: auth.session.access_token },
        trimmed
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }

      savePromoGrantedUntil(auth.user.id, result.grantedUntil);
      setUserPlan('pro');
      await refreshPlan();

      const untilLabel = formatPromoGrantedUntilZh(result.grantedUntil);
      setSuccess(`兌換成功！Pro 已開通至 ${untilLabel}`);
      setCode('');
    } finally {
      setBusy(false);
    }
  }, [auth.user?.id, auth.session?.access_token, code, refreshPlan]);

  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <h2 className={lq.sectionTitleSm}>兌換碼</h2>
      <p className={`mt-1 text-[13px] leading-relaxed ${lq.textSecondary}`}>
        輸入活動碼或邀請碼，領取 Pro 權益
      </p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="輸入兌換碼"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        disabled={busy}
        className={`mt-3 w-full ${lq.input}`}
        aria-label="兌換碼"
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => void onRedeem()}
        className={`mt-3 min-h-[44px] w-full ${lq.btnPrimary}`}
      >
        {busy ? '兌換中…' : '立即兌換'}
      </button>

      {success ? (
        <p
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-900"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-2 text-[11px] leading-snug text-stone-500">
        兌換碼僅供活動、邀請或贈送使用，請勿至 App 以外購買。
      </p>
    </section>
  );
}
