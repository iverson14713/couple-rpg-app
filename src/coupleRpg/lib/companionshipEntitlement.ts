import type { CompanionshipPreset } from '../data/companionshipPresets';
import {
  getCompanionshipSendsRemaining,
  getCompanionshipSendsToday,
} from '../storage/companionshipQuotaStore';
import type { CompanionshipEvent } from '../storage/companionshipTypes';
import { dateKeyFromIso, todayKey } from './dates';

export const FREE_COMPANIONSHIP_DAILY_SEND_LIMIT = 3;

const FREE_COMPANIONSHIP_PRESET_TYPES = new Set([
  'heart',
  'goodnight',
  'missing',
  'cheer',
]);

export const COMPANIONSHIP_RANDOM_PRO_HINT =
  '隨機一句與 AI 陪伴句子為 Pro 功能，升級後可無限送出陪伴。';

export const COMPANIONSHIP_CUSTOM_PRO_HINT =
  '自訂陪伴句子為 Pro 功能，升級後可寫專屬短句給對方。';

export const COMPANIONSHIP_DAILY_LIMIT_PRO_HINT =
  '免費版每天最多陪伴 3 次，升級 Pro 可無限送出陪伴、解鎖自訂句子與隨機一句。';

export function countTodaySentByUser(
  events: CompanionshipEvent[],
  senderUserId: string,
  refDate = new Date()
): number {
  const today = todayKey(refDate);
  return events.filter(
    (e) => e.senderUserId === senderUserId && dateKeyFromIso(e.createdAt) === today
  ).length;
}

export function freeCompanionshipSendsRemaining(
  senderUserId: string | null,
  coupleId: string | null,
  isPro: boolean,
  refDate = new Date()
): number | null {
  return getCompanionshipSendsRemaining(senderUserId, coupleId, isPro, refDate);
}

export function todaySentByUserFromQuota(
  senderUserId: string | null,
  coupleId: string | null,
  refDate = new Date()
): number {
  return getCompanionshipSendsToday(senderUserId, coupleId, refDate);
}

export type CompanionshipSendBlockReason = 'pro_required' | 'daily_limit';

export type CompanionshipSendGate =
  | { allowed: true }
  | { allowed: false; reason: CompanionshipSendBlockReason; hint: string };

export function checkPresetCompanionshipSend(
  preset: CompanionshipPreset,
  isPro: boolean,
  senderUserId: string | null,
  coupleId: string | null
): CompanionshipSendGate {
  if (!senderUserId) return { allowed: true };

  if (preset.type === 'random' && !isPro) {
    return { allowed: false, reason: 'pro_required', hint: COMPANIONSHIP_RANDOM_PRO_HINT };
  }

  if (!isPro) {
    if (!FREE_COMPANIONSHIP_PRESET_TYPES.has(preset.type)) {
      return { allowed: false, reason: 'pro_required', hint: COMPANIONSHIP_CUSTOM_PRO_HINT };
    }
    const sent = getCompanionshipSendsToday(senderUserId, coupleId);
    if (sent >= FREE_COMPANIONSHIP_DAILY_SEND_LIMIT) {
      return { allowed: false, reason: 'daily_limit', hint: COMPANIONSHIP_DAILY_LIMIT_PRO_HINT };
    }
  }

  return { allowed: true };
}

export function checkCustomCompanionshipSend(isPro: boolean): CompanionshipSendGate {
  if (!isPro) {
    return { allowed: false, reason: 'pro_required', hint: COMPANIONSHIP_CUSTOM_PRO_HINT };
  }
  return { allowed: true };
}
