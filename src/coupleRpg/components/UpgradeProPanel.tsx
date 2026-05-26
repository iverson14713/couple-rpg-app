import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BillingPeriod } from '../../subscription/types';
import { SUBSCRIPTION_PRICING } from '../../subscription/constants';
import { fetchStoreProductPrices, isNativeIapAvailable } from '../../subscription/iapBridge';
import {
  PRO_ACTIVE_CONTEXT_BOUND,
  PRO_ACTIVE_DESCRIPTION,
  PRO_ACTIVE_TITLE,
  PRO_BENEFIT_LINES,
  PRO_BTN_LATER,
  PRO_BTN_MONTHLY,
  PRO_BTN_RESTORE,
  PRO_BTN_YEARLY,
  PRO_IAP_IOS_ONLY,
  PRO_LEGAL_AUTO_RENEW,
  PRO_LEGAL_MANAGE,
  PRO_PLAN_DESCRIPTION,
  PRO_PLAN_TAGLINE,
  PRO_PLAN_TITLE,
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  PRO_PRICE_YEARLY_AVG,
  getProCoupleContextMessage,
} from '../lib/proPlanContent';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

type Props = {
  onLater?: () => void;
  showLaterButton?: boolean;
};

export function UpgradeProPanel({ onLater, showLaterButton = true }: Props) {
  const { isPro, purchasePro, restorePurchases, iapBusy, planLoading } = useUserPlan();
  const { isFullyBound } = useCoupleSpace();
  const coupleContext = getProCoupleContextMessage(isFullyBound);
  const iapAvailable = isNativeIapAvailable();
  const busy = iapBusy || planLoading;

  const [priceMonthly, setPriceMonthly] = useState(PRO_PRICE_MONTHLY);
  const [priceYearly, setPriceYearly] = useState(PRO_PRICE_YEARLY);

  useEffect(() => {
    if (!iapAvailable) return;
    void fetchStoreProductPrices().then((prices) => {
      if (prices.monthly) setPriceMonthly(prices.monthly);
      if (prices.yearly) setPriceYearly(prices.yearly);
    });
  }, [iapAvailable]);

  if (isPro) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-[20px] font-extrabold text-violet-900">{PRO_ACTIVE_TITLE}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-violet-800/90">{PRO_ACTIVE_DESCRIPTION}</p>
        </div>
        {isFullyBound ? (
          <p className="rounded-xl bg-violet-50/80 px-3 py-2 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-100">
            {PRO_ACTIVE_CONTEXT_BOUND}
          </p>
        ) : null}
        {iapAvailable ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void restorePurchases()}
            className={`min-h-[44px] w-full ${lq.btnSecondary}`}
          >
            {busy ? '處理中…' : PRO_BTN_RESTORE}
          </button>
        ) : null}
      </div>
    );
  }

  const purchase = (period: BillingPeriod) => {
    if (!iapAvailable) return;
    void purchasePro(period);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[20px] font-extrabold tracking-tight text-stone-900">{PRO_PLAN_TITLE}</p>
        <p className="mt-1 text-[15px] font-bold text-rose-600">{PRO_PLAN_TAGLINE}</p>
        <p className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>{PRO_PLAN_DESCRIPTION}</p>
        <p className="mt-2 rounded-xl bg-rose-50/70 px-3 py-2 text-[12px] font-semibold text-rose-900/90 ring-1 ring-rose-100/80">
          {coupleContext}
        </p>
      </div>

      <section className={`rounded-2xl p-3.5 ${lq.cardSoft}`}>
        <h3 className={`mb-2.5 ${lq.sectionTitleSm}`}>Pro 權益</h3>
        <ul className="space-y-2">
          {PRO_BENEFIT_LINES.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[13px] font-semibold text-stone-700">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-stone-100 bg-white p-3 text-center ring-1 ring-stone-100">
          <p className="text-[11px] font-bold text-stone-500">月費</p>
          <p className="mt-1 text-[20px] font-extrabold text-stone-900">{priceMonthly}</p>
          <p className="text-[10px] text-stone-400">{SUBSCRIPTION_PRICING.monthly.labelZh}</p>
        </div>
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/80 p-3 text-center">
          <p className="text-[11px] font-bold text-violet-700">年費</p>
          <p className="mt-1 text-[20px] font-extrabold text-stone-900">{priceYearly}</p>
          <p className="text-[10px] font-semibold text-violet-600">{PRO_PRICE_YEARLY_AVG}</p>
        </div>
      </section>

      <div className="space-y-2 text-[10px] leading-relaxed text-stone-500">
        <p>{PRO_LEGAL_AUTO_RENEW}</p>
        <p>{PRO_LEGAL_MANAGE}</p>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="/privacy" className="font-semibold text-rose-600 underline-offset-2 hover:underline">
            隱私政策
          </a>
          <a href="/terms" className="font-semibold text-rose-600 underline-offset-2 hover:underline">
            服務條款
          </a>
        </p>
      </div>

      {!iapAvailable ? (
        <p className="rounded-xl bg-stone-100 px-3 py-2.5 text-center text-[12px] font-semibold text-stone-600">
          {PRO_IAP_IOS_ONLY}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !iapAvailable}
          onClick={() => purchase('monthly')}
          className={`min-h-[48px] w-full ${lq.btnSecondary}`}
        >
          {busy ? '處理中…' : `${PRO_BTN_MONTHLY} · ${priceMonthly}`}
        </button>
        <button
          type="button"
          disabled={busy || !iapAvailable}
          onClick={() => purchase('yearly')}
          className={`min-h-[48px] w-full ${lq.btnPrimary}`}
        >
          {busy ? '處理中…' : `${PRO_BTN_YEARLY} · ${priceYearly}`}
        </button>
        <button
          type="button"
          disabled={busy || !iapAvailable}
          onClick={() => void restorePurchases()}
          className={`min-h-[44px] w-full text-[13px] font-bold text-violet-700 underline-offset-2 hover:underline disabled:opacity-50`}
        >
          {busy ? '處理中…' : PRO_BTN_RESTORE}
        </button>
        {showLaterButton ? (
          <button type="button" onClick={onLater} disabled={busy} className={`min-h-[48px] w-full ${lq.btnSecondary}`}>
            {PRO_BTN_LATER}
          </button>
        ) : null}
      </div>
    </div>
  );
}
