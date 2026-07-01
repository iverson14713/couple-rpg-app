import { levelTitle, expProgressInLevel } from './coupleLevel';
import type { CoupleExpView } from '../storage/coupleExpStore';
import type { XiaoiState } from './xiaoiState';

export const DEV_MODE_PASSWORD = 'A126452345';
export const DEV_MODE_CHANGED_EVENT = 'lq-dev-mode-changed';

const KEYS = {
  level: 'dev_override_level',
  exp: 'dev_override_exp',
  loveCoins: 'dev_override_loveCoins',
  streakDays: 'dev_override_streakDays',
  isPro: 'dev_override_isPro',
  xiaoiState: 'dev_override_xiaoiState',
} as const;

export type DevOverrideKey = keyof typeof KEYS;

export type DevOverrides = {
  level?: number;
  exp?: number;
  loveCoins?: number;
  streakDays?: number;
  isPro?: boolean;
};

export type DevModeSource = 'DEV' | 'VITE_ENABLE_DEV_MODE' | null;

export type DevModeDebugInfo = {
  enabled: boolean;
  source: DevModeSource;
};

/** 開發模式入口與面板：僅 dev server 或明確 VITE_ENABLE_DEV_MODE=true */
export function isDevModeFeatureEnabled(): boolean {
  return getDevModeDebugInfo().enabled;
}

export function getDevModeDebugInfo(): DevModeDebugInfo {
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_DEV_MODE !== 'true') {
    return { enabled: false, source: null };
  }
  if (import.meta.env.DEV) {
    return { enabled: true, source: 'DEV' };
  }
  if (import.meta.env.VITE_ENABLE_DEV_MODE === 'true') {
    return { enabled: true, source: 'VITE_ENABLE_DEV_MODE' };
  }
  return { enabled: false, source: null };
}

function readNumber(key: string): number | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.floor(n) : undefined;
  } catch {
    return undefined;
  }
}

function readBoolean(key: string): boolean | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return undefined;
  } catch {
    return undefined;
  }
}

export function readDevOverrides(): DevOverrides {
  if (!isDevModeFeatureEnabled()) return {};
  return {
    level: readNumber(KEYS.level),
    exp: readNumber(KEYS.exp),
    loveCoins: readNumber(KEYS.loveCoins),
    streakDays: readNumber(KEYS.streakDays),
    isPro: readBoolean(KEYS.isPro),
  };
}

export function hasDevOverrides(): boolean {
  const o = readDevOverrides();
  return (
    o.level != null ||
    o.exp != null ||
    o.loveCoins != null ||
    o.streakDays != null ||
    o.isPro != null
  );
}

export function setDevOverride<K extends DevOverrideKey>(
  key: K,
  value: DevOverrides[K] | undefined
): void {
  if (!isDevModeFeatureEnabled()) return;
  const storageKey = KEYS[key];
  if (value == null) {
    localStorage.removeItem(storageKey);
  } else if (key === 'isPro') {
    localStorage.setItem(storageKey, value ? 'true' : 'false');
  } else {
    localStorage.setItem(storageKey, String(Math.max(0, Math.floor(value as number))));
  }
  notifyDevModeChanged();
}

export function clearAllDevOverrides(): void {
  if (!isDevModeFeatureEnabled()) return;
  for (const k of Object.values(KEYS)) {
    localStorage.removeItem(k);
  }
  notifyDevModeChanged();
}

export function notifyDevModeChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DEV_MODE_CHANGED_EVENT));
}

export function applyCoupleExpDevOverrides(view: CoupleExpView): CoupleExpView {
  const o = readDevOverrides();
  const totalExp = o.exp ?? view.totalExp;
  const base = expProgressInLevel(totalExp);
  const level = o.level ?? base.level;
  return {
    ...view,
    ...base,
    totalExp,
    level,
    title: levelTitle(level),
  };
}

export function applyLoveCoinsDevOverride(coins: number): number {
  const o = readDevOverrides();
  return o.loveCoins ?? coins;
}

export type LoveFlameViewLike = {
  currentStreak: number;
  displayStreak?: number;
  streakBroken?: boolean;
  longestStreak?: number;
  [key: string]: unknown;
};

export function applyStreakDevOverride<T extends LoveFlameViewLike>(view: T): T {
  const o = readDevOverrides();
  if (o.streakDays == null) return view;
  const streak = Math.max(0, o.streakDays);
  return {
    ...view,
    currentStreak: streak,
    displayStreak: streak,
    streakBroken: streak === 0,
    longestStreak: Math.max(view.longestStreak ?? 0, streak),
  };
}

export function applyProDevOverride(isPro: boolean): boolean {
  const o = readDevOverrides();
  if (o.isPro != null) return o.isPro;
  return isPro;
}

const XIAOI_STATE_VALUES: XiaoiState[] = ['happy', 'sad', 'sleepy', 'back_angry'];

/** 開發模式：首頁 Hero 小愛顯示狀態覆寫（不影響真實互動資料） */
export function readDevXiaoiStateOverride(): XiaoiState | null {
  if (!isDevModeFeatureEnabled()) return null;
  try {
    const raw = localStorage.getItem(KEYS.xiaoiState);
    if (raw && XIAOI_STATE_VALUES.includes(raw as XiaoiState)) {
      return raw as XiaoiState;
    }
    return null;
  } catch {
    return null;
  }
}

export function setDevXiaoiStateOverride(state: XiaoiState | null): void {
  if (!isDevModeFeatureEnabled()) return;
  if (state == null) {
    localStorage.removeItem(KEYS.xiaoiState);
  } else {
    localStorage.setItem(KEYS.xiaoiState, state);
  }
  notifyDevModeChanged();
}

/** 非 dev 模式時清除殘留的小愛狀態覆寫（避免正式版被測試值覆蓋） */
export function clearStaleDevXiaoiStateOverride(): void {
  if (isDevModeFeatureEnabled()) return;
  try {
    localStorage.removeItem(KEYS.xiaoiState);
  } catch {
    /* ignore */
  }
}

/** 登出時清除小愛狀態覆寫，避免 happy 等測試值殘留影響首頁 */
export function clearDevXiaoiStateOverrideOnLogout(): void {
  try {
    localStorage.removeItem(KEYS.xiaoiState);
  } catch {
    /* ignore */
  }
}
