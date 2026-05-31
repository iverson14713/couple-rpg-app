import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SUBSCRIPTION_PRICING } from '../subscription/constants';
import { fetchStoreProductPrices, isNativeIapAvailable } from '../subscription/iapBridge';
import type { BillingPeriod } from '../subscription/types';
import {
  PRO_LEGAL_AUTO_RENEW,
  PRO_LEGAL_MANAGE,
} from '../coupleRpg/lib/proPlanContent';

export type PremiumUpsellReason =
  | 'ai'
  | 'reminders'
  | 'pets'
  | 'weekly'
  | 'history'
  | 'pdf'
  | 'photos'
  | 'general';

type Lang = 'zh' | 'en';

export const premiumUpsellCopy: Record<
  Lang,
  {
    title: string;
    bullets: string[];
    priceMonthly: string;
    priceYearly: string;
    yearlySave: string;
    later: string;
    buyMonthly: string;
    buyYearly: string;
    restore: string;
    restoring: string;
    iosOnly: string;
    autoRenew: string;
    manage: string;
    privacy: string;
    terms: string;
    subtitle: Record<PremiumUpsellReason, string>;
  }
> = {
  zh: {
    title: '💞 升級 LoveQuest Pro',
    bullets: [
      '一人升級，兩人共享 Pro',
      '完整情侶雲端同步',
      'AI 約會行程與禮物建議',
      '重要日子無上限',
      '自訂獎勵卡券與更多小遊戲',
    ],
    priceMonthly: SUBSCRIPTION_PRICING.monthly.labelZh,
    priceYearly: SUBSCRIPTION_PRICING.yearly.labelZh,
    yearlySave: SUBSCRIPTION_PRICING.yearlySaveZh,
    later: '稍後再說',
    buyMonthly: '訂閱月費',
    buyYearly: '訂閱年費',
    restore: '恢復購買',
    restoring: '處理中…',
    iosOnly: '目前僅 iOS App 支援訂閱購買',
    autoRenew: PRO_LEGAL_AUTO_RENEW,
    manage: PRO_LEGAL_MANAGE,
    privacy: '隱私政策',
    terms: '服務條款',
    subtitle: {
      ai: '今日 AI 次數已用完，升級 Pro 可獲得更多。',
      reminders: '提醒數量已達免費版上限。',
      pets: '寵物數量已達免費版上限（最多 3 隻）。',
      weekly: 'AI 正式週報為 Pro 專屬功能。',
      history: '完整搜尋與進階篩選為 Pro 功能。',
      pdf: 'PDF 匯出為 Pro 功能。',
      photos: '每日照片已達免費版上限。',
      general: '此功能需要 Pro，升級即可解鎖。',
    },
  },
  en: {
    title: '💞 Upgrade to LoveQuest Pro',
    bullets: [
      'One subscription, shared for your couple space',
      'Full cloud sync',
      'AI date ideas and gift suggestions',
      'Unlimited important dates',
      'Custom reward cards and more games',
    ],
    priceMonthly: SUBSCRIPTION_PRICING.monthly.labelEn,
    priceYearly: SUBSCRIPTION_PRICING.yearly.labelEn,
    yearlySave: SUBSCRIPTION_PRICING.yearlySaveEn,
    later: 'Not now',
    buyMonthly: 'Subscribe monthly',
    buyYearly: 'Subscribe yearly',
    restore: 'Restore purchases',
    restoring: 'Restoring…',
    iosOnly: 'Subscriptions are available on the iOS app only',
    autoRenew: 'Subscription auto-renews unless canceled at least 24 hours before the period ends.',
    manage: 'Manage or cancel in Settings → Apple ID → Subscriptions.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    subtitle: {
      ai: "You've used today's AI quota on the free plan.",
      reminders: "You've reached the free reminder limit.",
      pets: 'Free plan supports up to 3 pets.',
      weekly: 'The full AI weekly report is a Pro feature.',
      history: 'Advanced search and filters are Pro features.',
      pdf: 'PDF export is a Pro feature.',
      photos: "You've reached the free daily photo limit.",
      general: 'This feature requires Pro.',
    },
  },
};

export type PremiumUpsellSheetProps = {
  open: boolean;
  lang: Lang;
  reason: PremiumUpsellReason;
  busy?: boolean;
  onClose: () => void;
  onPurchase: (period: BillingPeriod) => void;
  onRestore: () => void;
};

export function PremiumUpsellSheet({
  open,
  lang,
  reason,
  busy = false,
  onClose,
  onPurchase,
  onRestore,
}: PremiumUpsellSheetProps) {
  const t = premiumUpsellCopy[lang];
  const iapAvailable = isNativeIapAvailable();
  const [priceMonthly, setPriceMonthly] = useState(t.priceMonthly);
  const [priceYearly, setPriceYearly] = useState(t.priceYearly);

  useEffect(() => {
    if (!open || !iapAvailable) return;
    void fetchStoreProductPrices().then((prices) => {
      if (prices.monthly) setPriceMonthly(prices.monthly);
      if (prices.yearly) setPriceYearly(prices.yearly);
    });
  }, [open, iapAvailable, t.priceMonthly, t.priceYearly]);

  if (!open) return null;
  const sub = t.subtitle[reason] ?? t.subtitle.general;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-upsell-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-[1.35rem] border border-white/60 bg-gradient-to-b from-white/95 to-orange-50/95 shadow-[0_-8px_40px_-12px_rgba(234,88,12,0.35)]"
        style={{ animation: 'premiumSheetIn 0.28s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-stone-300/80" aria-hidden />
        <div className="max-h-[min(85vh,640px)] overflow-y-auto px-5 pb-5 pt-3">
          <h2
            id="premium-upsell-title"
            className="flex items-center justify-center gap-2 text-center text-lg font-bold tracking-tight text-stone-900"
          >
            <Crown className="h-5 w-5 shrink-0 text-amber-500" strokeWidth={2.2} aria-hidden />
            {t.title}
          </h2>
          <p className="mt-2 text-center text-[13px] leading-snug text-stone-600">{sub}</p>

          <ul className="mt-4 space-y-2 rounded-2xl border border-orange-100/80 bg-white/70 px-4 py-3">
            {t.bullets.map((line) => (
              <li key={line} className="flex gap-2 text-[14px] leading-snug text-stone-800">
                <span className="shrink-0 font-semibold text-amber-500" aria-hidden>
                  <Crown className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy || !iapAvailable}
              onClick={() => onPurchase('monthly')}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-center transition active:scale-[0.99] disabled:opacity-60"
            >
              <p className="text-sm font-bold text-stone-900">{priceMonthly}</p>
            </button>
            <button
              type="button"
              disabled={busy || !iapAvailable}
              onClick={() => onPurchase('yearly')}
              className="rounded-2xl border-2 border-orange-300 bg-orange-50 px-3 py-2.5 text-center transition active:scale-[0.99] disabled:opacity-60"
            >
              <p className="text-sm font-bold text-stone-900">{priceYearly}</p>
              <p className="mt-1 text-[10px] font-semibold text-orange-800">{t.yearlySave}</p>
            </button>
          </div>

          <div className="mt-3 space-y-1 text-[10px] leading-snug text-stone-500">
            <p>{t.autoRenew}</p>
            <p>{t.manage}</p>
            <p className="flex justify-center gap-3">
              <a href="/privacy" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
                {t.privacy}
              </a>
              <a href="/terms" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
                {t.terms}
              </a>
            </p>
          </div>

          {!iapAvailable ? (
            <p className="mt-3 text-center text-[12px] font-semibold text-stone-600">{t.iosOnly}</p>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy || !iapAvailable}
              onClick={() => onPurchase('monthly')}
              className="w-full rounded-2xl border border-orange-200 bg-white py-3.5 text-[15px] font-bold text-orange-900 transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? t.restoring : `${t.buyMonthly} · ${priceMonthly}`}
            </button>
            <button
              type="button"
              disabled={busy || !iapAvailable}
              onClick={() => onPurchase('yearly')}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-[15px] font-bold text-white shadow-md shadow-orange-300/40 transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? t.restoring : `${t.buyYearly} · ${priceYearly}`}
            </button>
            <button
              type="button"
              disabled={busy || !iapAvailable}
              onClick={onRestore}
              className="w-full rounded-2xl border border-orange-200 bg-orange-50 py-3 text-[14px] font-bold text-orange-800 transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? t.restoring : t.restore}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="w-full rounded-2xl border border-stone-200 bg-white/90 py-3 text-[15px] font-semibold text-stone-700 transition hover:bg-stone-50 active:scale-[0.99]"
            >
              {t.later}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes premiumSheetIn {
          from { transform: translateY(100%); opacity: 0.65; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
