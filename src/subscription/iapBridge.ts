/**
 * Apple In-App Purchase / StoreKit 2 (iOS native plugin).
 */
import { Capacitor } from '@capacitor/core';
import LoveQuestIAP, { iapProductIdForPeriod, type LoveQuestIapEntitlement } from '../native/loveQuestIap';
import { IAP_PRODUCT_IDS } from './constants';
import type { BillingPeriod, PurchaseResult } from './types';

export function isNativeIapAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

function periodFromProductId(productId: string | undefined): BillingPeriod | undefined {
  if (!productId) return undefined;
  if (productId === IAP_PRODUCT_IDS.yearly) return 'yearly';
  if (productId === IAP_PRODUCT_IDS.monthly) return 'monthly';
  return undefined;
}

function entitlementToResult(
  entitlement: LoveQuestIapEntitlement,
  source: 'app_store' | 'restore'
): PurchaseResult {
  if (!entitlement.isActive && entitlement.productId == null) {
    return { ok: false, errorCode: 'NO_PURCHASES', message: 'No active subscription' };
  }
  const period = entitlement.period ?? periodFromProductId(entitlement.productId);
  return {
    ok: true,
    status: 'pro',
    source,
    period,
  };
}

function mapPluginError(e: unknown): PurchaseResult {
  const err = e as Error & { code?: string };
  const code = err?.code ?? '';
  if (code === 'CANCELED') {
    return { ok: false, errorCode: 'USER_CANCELLED', message: err.message };
  }
  if (code === 'NO_PURCHASES') {
    return { ok: false, errorCode: 'NO_PURCHASES', message: err.message };
  }
  if (code === 'IAP_NOT_AVAILABLE' || code === 'PRODUCTS_FAILED') {
    return { ok: false, errorCode: 'IAP_NOT_CONFIGURED', message: err.message };
  }
  return {
    ok: false,
    errorCode: 'UNKNOWN',
    message: err?.message ?? String(e),
  };
}

export async function getActiveIapEntitlement(): Promise<LoveQuestIapEntitlement | null> {
  if (!isNativeIapAvailable()) return null;
  try {
    const ent = await LoveQuestIAP.getEntitlements();
    if (ent.isActive && ent.productId) return ent;
    return null;
  } catch {
    return null;
  }
}

export async function purchaseViaStoreKit(period: BillingPeriod): Promise<PurchaseResult> {
  if (!isNativeIapAvailable()) {
    return {
      ok: false,
      errorCode: 'IAP_NOT_CONFIGURED',
      message: 'App Store billing is only available on iOS.',
    };
  }

  try {
    const productId = iapProductIdForPeriod(period);
    const entitlement = await LoveQuestIAP.purchase({ productId });
    return entitlementToResult(entitlement, 'app_store');
  } catch (e) {
    return mapPluginError(e);
  }
}

export async function restoreViaStoreKit(): Promise<PurchaseResult> {
  if (!isNativeIapAvailable()) {
    return {
      ok: false,
      errorCode: 'IAP_NOT_CONFIGURED',
      message: 'Restore requires the iOS app.',
    };
  }

  try {
    const entitlement = await LoveQuestIAP.restorePurchases();
    return entitlementToResult(entitlement, 'restore');
  } catch (e) {
    return mapPluginError(e);
  }
}

export async function fetchStoreProductPrices(): Promise<
  Partial<Record<BillingPeriod, string>>
> {
  if (!isNativeIapAvailable()) return {};
  try {
    const { products } = await LoveQuestIAP.getProducts();
    const map: Partial<Record<BillingPeriod, string>> = {};
    for (const p of products) {
      map[p.period] = p.displayPrice;
    }
    return map;
  } catch {
    return {};
  }
}
