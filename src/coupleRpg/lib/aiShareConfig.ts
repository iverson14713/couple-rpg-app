import type { AiShareCardPayload } from './aiShareCardContent';

/** LoveQuest 官網／導流連結 */
export const LOVEQUEST_APP_URL = 'https://lovequest.app';

/** Phase 2：公開分享頁前綴 */
export const LOVEQUEST_SHARE_PATH_PREFIX = '/share/';

export type AiShareRef = {
  kind: 'date_itinerary' | 'important_date';
  savedAt: string;
  /** Phase 2：後端核發的公開 share id */
  shareId?: string;
};

/**
 * Phase 2：帶 shareId 的公開頁；Phase 1 僅導向官網。
 * 未來可接 App deep link、App Store 導流。
 */
export function buildSharePageUrl(ref: AiShareRef | undefined): string {
  if (ref?.shareId) {
    return `${LOVEQUEST_APP_URL}${LOVEQUEST_SHARE_PATH_PREFIX}${ref.shareId}`;
  }
  return LOVEQUEST_APP_URL;
}

/** Phase 2 stub：本地紀錄 → 未來可 POST 換 shareId */
export function resolveShareIdForRef(_ref: AiShareRef | undefined): string | undefined {
  return _ref?.shareId;
}

export function buildNativeShareTitle(payload: AiShareCardPayload): string {
  return payload.title || 'LoveQuest AI';
}

export function buildNativeShareText(payload: AiShareCardPayload): string {
  const hook =
    payload.kind === 'important_date'
      ? '用 LoveQuest AI 幫我們安排的重要日子 ❤️'
      : '用 LoveQuest AI 幫我們安排的約會行程 ❤️';
  const url = buildSharePageUrl(payload.shareRef);
  return `${hook}\n${url}`;
}

export function shareCardFilename(payload: AiShareCardPayload): string {
  const at = payload.shareRef?.savedAt ?? Date.now();
  return `lovequest-${payload.kind}-${at}.png`;
}

/** Phase 2：建立可同步到伺服器的分享 ref（目前僅本地） */
export function buildLocalShareRef(kind: AiShareRef['kind'], savedAt: string): AiShareRef {
  return { kind, savedAt };
}
