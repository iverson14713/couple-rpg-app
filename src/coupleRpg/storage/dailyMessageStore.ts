import { todayKey } from '../lib/dates';
import { DAILY_PARTNER_MESSAGE_PRESETS } from '../data/dailyPartnerMessages';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export type DailyMessageRecord = {
  /** YYYY-MM-DD */
  date: string;
  text: string;
  isCustom: boolean;
};

export function pickRandomPreset(exclude?: string): string {
  const pool = DAILY_PARTNER_MESSAGE_PRESETS.filter((p) => p !== exclude);
  const list = pool.length > 0 ? pool : [...DAILY_PARTNER_MESSAGE_PRESETS];
  return list[Math.floor(Math.random() * list.length)] ?? list[0]!;
}

export function loadDailyMessage(): DailyMessageRecord | null {
  return loadJson<DailyMessageRecord | null>(LQ_KEYS.dailyMessage, null);
}

export function saveDailyMessage(record: DailyMessageRecord): void {
  saveJson(LQ_KEYS.dailyMessage, record);
}

/** 取得今日句子；跨日且非自訂時自動換一句預設。 */
export function getTodayPartnerMessage(): DailyMessageRecord {
  const today = todayKey();
  const cur = loadDailyMessage();
  if (cur && cur.date === today) return cur;

  const text = pickRandomPreset();
  const next: DailyMessageRecord = { date: today, text, isCustom: false };
  saveDailyMessage(next);
  return next;
}

export function shuffleTodayMessage(): DailyMessageRecord {
  const prev = loadDailyMessage();
  const text = pickRandomPreset(prev?.date === todayKey() ? prev.text : undefined);
  const next: DailyMessageRecord = { date: todayKey(), text, isCustom: false };
  saveDailyMessage(next);
  return next;
}

export function loadDailyMessageExpanded(): boolean {
  return loadJson<boolean>(LQ_KEYS.dailyMessageExpanded, false);
}

export function saveDailyMessageExpanded(expanded: boolean): void {
  saveJson(LQ_KEYS.dailyMessageExpanded, expanded);
}

export function saveCustomTodayMessage(text: string): DailyMessageRecord | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const next: DailyMessageRecord = { date: todayKey(), text: trimmed, isCustom: true };
  saveDailyMessage(next);
  return next;
}
