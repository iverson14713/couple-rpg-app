/**
 * Apple In-App Purchase / StoreKit 2 (iOS native plugin).
 */
import { Capacitor } from '@capacitor/core';
import LoveQuestIAP, { iapProductIdForPeriod, type LoveQuestIapEntitlement } from '../native/loveQuestIap';
import { IAP_PRODUCT_IDS } from './constants';
import type { BillingPeriod, PurchaseResult } from './types';
import { getIapEnvironmentSnapshot, iapError, iapLog, logIapEnvironment } from '../services/iap/iapDebug';

export type IapProductsDiagnostic = {
  products: Array<{ productId: string; displayPrice: string; period: string }>;
  missingProductIds: string[];
  diagnostic?: string;
  error?: string;
  errorCode?: string;
};

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

function pluginErrorDetail(e: unknown): Record<string, unknown> {
  const err = e as Error & {
    code?: string;
    data?: Record<string, unknown>;
  };
  return {
    message: err?.message ?? String(e),
    code: err?.code ?? null,
    name: err?.name ?? null,
    stack: err?.stack ?? null,
    pluginData: err?.data ?? null,
  };
}

function mapPluginError(e: unknown): PurchaseResult {
  const err = e as Error & { code?: string };
  const code = err?.code ?? '';
  const detail = pluginErrorDetail(e);

  iapError('plugin.error', {
    ...detail,
    ...getIapEnvironmentSnapshot(),
  });

  if (code === 'CANCELED') {
    return { ok: false, errorCode: 'USER_CANCELLED', message: err.message };
  }
  if (code === 'NO_PURCHASES') {
    return { ok: false, errorCode: 'NO_PURCHASES', message: err.message };
  }
  if (code === 'PRODUCTS_EMPTY') {
    return {
      ok: false,
      errorCode: 'PRODUCTS_EMPTY',
      message: err.message || 'App Store returned no products',
    };
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
    iapLog('getEntitlements.result', {
      isActive: ent.isActive,
      productId: ent.productId ?? null,
      period: ent.period ?? null,
    });
    if (ent.isActive && ent.productId) return ent;
    return null;
  } catch (e) {
    iapError('getEntitlements.error', pluginErrorDetail(e));
    return null;
  }
}

/** Load StoreKit products with full diagnostic logging (for upgrade UI + debugging). */
export async function fetchIapProductsDiagnostic(): Promise<IapProductsDiagnostic> {
  if (!isNativeIapAvailable()) {
    const snapshot = getIapEnvironmentSnapshot();
    iapError('getProducts.skipped', snapshot);
    return { products: [], missingProductIds: Object.values(IAP_PRODUCT_IDS), error: 'IAP not available on this platform' };
  }

  logIapEnvironment('getProducts.start');
  try {
    const result = await LoveQuestIAP.getProducts();
    const products = result.products ?? [];
    const missing = result.missingProductIds ?? [];

    if (products.length === 0) {
      iapError('getProducts.empty', {
        diagnostic: result.diagnostic ?? null,
        missingProductIds: missing,
        requested: IAP_PRODUCT_IDS,
        ...getIapEnvironmentSnapshot(),
      });
    } else {
      iapLog('getProducts.success', {
        count: products.length,
        productIds: products.map((p) => p.productId),
        missingProductIds: missing,
        diagnostic: result.diagnostic ?? null,
      });
    }

    return {
      products,
      missingProductIds: missing,
      diagnostic: result.diagnostic,
    };
  } catch (e) {
    const detail = pluginErrorDetail(e);
    iapError('getProducts.failed', {
      ...detail,
      ...getIapEnvironmentSnapshot(),
    });
    const err = e as Error & { code?: string };
    return {
      products: [],
      missingProductIds: Object.values(IAP_PRODUCT_IDS),
      error: err.message,
      errorCode: err.code,
    };
  }
}

export async function purchaseViaStoreKit(period: BillingPeriod): Promise<PurchaseResult> {
  if (!isNativeIapAvailable()) {
    const msg = 'App Store billing is only available on iOS.';
    iapError('purchase.skipped', { period, message: msg });
    return {
      ok: false,
      errorCode: 'IAP_NOT_CONFIGURED',
      message: msg,
    };
  }

  const productId = iapProductIdForPeriod(period);
  iapLog('purchase.start', { period, productId });

  try {
    const entitlement = await LoveQuestIAP.purchase({ productId });
    iapLog('purchase.success', {
      productId,
      isActive: entitlement.isActive,
      period: entitlement.period ?? null,
      transactionId: entitlement.transactionId ?? null,
    });
    return entitlementToResult(entitlement, 'app_store');
  } catch (e) {
    return mapPluginError(e);
  }
}

export async function restoreViaStoreKit(): Promise<PurchaseResult> {
  if (!isNativeIapAvailable()) {
    const msg = 'Restore requires the iOS app.';
    iapError('restore.skipped', { message: msg });
    return {
      ok: false,
      errorCode: 'IAP_NOT_CONFIGURED',
      message: msg,
    };
  }

  iapLog('restore.start', {});
  try {
    const entitlement = await LoveQuestIAP.restorePurchases();
    iapLog('restore.success', {
      productId: entitlement.productId ?? null,
      isActive: entitlement.isActive,
    });
    return entitlementToResult(entitlement, 'restore');
  } catch (e) {
    return mapPluginError(e);
  }
}

export async function fetchStoreProductPrices(): Promise<
  Partial<Record<BillingPeriod, string>>
> {
  const diag = await fetchIapProductsDiagnostic();
  const map: Partial<Record<BillingPeriod, string>> = {};
  for (const p of diag.products) {
    if (p.period === 'monthly' || p.period === 'yearly') {
      map[p.period] = p.displayPrice;
    }
  }
  return map;
}
