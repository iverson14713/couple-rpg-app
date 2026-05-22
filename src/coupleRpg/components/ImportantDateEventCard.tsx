import { memo, type ReactNode } from 'react';
import { statusLabel, type ImportantDateEvent } from '../lib/importantDateEvents';
import { formatEnabledOffsetsLabel } from '../storage/importantDateRemindersStore';
import type { ReminderOffsetDays } from '../storage/importantDateReminderTypes';
import { ReminderOffsetPicker } from './ReminderOffsetPicker';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

export type ImportantDateEventCardProps = {
  event: ImportantDateEvent;
  savedOffsets: ReminderOffsetDays[];
  giftPrepared: boolean;
  activityPlanned: boolean;
  isEditing: boolean;
  draftOffsets: ReminderOffsetDays[];
  onOpenEdit: (eventId: string) => void;
  onCloseEdit: () => void;
  onToggleDraftOffset: (eventId: string, offset: ReminderOffsetDays) => void;
  onSaveOffsets: (eventId: string) => void;
  onToggleGift: (eventId: string) => void;
  onToggleActivity: (eventId: string) => void;
  onOpenAi: (eventId: string) => void;
  aiDisabled: boolean;
  aiButtonLabel: string;
  showAiProBadge: boolean;
};

function ImportantDateEventCardInner({
  event,
  savedOffsets,
  giftPrepared,
  activityPlanned,
  isEditing,
  draftOffsets,
  onOpenEdit,
  onCloseEdit,
  onToggleDraftOffset,
  onSaveOffsets,
  onToggleGift,
  onToggleActivity,
  onOpenAi,
  aiDisabled,
  aiButtonLabel,
  showAiProBadge,
}: ImportantDateEventCardProps) {
  const displayOffsets = isEditing ? draftOffsets : savedOffsets;

  return (
    <li className={`p-3 ${lq.card}`}>
      <div className="flex gap-2.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50/80 text-2xl">
          {event.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`text-[15px] font-bold ${lq.text}`}>{event.name}</p>
            <StatusBadge status={event.status} />
          </div>
          <p className={`text-[12px] ${lq.textSecondary}`}>
            📆 {event.dateLabel} ·{' '}
            {event.isToday
              ? '就是今天'
              : event.status === 'past'
                ? `已過 ${event.daysSince} 天`
                : `還有 ${event.daysUntil} 天`}
          </p>
          <p className="mt-1 min-h-[1rem] text-[11px] text-stone-500">
            提醒：{formatEnabledOffsetsLabel(displayOffsets)}
            {isEditing ? (
              <span className="text-stone-400"> · 尚未儲存</span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <TogglePill active={giftPrepared} onClick={() => onToggleGift(event.id)}>
              🎁 {giftPrepared ? '已準備禮物' : '標記禮物'}
            </TogglePill>
            <TogglePill active={activityPlanned} onClick={() => onToggleActivity(event.id)}>
              📅 {activityPlanned ? '已安排活動' : '標記活動'}
            </TogglePill>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={isEditing ? onCloseEdit : () => onOpenEdit(event.id)}
          className={`flex-1 rounded-xl border px-3 py-2 text-[12px] font-bold transition active:scale-[0.98] ${
            isEditing
              ? 'border-rose-300 bg-rose-50 text-rose-800'
              : 'border-stone-200 bg-white text-stone-700'
          }`}
        >
          🔔 {isEditing ? '收起設定' : '設定提醒'}
        </button>
        <button
          type="button"
          onClick={() => onOpenAi(event.id)}
          disabled={aiDisabled}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2 text-[12px] font-bold text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${lq.btnPrimary}`}
        >
          ✨ {aiButtonLabel}
          <ProBadgeIfNeeded show={showAiProBadge} feature="ai_in_app" size="sm" />
        </button>
      </div>

      {isEditing ? (
        <div className="mt-2.5 rounded-xl border border-rose-100 bg-rose-50/40 p-2.5">
          <p className="mb-2 text-[11px] font-bold text-rose-800">選擇提醒時間</p>
          <ReminderOffsetPicker
            selected={draftOffsets}
            onToggle={(offset) => onToggleDraftOffset(event.id, offset)}
          />
          <button
            type="button"
            onClick={() => onSaveOffsets(event.id)}
            className={`mt-2 w-full rounded-lg py-2 text-[12px] font-bold transition active:scale-[0.98] ${lq.btnSecondary}`}
          >
            儲存提醒設定
          </button>
        </div>
      ) : null}
    </li>
  );
}

function offsetsKey(offsets: ReminderOffsetDays[]): string {
  return [...offsets].sort((a, b) => a - b).join(',');
}

export const ImportantDateEventCard = memo(ImportantDateEventCardInner, (prev, next) => {
  return (
    prev.event.id === next.event.id &&
    prev.event.daysUntil === next.event.daysUntil &&
    prev.event.isToday === next.event.isToday &&
    prev.event.status === next.event.status &&
    prev.giftPrepared === next.giftPrepared &&
    prev.activityPlanned === next.activityPlanned &&
    prev.isEditing === next.isEditing &&
    offsetsKey(prev.savedOffsets) === offsetsKey(next.savedOffsets) &&
    offsetsKey(prev.draftOffsets) === offsetsKey(next.draftOffsets) &&
    prev.aiDisabled === next.aiDisabled &&
    prev.aiButtonLabel === next.aiButtonLabel &&
    prev.showAiProBadge === next.showAiProBadge
  );
});

function StatusBadge({ status }: { status: ImportantDateEvent['status'] }) {
  const cls =
    status === 'today'
      ? 'bg-rose-100 text-rose-800'
      : status === 'past'
        ? 'bg-stone-100 text-stone-600'
        : 'bg-amber-50 text-amber-800';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{statusLabel(status)}</span>
  );
}

function TogglePill({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-1 text-[10px] font-bold ring-1 transition active:scale-[0.98] ${
        active ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-stone-50 text-stone-600 ring-stone-200'
      }`}
    >
      {children}
    </button>
  );
}
