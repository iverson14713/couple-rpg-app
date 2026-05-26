import { Capacitor } from '@capacitor/core';
import type { BillingPeriod } from '../../subscription/types';
import {
  getActiveIapEntitlement,
  isNativeIapAvailable,
  purchaseViaStoreKit,
  restoreViaStoreKit,
} from '../../subscription/iapBridge';
import { IAP_PRODUCT_IDS } from '../../subscription/constants';
import type { LoveQuestIapEntitlement } from '../../native/loveQuestIap';
import { setUserPlan } from '../storage/planStore';
import {
  activateCoupleProFromApple,
  expireCoupleProFromApple,
  getCouplePlan,
  type CouplePlanSnapshot,
  type CouplePlanSyncInput,
  shouldUseCoupleSubscription,
} from './couplePlanService';

export function isLoveQuestIapAvailable(): boolean {
  return isNativeIapAvailable();
}

function periodFromEntitlement(ent: LoveQuestIapEntitlement): 'monthly' | 'yearly' {
  if (ent.period === 'yearly' || ent.period === 'monthly') return ent.period;
  if (ent.productId === IAP_PRODUCT_IDS.yearly) return 'yearly';
  return 'monthly';
}

async function applyEntitlementToCouple(
  input: CouplePlanSyncInput,
  ent: LoveQuestIapEntitlement
): Promise<CouplePlanSnapshot> {
  if (shouldUseCoupleSubscription(input) && input.supabase && input.coupleId && input.userId) {
    await activateCoupleProFromApple(input.supabase, input.coupleId, input.userId, {
      productId: ent.productId ?? IAP_PRODUCT_IDS.monthly,
      period: periodFromEntitlement(ent),
      originalTransactionId: ent.originalTransactionId ?? ent.transactionId ?? 'unknown',
      expiresAt: ent.expiresAt ?? null,
    });
    return getCouplePlan(input);
  }

  setUserPlan('pro');
  return {
    plan: 'pro',
    isPro: true,
    source: 'local',
    coupleId: input.coupleId,
    isShared: false,
    subscription: null,
  };
}

/** App 啟動時同步 StoreKit 訂閱 → 情侶空間方案 */
export async function syncLoveQuestIapOnLaunch(
  input: CouplePlanSyncInput
): Promise<CouplePlanSnapshot | null> {
  if (!isNativeIapAvailable()) return null;

  const ent = await getActiveIapEntitlement();
  if (ent?.isActive && ent.productId) {
    return applyEntitlementToCouple(input, ent);
  }

  if (
    shouldUseCoupleSubscription(input) &&
    input.supabase &&
    input.coupleId
  ) {
    const snap = await getCouplePlan(input);
    if (snap.subscription?.provider === 'apple' && snap.isPro) {
      await expireCoupleProFromApple(input.supabase, input.coupleId);
      return getCouplePlan(input);
    }
  }

  return null;
}

export type LoveQuestPurchaseOutcome =
  | { ok: true; snapshot?: CouplePlanSnapshot }
  | { ok: false; cancelled?: boolean; message?: string };

export async function purchaseLoveQuestPro(
  input: CouplePlanSyncInput,
  period: BillingPeriod
): Promise<LoveQuestPurchaseOutcome> {
  if (!isNativeIapAvailable()) {
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'web') {
      return { ok: false, message: '目前僅 iOS App 支援訂閱購買' };
    }
    return { ok: false, message: '此裝置不支援 App Store 訂閱' };
  }

  const result = await purchaseViaStoreKit(period);
  if (!result.ok) {
    if (result.errorCode === 'USER_CANCELLED') {
      return { ok: false, cancelled: true };
    }
    return {
      ok: false,
      message: '無法完成購買，請稍後再試',
    };
  }

  const ent = await getActiveIapEntitlement();
  if (!ent?.isActive) {
    return { ok: false, message: '購買完成但無法確認訂閱狀態，請使用恢復購買' };
  }

  const snapshot = await applyEntitlementToCouple(input, ent);
  return { ok: true, snapshot };
}

export async function restoreLoveQuestPurchases(
  input: CouplePlanSyncInput
): Promise<LoveQuestPurchaseOutcome> {
  if (!isNativeIapAvailable()) {
    return { ok: false, message: '恢復購買僅支援 iOS App' };
  }

  const result = await restoreViaStoreKit();
  if (!result.ok) {
    if (result.errorCode === 'NO_PURCHASES') {
      return { ok: false, message: '尚未找到有效訂閱' };
    }
    if (result.errorCode === 'USER_CANCELLED') {
      return { ok: false, cancelled: true };
    }
    return { ok: false, message: '恢復購買失敗，請稍後再試' };
  }

  const ent = await getActiveIapEntitlement();
  if (!ent?.isActive) {
    return { ok: false, message: '尚未找到有效訂閱' };
  }

  const snapshot = await applyEntitlementToCouple(input, ent);
  return { ok: true, snapshot };
}
