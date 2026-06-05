/**
 * Prevents empty local wallet / ledger from being pushed during login hydrate or background sync.
 * Push is allowed only after remote pull completed AND an explicit user reward/spend action.
 */

let walletHydrated = false;
let walletPushAllowed = false;

export function resetWalletHydrationGuards(): void {
  walletHydrated = false;
  walletPushAllowed = false;
}

export function beginWalletHydration(): void {
  walletHydrated = false;
  walletPushAllowed = false;
}

export function markWalletHydrated(): void {
  walletHydrated = true;
}

export function allowWalletPushAfterUserAction(): void {
  if (!walletHydrated) return;
  walletPushAllowed = true;
}

export function isWalletHydrated(): boolean {
  return walletHydrated;
}

/** True only after hydrate pull + explicit user wallet mutation (earn/spend/redeem). */
export function canPushWalletChanges(): boolean {
  return walletHydrated && walletPushAllowed;
}
