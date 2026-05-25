import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
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
    <div className={`mb-3 p-3.5 ${lq.cardSoft}`}>
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
          <p className={`mt-1 text-[12px] leading-relaxed ${lq.textSecondary}`}>
            iPhone 本機推播提醒，即使沒有打開 App 也能收到通知。
          </p>
          {native && !granted ? (
            <button
              type="button"
              onClick={() => void onRequest()}
              disabled={requesting || permission === 'denied'}
              className={`mt-2.5 ${lq.btnPrimary} !h-9 !min-h-9 !px-4 !text-[13px]`}
            >
              {requesting ? '處理中…' : permission === 'denied' ? '請至系統設定開啟通知' : '開啟推播通知'}
            </button>
          ) : null}
        </div>
      </div>

      {events.length > 0 ? (
        <div className="mt-3.5 border-t border-rose-100/60 pt-3">
          <p className={`mb-2 text-[12px] font-bold ${lq.text}`}>提醒時間（套用至所有重要日子）</p>
          <ReminderOffsetPicker selected={globalOffsets} onToggle={toggleGlobalOffset} />
        </div>
      ) : null}
    </div>
  );
}
