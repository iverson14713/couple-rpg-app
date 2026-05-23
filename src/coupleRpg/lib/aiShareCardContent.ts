import { dateItineraryRecordId, importantDateRecordId } from './aiRecordIds';
import { buildLocalShareRef, type AiShareRef } from './aiShareConfig';
import type { SavedDateItineraryAi } from '../storage/dateItineraryAiCache';
import { formatSavedItineraryDate } from '../storage/dateItineraryAiCache';
import type { SavedImportantDateAi } from '../storage/importantDateAiCache';
import { formatSavedImportantDateLabel } from '../storage/importantDateAiCache';
import { isSavedImportantItineraryPlan } from './importantDateItineraryPlan';

export type AiShareCardPayload = {
  kind: 'date_itinerary' | 'important_date';
  emoji: string;
  title: string;
  dateLabel: string;
  subtitle: string;
  summaryLines: string[];
  /** 收藏／紀錄列表用 */
  recordId?: string;
  /** Phase 2：公開分享頁、deep link */
  shareRef?: AiShareRef;
};

function trimLines(lines: string[], max = 4): string[] {
  return lines.filter(Boolean).slice(0, max);
}

export function buildDateItinerarySharePayload(record: SavedDateItineraryAi): AiShareCardPayload {
  const plan = record.plan;
  const lines: string[] = [];
  if (plan.segments.length > 0) {
    for (const seg of plan.segments.slice(0, 3)) {
      const label = seg.headline || seg.place;
      const detail = seg.narrative || seg.activity || '';
      lines.push(`${seg.period}｜${label}${detail ? `：${detail.slice(0, 48)}` : ''}`);
    }
  }
  if (plan.mood) lines.push(`💕 ${plan.mood}`);
  const tip = plan.aiReminders?.[0] ?? plan.tips?.[0];
  if (tip) lines.push(`✨ ${tip}`);
  if (plan.estimatedTotal) lines.push(`💰 總計 ${plan.estimatedTotal}`);
  else if (plan.budgetTier || plan.budgetNote || plan.budget) {
    lines.push(`💰 ${plan.budgetTier ?? ''} ${plan.budgetNote ?? plan.budget ?? ''}`.trim());
  }

  return {
    kind: 'date_itinerary',
    emoji: record.suggestion.emoji || '💑',
    title: plan.title || record.suggestion.title,
    dateLabel: formatSavedItineraryDate(record),
    subtitle: record.suggestion.title,
    summaryLines: trimLines(lines),
    recordId: dateItineraryRecordId(record),
    shareRef: buildLocalShareRef('date_itinerary', record.savedAt),
  };
}

export function buildImportantDateSharePayload(record: SavedImportantDateAi): AiShareCardPayload {
  const plan = record.plan;
  const lines: string[] = [];

  if (isSavedImportantItineraryPlan(plan)) {
    for (const seg of plan.segments.slice(0, 3)) {
      const label = seg.headline || seg.place;
      const detail = seg.narrative || seg.activity || '';
      lines.push(`${seg.period}｜${label}${detail ? `：${detail.slice(0, 48)}` : ''}`);
    }
    if (plan.mood) lines.push(`💕 ${plan.mood}`);
    const tip = plan.aiReminders?.[0] ?? plan.tips?.[0];
    if (tip) lines.push(`✨ ${tip}`);
    if (plan.estimatedTotal) lines.push(`💰 總計 ${plan.estimatedTotal}`);
  } else {
    if (plan.dateIdeas) lines.push(plan.dateIdeas);
    if (plan.timeline[0]) {
      const t = plan.timeline[0];
      lines.push(`${t.period} · ${t.activity}`);
    }
    if (plan.phrase) lines.push(`💬 ${plan.phrase}`);
    if (plan.gifts[0]) lines.push(`🎁 ${plan.gifts[0]}`);
  }

  return {
    kind: 'important_date',
    emoji: record.event.icon || '✨',
    title: plan.title || record.event.displayTitle,
    dateLabel: formatSavedImportantDateLabel(record),
    subtitle: record.event.typeLabel,
    summaryLines: trimLines(lines),
    recordId: importantDateRecordId(record),
    shareRef: buildLocalShareRef('important_date', record.savedAt),
  };
}
