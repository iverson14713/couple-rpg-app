import { memo, type ReactNode } from 'react';
import type { ImportantDateEvent } from '../lib/importantDateEvents';
import { importantDateTheme } from '../lib/importantDateThemes';
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
  const theme = importantDateTheme(event.kind, event.name);
  const displayOffsets = isEditing ? draftOffsets : savedOffsets;
  const reminderOn = displayOffsets.length > 0;

  return (
    <li className={`overflow-hidden rounded-[22px] p-3.5 shadow-sm ${theme.card}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[1.65rem] ${theme.iconBg}`}
        >
          {event.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-extrabold leading-tight ${lq.text}`}>{event.name}</p>
          <p className={`mt-0.5 text-[12px] font-semibold ${theme.muted}`}>{event.dateLabel}</p>
        </div>
        <div className="shrink-0 text-right">
          {event.isToday ? (
            <p className={`text-[13px] font-extrabold ${theme.accent}`}>就是今天</p>
          ) : event.status === 'past' ? (
            <p className={`text-[12px] font-bold ${theme.muted}`}>已過 {event.daysSince} 天</p>
          ) : (
            <>
              <p className={`text-[10px] font-bold ${theme.muted}`}>還有</p>
              <p className={`text-[22px] font-black leading-none tracking-tight ${theme.accent}`}>
                {event.daysUntil}
                <span className="ml-0.5 text-[12px] font-bold">天</span>
              </p>
            </>
          )}
        </div>
      </div>

      <div className={`my-3 h-px bg-gradient-to-r from-transparent via-stone-200/80 to-transparent`} />

      <div className="flex flex-wrap gap-1.5">
        {reminderOn ? (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${theme.chip}`}>
            ❤️ 已開啟提醒
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-500">
            尚未設定提醒
          </span>
        )}
        {giftPrepared || activityPlanned ? (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${theme.chip}`}>
            ✨ {giftPrepared && activityPlanned ? '禮物與活動' : giftPrepared ? '禮物已準備' : '活動已安排'}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={isEditing ? onCloseEdit : () => onOpenEdit(event.id)}
          className={`flex-1 rounded-2xl border px-3 py-2.5 text-[12px] font-bold transition active:scale-[0.98] ${
            isEditing
              ? 'border-rose-300 bg-white/90 text-rose-800'
              : 'border-white/80 bg-white/70 text-stone-700'
          }`}
        >
          🔔 {isEditing ? '收起' : '提醒'}
        </button>
        <button
          type="button"
          onClick={() => onOpenAi(event.id)}
          disabled={aiDisabled}
          className="flex min-h-[44px] flex-[1.2] items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-2.5 text-[12px] font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          ✨ {aiButtonLabel}
          <ProBadgeIfNeeded show={showAiProBadge} feature="ai_in_app" size="sm" />
        </button>
      </div>

      {isEditing ? (
        <div className="mt-3 rounded-2xl border border-white/80 bg-white/75 p-3">
          <p className="mb-2 text-[11px] font-bold text-stone-600">
            提醒時間 · {formatEnabledOffsetsLabel(displayOffsets)}
            <span className="text-stone-400"> · 尚未儲存</span>
          </p>
          <ReminderOffsetPicker
            selected={draftOffsets}
            onToggle={(offset) => onToggleDraftOffset(event.id, offset)}
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <MiniToggle active={giftPrepared} onClick={() => onToggleGift(event.id)}>
              🎁 禮物
            </MiniToggle>
            <MiniToggle active={activityPlanned} onClick={() => onToggleActivity(event.id)}>
              📅 活動
            </MiniToggle>
          </div>
          <button
            type="button"
            onClick={() => onSaveOffsets(event.id)}
            className={`mt-2.5 w-full rounded-xl py-2.5 text-[12px] font-bold transition active:scale-[0.98] ${lq.btnSecondary}`}
          >
            儲存提醒設定
          </button>
        </div>
      ) : null}
    </li>
  );
}

function MiniToggle({
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
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 transition active:scale-[0.98] ${
        active ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-stone-50 text-stone-600 ring-stone-200'
      }`}
    >
      {children}
    </button>
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
