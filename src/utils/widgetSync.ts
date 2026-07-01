import { Capacitor } from '@capacitor/core';
import LoveQuestWidgetBridge from '../native/loveQuestWidgetBridge';
import type { CoupleExtendedProfile } from '../coupleRpg/storage/coupleExtendedTypes';
import { todayKey } from '../coupleRpg/lib/dates';
import { getNextHomeImportantDateEvent } from '../coupleRpg/lib/importantDateHomeReminder';
import { hasHomeImportantDatesConfigured } from '../coupleRpg/lib/importantDates';
import { getTogetherDaysInfo } from '../coupleRpg/lib/relationshipDays';

export type LoveQuestWidgetData = {
  coupleName: string;
  togetherTitle: string;
  /** @deprecated Widget 端優先用 relationshipStartDate 即時計算 */
  togetherDays: number;
  nextEventTitle: string | null;
  /** @deprecated Widget 端優先用 nextImportantAnnualYmd 即時計算 */
  nextEventDaysLeft: number | null;
  nextEventDateLabel: string | null;
  flameDays: number;
  isPro?: boolean;
  updatedAt: number;
  hasData: boolean;
  hasInteractedToday?: boolean;
  lastInteractionDate?: string | null;
  /** yyyy-MM-dd：在一起起始日，Widget 跨日自行計算天數 */
  relationshipStartDate?: string | null;
  /** yyyy-MM-dd：下一個重要日子（年度錨點），Widget 跨日自行計算倒數 */
  nextImportantAnnualYmd?: string | null;
  nextImportantTitle?: string | null;
  /** yyyy-MM-dd：今日有互動時為今天，Widget 跨日自行判斷 happy */
  todayInteractionDate?: string | null;
  isLoggedIn?: boolean;
  isCoupleBound?: boolean;
};

export function formatWidgetCoupleName(profile: CoupleExtendedProfile): string {
  const my = profile.myNickname.trim();
  const partner = profile.partnerNickname.trim();
  if (my && partner) return `${my}・${partner}`;
  if (my) return `${my}・另一半`;
  if (partner) return `我・${partner}`;
  return '我・另一半';
}

const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六'] as const;

export function formatWidgetNextEventDate(daysUntil: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + daysUntil);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const w = WEEKDAY_ZH[d.getDay()] ?? '日';
  return `${y}/${m}/${day}（${w}）`;
}

export function buildLoggedOutWidgetPayload(): LoveQuestWidgetData {
  return {
    coupleName: 'LoveQuest',
    togetherTitle: '我們在一起',
    togetherDays: 0,
    nextEventTitle: null,
    nextEventDaysLeft: null,
    nextEventDateLabel: null,
    flameDays: 0,
    isPro: false,
    updatedAt: Date.now(),
    hasData: false,
    hasInteractedToday: false,
    lastInteractionDate: null,
    relationshipStartDate: null,
    nextImportantAnnualYmd: null,
    nextImportantTitle: null,
    todayInteractionDate: null,
    isLoggedIn: false,
    isCoupleBound: false,
  };
}

export function buildLoveQuestWidgetData(input: {
  coupleExtended: CoupleExtendedProfile;
  flameDays: number;
  isPro?: boolean;
  hasInteractedToday?: boolean;
  lastInteractionDate?: string | null;
  isLoggedIn?: boolean;
  isCoupleBound?: boolean;
}): LoveQuestWidgetData {
  const {
    coupleExtended,
    flameDays,
    isPro,
    hasInteractedToday,
    lastInteractionDate,
    isLoggedIn = false,
    isCoupleBound = false,
  } = input;
  const today = todayKey();
  const interacted = Boolean(hasInteractedToday);
  const together = getTogetherDaysInfo(coupleExtended.relationshipStart);
  const togetherDays = together.kind === 'active' ? together.days : 0;
  const hasConfigured = hasHomeImportantDatesConfigured(coupleExtended);
  const hasTogether = together.kind === 'active';
  const nextEvent = hasConfigured ? getNextHomeImportantDateEvent(coupleExtended) : null;
  const relationshipStartDate = coupleExtended.relationshipStart?.trim() || null;

  return {
    coupleName: formatWidgetCoupleName(coupleExtended),
    togetherTitle: '我們在一起',
    togetherDays,
    nextEventTitle: nextEvent?.displayTitle ?? null,
    nextEventDaysLeft: nextEvent != null ? nextEvent.daysUntil : null,
    nextEventDateLabel:
      nextEvent != null ? formatWidgetNextEventDate(nextEvent.daysUntil, new Date()) : null,
    flameDays: Math.max(0, Math.floor(flameDays)),
    isPro,
    updatedAt: Date.now(),
    hasData: (isLoggedIn && isCoupleBound && hasTogether) || hasConfigured,
    hasInteractedToday: interacted,
    lastInteractionDate: lastInteractionDate ?? null,
    relationshipStartDate,
    nextImportantAnnualYmd: nextEvent?.dateYmd ?? null,
    nextImportantTitle: nextEvent?.displayTitle ?? null,
    todayInteractionDate: interacted ? today : null,
    isLoggedIn,
    isCoupleBound,
  };
}

let lastPayloadJson = '';

export async function syncLoveQuestWidgetData(
  data: LoveQuestWidgetData,
  options?: { forceReload?: boolean }
): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;

  const payload: LoveQuestWidgetData = {
    ...data,
    updatedAt: Date.now(),
  };
  const json = JSON.stringify(payload);
  const unchanged = json === lastPayloadJson;
  if (!unchanged) {
    lastPayloadJson = json;
    try {
      await LoveQuestWidgetBridge.saveWidgetData(payload);
    } catch (e) {
      console.warn('[widgetSync] save failed', e);
      return;
    }
  }

  if (!unchanged || options?.forceReload) {
    try {
      await LoveQuestWidgetBridge.reloadWidget();
    } catch (e) {
      console.warn('[widgetSync] reload failed', e);
    }
  }
}
