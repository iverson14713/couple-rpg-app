import { Capacitor } from '@capacitor/core';
import { IAP_PRODUCT_IDS } from '../../subscription/constants';

const LOG_PREFIX = '[LQ_IAP]';

export function iapLog(step: string, detail?: Record<string, unknown>): void {
  if (detail !== undefined) {
    console.log(LOG_PREFIX, step, detail);
  } else {
    console.log(LOG_PREFIX, step);
  }
}

export function iapError(step: string, detail?: Record<string, unknown>): void {
  if (detail !== undefined) {
    console.error(LOG_PREFIX, step, detail);
  } else {
    console.error(LOG_PREFIX, step);
  }
}

export function getIapEnvironmentSnapshot(): Record<string, unknown> {
  let platform = 'unknown';
  try {
    platform = Capacitor.getPlatform();
  } catch {
    /* ignore */
  }

  return {
    platform,
    isNativePlatform: Capacitor.isNativePlatform(),
    productIds: IAP_PRODUCT_IDS,
    bundleIdNote: 'iOS native target: com.wayne.lovequest (must match App Store Connect)',
    emptyProductsChecklist: [
      'App Store Connect → Subscriptions created with exact product IDs',
      'Subscription group linked to com.wayne.lovequest',
      'Paid Applications agreement active',
      'Products status Ready to Submit or Approved',
      'Test on device with Sandbox Apple ID (Settings → App Store → Sandbox)',
      'Wait up to 24h after creating new IAP products',
    ],
  };
}

export function logIapEnvironment(step = 'environment'): void {
  iapLog(step, getIapEnvironmentSnapshot());
}
