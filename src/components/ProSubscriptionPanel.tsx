import { Crown, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SUBSCRIPTION_PRICING } from '../subscription/constants';
import { fetchStoreProductPrices, isNativeIapAvailable } from '../subscription/iapBridge';
import type { BillingPeriod, SubscriptionStatus } from '../subscription/types';
import {
  PRO_LEGAL_AUTO_RENEW,
  PRO_LEGAL_MANAGE,
} from '../coupleRpg/lib/proPlanContent';

type Lang = 'zh' | 'en';

const copy = {
  zh: {
    section: 'LoveQuest Pro',
    paymentNote: '透過 App Store 安全訂閱',
    current: '目前方案',
    free: '免費版',
    pro: 'Pro',
    monthly: SUBSCRIPTION_PRICING.monthly.labelZh,
    yearly: SUBSCRIPTION_PRICING.yearly.labelZh,
    yearlySave: SUBSCRIPTION_PRICING.yearlySaveZh,
    buyMonthly: '訂閱月費',
    buyYearly: '訂閱年費',
    restore: '恢復購買',
    restoring: '處理中…',
    iosOnly: '目前僅 iOS App 支援訂閱購買',
    proActive: '已透過 App Store 開通 Pro',
    autoRenew: PRO_LEGAL_AUTO_RENEW,
    manage: PRO_LEGAL_MANAGE,
    privacy: '隱私政策',
    terms: '服務條款',
  },
  en: {
    section: 'LoveQuest Pro',
    paymentNote: 'Secure billing through the App Store',
    current: 'Current plan',
    free: 'Free',
    pro: 'Pro',
    monthly: SUBSCRIPTION_PRICING.monthly.labelEn,
    yearly: SUBSCRIPTION_PRICING.yearly.labelEn,
    yearlySave: SUBSCRIPTION_PRICING.yearlySaveEn,
    buyMonthly: 'Subscribe monthly',
    buyYearly: 'Subscribe yearly',
    restore: 'Restore purchases',
    restoring: 'Restoring…',
    iosOnly: 'Subscriptions are available on the iOS app only',
    proActive: 'Pro is active via the App Store',
    autoRenew: 'Subscription auto-renews unless canceled at least 24 hours before the period ends.',
    manage: 'Manage or cancel in Settings → Apple ID → Subscriptions.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
} as const;

export type ProSubscriptionPanelProps = {
  lang: Lang;
  status: SubscriptionStatus;
  busy?: boolean;
  onPurchase: (period: BillingPeriod) => void;
  onRestore: () => void;
  compact?: boolean;
};

export function ProSubscriptionPanel({
  lang,
  status,
  busy = false,
  onPurchase,
  onRestore,
  compact = false,
}: ProSubscriptionPanelProps) {
  const t = copy[lang];
  const iapAvailable = isNativeIapAvailable();
  const [priceMonthly, setPriceMonthly] = useState(t.monthly);
  const [priceYearly, setPriceYearly] = useState(t.yearly);

  useEffect(() => {
    if (!iapAvailable) return;
    void fetchStoreProductPrices().then((prices) => {
      if (prices.monthly) setPriceMonthly(prices.monthly);
      if (prices.yearly) setPriceYearly(prices.yearly);
    });
  }, [iapAvailable, t.monthly, t.yearly]);

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-b from-amber-50/95 via-white to-orange-50/90 shadow-[0_12px_40px_-18px_rgba(234,88,12,0.35)] ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md">
          <Crown className="h-5 w-5" strokeWidth={2.2} aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-bold text-stone-900">{t.section}</h2>
          <p className="text-[11px] text-stone-500">{t.paymentNote}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-inner">
        <p className="text-sm text-stone-700">
          {t.current}：
          <span className="font-bold text-orange-600">
            {status === 'pro' ? (
              <span className="inline-flex items-center gap-1">
                <Crown className="inline h-3.5 w-3.5 text-amber-500" aria-hidden />
                {t.pro}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Lock className="inline h-3.5 w-3.5 text-stone-400" aria-hidden />
                {t.free}
              </span>
            )}
          </span>
        </p>
      </div>

      {status === 'pro' ? (
        <p className="mt-3 text-xs leading-relaxed text-stone-600">{t.proActive}</p>
      ) : null}

      {status === 'free' ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-center">
              <p className="text-[11px] font-bold text-stone-500">{t.monthly.split(' ')[0]}</p>
              <p className="mt-1 text-sm font-bold text-stone-900">{priceMonthly}</p>
            </div>
            <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 px-3 py-3 text-center">
              <p className="text-[11px] font-bold text-orange-800">{t.yearly.split(' ')[0]}</p>
              <p className="mt-1 text-sm font-bold text-stone-900">{priceYearly}</p>
              <p className="mt-1 text-[10px] font-semibold text-orange-800">{t.yearlySave}</p>
            </div>
          </div>

          {!iapAvailable ? (
            <p className="mt-3 rounded-xl bg-stone-100 px-3 py-2 text-center text-[12px] font-semibold text-stone-600">
              {t.iosOnly}
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurchase('monthly')}
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-900 transition active:scale-[0.99] disabled:opacity-60"
              >
                {busy ? t.restoring : `${t.buyMonthly} · ${priceMonthly}`}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurchase('yearly')}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-300/40 transition active:scale-[0.99] disabled:opacity-60"
              >
                {busy ? t.restoring : `${t.buyYearly} · ${priceYearly}`}
              </button>
            </div>
          )}
        </>
      ) : null}

      <div className="mt-3 space-y-1 text-[10px] leading-relaxed text-stone-500">
        <p>{t.autoRenew}</p>
        <p>{t.manage}</p>
        <p className="flex flex-wrap gap-x-3">
          <a href="/privacy" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
            {t.privacy}
          </a>
          <a href="/terms" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
            {t.terms}
          </a>
        </p>
      </div>

      <button
        type="button"
        disabled={busy || !iapAvailable}
        onClick={onRestore}
        className="mt-3 w-full rounded-2xl border border-orange-200 bg-orange-50/80 py-3 text-sm font-bold text-orange-800 transition hover:bg-orange-50 active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? t.restoring : t.restore}
      </button>
    </section>
  );
}
