import { dateItineraryRecordId, importantDateRecordId } from './aiRecordIds';
import { buildLocalShareRef, type AiShareRef } from './aiShareConfig';
import type { SavedDateItineraryAi } from '../storage/dateItineraryAiCache';
import { formatSavedItineraryDate } from '../storage/dateItineraryAiCache';
import type { SavedImportantDateAi } from '../storage/importantDateAiCache';
import { formatSavedImportantDateLabel } from '../storage/importantDateAiCache';

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
      lines.push(`${seg.period} · ${seg.place}${seg.activity ? `：${seg.activity}` : ''}`);
    }
  }
  if (plan.tips[0]) lines.push(`✨ ${plan.tips[0]}`);
  if (plan.budget) lines.push(`💰 ${plan.budget}`);

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
  if (plan.dateIdeas) lines.push(plan.dateIdeas);
  if (plan.timeline[0]) {
    const t = plan.timeline[0];
    lines.push(`${t.period} · ${t.activity}`);
  }
  if (plan.phrase) lines.push(`💬 ${plan.phrase}`);
  if (plan.gifts[0]) lines.push(`🎁 ${plan.gifts[0]}`);

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
