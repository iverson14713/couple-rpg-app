import { isLoveQuestDevMode } from '../coupleRpg/lib/loveQuestDevMode';
import { purchaseViaStoreKit, restoreViaStoreKit } from './iapBridge';
import { getSubscriptionStatus, isProSubscriber, setSubscriptionStatus } from './subscriptionStore';
import type { BillingPeriod, PurchaseResult, SubscriptionStatus } from './types';

export { getSubscriptionStatus, isProSubscriber, setSubscriptionStatus };
export type { BillingPeriod, PurchaseResult, SubscriptionStatus };

/** Dev-only unlock — no payment. */
export async function purchaseProTestUnlock(period: BillingPeriod = 'monthly'): Promise<PurchaseResult> {
  setSubscriptionStatus('pro', { source: 'test', billingPeriod: period });
  return { ok: true, status: 'pro', source: 'test', period };
}

export async function purchasePro(period: BillingPeriod = 'monthly'): Promise<PurchaseResult> {
  const iap = await purchaseViaStoreKit(period);
  if (iap.ok) return iap;
  if (iap.errorCode === 'USER_CANCELLED') return iap;
  if (iap.errorCode === 'IAP_NOT_CONFIGURED' && isLoveQuestDevMode()) {
    return purchaseProTestUnlock(period);
  }
  return iap;
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const result = await restoreViaStoreKit();
  if (result.ok && result.status === 'pro') {
    setSubscriptionStatus('pro', { source: 'restore', billingPeriod: result.period ?? null });
  }
  return result;
}

export function downgradeToFree(): SubscriptionStatus {
  setSubscriptionStatus('free', { source: null, billingPeriod: null });
  return 'free';
}
