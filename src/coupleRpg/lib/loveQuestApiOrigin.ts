import { Capacitor } from '@capacitor/core';

/** Production assistant API (Vercel). Used when the WebView origin is Capacitor-local. */
export const LOVEQUEST_ASSISTANT_API_ORIGIN_DEFAULT = 'https://couple-rpg-app.vercel.app';

/**
 * Capacitor iOS/Android serves the bundle at `https://lovequest.app` (local only).
 * Relative `/api/assistant/*` hits static `index.html` (HTTP 200) — not the real API.
 * Native builds must call an absolute production (or dev) origin.
 */
export function resolveLoveQuestApiOrigin(): string {
  const assistantOverride = import.meta.env.VITE_ASSISTANT_SERVER_URL?.trim().replace(/\/$/, '');
  if (assistantOverride) {
    return assistantOverride;
  }

  const apiOrigin = import.meta.env.VITE_LOVEQUEST_API_ORIGIN?.trim().replace(/\/$/, '');
  if (apiOrigin) {
    return apiOrigin;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      return LOVEQUEST_ASSISTANT_API_ORIGIN_DEFAULT;
    }
  } catch {
    /* Capacitor unavailable (tests) */
  }

  return '';
}

export function loveQuestApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const origin = resolveLoveQuestApiOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}

/** Local assistant / promo API (see `npm run dev:server`). */
export const LOVEQUEST_DEV_API_BASE = 'http://127.0.0.1:8788';

/** Capacitor WebView uses hostname lovequest.app — not a real API host. */
export function isLoveQuestCapacitorWebView(): boolean {
  try {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
  } catch {
    /* Capacitor unavailable (tests) */
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'lovequest.app';
}

/**
 * Absolute URL for LoveQuest serverless / assistant routes.
 * - Native Capacitor → Vercel (or VITE_* override)
 * - Vite dev localhost → 127.0.0.1:8788
 * - Vite dev LAN / production web → same-origin relative path
 */
export function resolveLoveQuestApiEndpoint(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const fromOrigin = loveQuestApiUrl(normalized);
  if (fromOrigin.startsWith('http')) {
    return fromOrigin;
  }

  if (isLoveQuestCapacitorWebView()) {
    return `${LOVEQUEST_ASSISTANT_API_ORIGIN_DEFAULT}${normalized}`;
  }

  if (import.meta.env.PROD) {
    return `${LOVEQUEST_ASSISTANT_API_ORIGIN_DEFAULT}${normalized}`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${LOVEQUEST_DEV_API_BASE}${normalized}`;
    }
    return fromOrigin;
  }

  return `${LOVEQUEST_DEV_API_BASE}${normalized}`;
}
