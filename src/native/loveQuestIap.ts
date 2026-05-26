import { registerPlugin } from '@capacitor/core';
import type { BillingPeriod } from '../subscription/types';
import { IAP_PRODUCT_IDS } from '../subscription/constants';

export type LoveQuestIapProduct = {
  productId: string;
  displayPrice: string;
  period: BillingPeriod;
};

export type LoveQuestIapEntitlement = {
  productId?: string;
  period?: BillingPeriod;
  isActive: boolean;
  expiresAt?: string | null;
  originalTransactionId?: string;
  transactionId?: string;
};

export interface LoveQuestIapPlugin {
  getProducts(): Promise<{ products: LoveQuestIapProduct[] }>;
  purchase(options: { productId: string }): Promise<LoveQuestIapEntitlement>;
  restorePurchases(): Promise<LoveQuestIapEntitlement>;
  getEntitlements(): Promise<LoveQuestIapEntitlement>;
}

const LoveQuestIAP = registerPlugin<LoveQuestIapPlugin>('LoveQuestIAP', {
  web: () => import('./loveQuestIap.web').then((m) => m.default),
});

export function iapProductIdForPeriod(period: BillingPeriod): string {
  return IAP_PRODUCT_IDS[period];
}

export default LoveQuestIAP;
