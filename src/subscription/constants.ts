import type { BillingPeriod } from './types';

/** localStorage key for subscription JSON (status + metadata). */
export const SUBSCRIPTION_STORAGE_KEY = 'petcare_subscription_status';

/** Legacy key used by early builds — read for migration only. */
export const LEGACY_AI_PLAN_KEY = 'cat-ai-plan';

export const SUBSCRIPTION_PRICING = {
  monthly: { amountTwd: 50, labelZh: 'NT$50 / 月', labelEn: 'NT$50 / month' },
  yearly: { amountTwd: 490, labelZh: 'NT$490 / 年', labelEn: 'NT$490 / year' },
  yearlySaveZh: '省約 18%',
  yearlySaveEn: 'Save ~18%',
} as const;

/** App Store Connect subscription product identifiers */
export const IAP_PRODUCT_IDS: Record<BillingPeriod, string> = {
  monthly: 'com.wayne.lovequest.pro.monthly',
  yearly: 'com.wayne.lovequest.pro.yearly',
};
