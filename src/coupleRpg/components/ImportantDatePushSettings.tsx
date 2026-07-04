import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, ChevronRight } from 'lucide-react';
import {
  getLoveQuestNotificationPermission,
  isLoveQuestNativeNotificationsAvailable,
  loveQuestNotificationPermissionLabel,
  requestLoveQuestNotificationPermission,
  type LoveQuestNotificationPermission,
} from '../../services/notificationService';
import { useLoveQuest } from '../context/LoveQuestContext';
import { buildImportantDateEvents } from '../lib/importantDateEvents';
import {
  formatEnabledOffsetsLabel,
  getEventSettings,
  toggleOffsetsInList,
  updateEventSettings,
} from '../storage/importantDateRemindersStore';
import {
  DEFAULT_EVENT_SETTINGS,
  type ReminderOffsetDays,
} from '../storage/importantDateReminderTypes';
import { ReminderOffsetPicker } from './ReminderOffsetPicker';
import { lq } from '../theme';

type Props = {
  onPermissionGranted?: () => void;
};

function offsetsKey(offsets: ReminderOffsetDays[]): string {
  return [...offsets].sort((a, b) => a - b).join(',');
}

function compactOffsetSummary(offsets: ReminderOffsetDays[]): string {
  if (offsets.length === 0) return '尚未設定';
  const labels = offsets.map((o) => {
    if (o === 0) return '當天';
    if (o === 1) return '前一天';
    if (o === 3) return '前三天';
    if (o === 7) return '前七天';
    if (o === 14) return '十四天';
    if (o === 30) return '三十天';
    return `前 ${o} 天`;
  });
  return labels.map((l) => `✔ ${l}`).join('　');
}

export function ImportantDatePushSettings({ onPermissionGranted }: Props) {
  const native = isLoveQuestNativeNotificationsAvailable();
  const {
    coupleExtended,
    importantDateReminders,
    patchImportantDateReminder,
    rescheduleImportantDatePush,
  } = useLoveQuest();
  const [permission, setPermission] = useState<LoveQuestNotificationPermission>('prompt');
  const [requesting, setRequesting] = useState(false);
  const [offsetsOpen, setOffsetsOpen] = useState(false);

  const events = useMemo(() => {
    try {
      return buildImportantDateEvents(coupleExtended);
    } catch {
      return [];
    }
  }, [coupleExtended]);

  const globalOffsets = useMemo((): ReminderOffsetDays[] => {
    if (events.length === 0) return DEFAULT_EVENT_SETTINGS.offsets;
    const first = getEventSettings(importantDateReminders, events[0]!.id).offsets;
    const same = events.every(
      (ev) => offsetsKey(getEventSettings(importantDateReminders, ev.id).offsets) === offsetsKey(first)
    );
    return same && first.length ? first : DEFAULT_EVENT_SETTINGS.offsets;
  }, [events, importantDateReminders]);

  const refresh = useCallback(async () => {
    setPermission(await getLoveQuestNotificationPermission());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyGlobalOffsets = useCallback(
    (offsets: ReminderOffsetDays[]) => {
      if (!events.length) return;
      patchImportantDateReminder((data) => {
        let next = data;
        for (const ev of events) {
          next = updateEventSettings(next, ev.id, { offsets: [...offsets] });
        }
        return next;
      });
    },
    [events, patchImportantDateReminder]
  );

  const toggleGlobalOffset = useCallback(
    (offset: ReminderOffsetDays) => {
      const next = toggleOffsetsInList(globalOffsets, offset);
      applyGlobalOffsets(next);
    },
    [globalOffsets, applyGlobalOffsets]
  );

  const onRequest = async () => {
    setRequesting(true);
    try {
      const next = await requestLoveQuestNotificationPermission();
      setPermission(next);
      if (next === 'granted') {
        onPermissionGranted?.();
        await rescheduleImportantDatePush();
      }
    } finally {
      setRequesting(false);
    }
  };

  const granted = permission === 'granted';

  return (
    <div className="mb-3 space-y-2">
      <div className="rounded-[20px] bg-white/80 px-3.5 py-3 shadow-sm ring-1 ring-rose-100/70">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              granted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}
            aria-hidden
          >
            {granted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[13px] font-bold ${lq.text}`}>
              {native ? loveQuestNotificationPermissionLabel(permission) : '推播通知：網頁版不支援'}
            </p>
            <p className={`mt-0.5 text-[11px] leading-relaxed ${lq.textSecondary}`}>
              iPhone 本機推播，沒開 App 也會提醒
            </p>
            {native && !granted ? (
              <button
                type="button"
                onClick={() => void onRequest()}
                disabled={requesting || permission === 'denied'}
                className={`mt-2 ${lq.btnPrimary} !h-9 !min-h-9 !px-4 !text-[13px]`}
              >
                {requesting ? '處理中…' : permission === 'denied' ? '請至系統設定開啟通知' : '開啟推播通知'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="overflow-hidden rounded-[20px] bg-white/80 shadow-sm ring-1 ring-rose-100/70">
          <button
            type="button"
            onClick={() => setOffsetsOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-3.5 py-3 text-left active:bg-rose-50/40"
            aria-expanded={offsetsOpen}
          >
            <span className="text-lg" aria-hidden>
              🔔
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold text-stone-900">提醒設定</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-relaxed text-stone-500">
                目前：{compactOffsetSummary(globalOffsets)}
              </p>
            </div>
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-stone-400 transition ${offsetsOpen ? 'rotate-90' : ''}`}
              aria-hidden
            />
          </button>
          {offsetsOpen ? (
            <div className="border-t border-rose-50 px-3.5 pb-3.5 pt-2">
              <p className="mb-2 text-[11px] font-bold text-stone-500">
                套用至所有重要日子 · {formatEnabledOffsetsLabel(globalOffsets)}
              </p>
              <ReminderOffsetPicker selected={globalOffsets} onToggle={toggleGlobalOffset} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
