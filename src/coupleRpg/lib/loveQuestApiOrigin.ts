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
