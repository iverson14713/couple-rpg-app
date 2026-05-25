/**
 * LoveQuest — iOS/Android 本機推播（Capacitor Local Notifications）
 * 重要日子每年重複提醒；不依賴伺服器。
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isLoveQuestDevMode } from '../coupleRpg/lib/loveQuestDevMode';
import { buildImportantDateEvents } from '../coupleRpg/lib/importantDateEvents';
import type { CoupleExtendedProfile } from '../coupleRpg/storage/coupleExtendedTypes';
import { getEventSettings } from '../coupleRpg/storage/importantDateRemindersStore';
import type {
  ImportantDateRemindersData,
  ReminderOffsetDays,
} from '../coupleRpg/storage/importantDateReminderTypes';

export const LOVEQUEST_NOTIFICATION_TITLE = 'LoveQuest 重要日子提醒';

export type LoveQuestNotificationPermission = 'unsupported' | 'prompt' | 'granted' | 'denied';

const NOTIFICATION_HOUR = 9;
const NOTIFICATION_MINUTE = 0;
const ID_BASE = 40_000;
const ID_SPAN = 900_000;

/** 除錯測試推播（不與重要日子 ID 衝突） */
export const LOVEQUEST_DEBUG_TEST_NOTIFICATION_ID = 39_999;

export const LOVEQUEST_DEBUG_TEST_NOTIFICATION_TITLE = 'LoveQuest 測試提醒';
export const LOVEQUEST_DEBUG_TEST_NOTIFICATION_BODY =
  '如果你看到這則通知，代表 iOS 本機推播正常';

export function isLoveQuestNativeNotificationsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function getLoveQuestNotificationPermission(): Promise<LoveQuestNotificationPermission> {
  if (!isLoveQuestNativeNotificationsAvailable()) return 'unsupported';
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted' || display === 'denied' || display === 'prompt') return display;
    return 'prompt';
  } catch (e) {
    console.warn('[lovequest-notifications] checkPermissions', e);
    return 'unsupported';
  }
}

/** 第一次使用提醒功能時請求權限 */
export async function requestLoveQuestNotificationPermission(): Promise<LoveQuestNotificationPermission> {
  if (!isLoveQuestNativeNotificationsAvailable()) return 'unsupported';
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted' || display === 'denied' || display === 'prompt') return display;
    return 'prompt';
  } catch (e) {
    console.warn('[lovequest-notifications] requestPermissions', e);
    return 'unsupported';
  }
}

export function loveQuestNotificationPermissionLabel(
  permission: LoveQuestNotificationPermission
): string {
  if (permission === 'granted') return '推播通知：已開啟';
  if (permission === 'denied') return '推播通知：尚未開啟（請至系統設定允許）';
  if (permission === 'prompt') return '推播通知：尚未開啟';
  return '推播通知：此裝置不支援';
}

export function buildImportantDateNotificationBody(
  eventLabel: string,
  offset: ReminderOffsetDays
): string {
  const name = eventLabel.trim() || '重要日子';
  switch (offset) {
    case 0:
      return `今天是「${name}」，記得一起慶祝一下 💕`;
    case 1:
      return `明天是「${name}」，別忘了準備一點小驚喜 💕`;
    case 3:
      return `3 天後是「${name}」，可以開始準備小驚喜囉 💕`;
    case 7:
      return `7 天後是「${name}」，可以開始準備小驚喜囉 💕`;
    case 14:
      return `14 天後是「${name}」，可以開始準備小驚喜囉 💕`;
    case 30:
      return `30 天後是「${name}」，可以開始準備小驚喜囉 💕`;
    default:
      return `「${name}」快到了，別忘了準備一點小驚喜 💕`;
  }
}

/** 穩定數字 ID：eventId + 提前天數 */
export function loveQuestNotificationNumericId(eventId: string, offset: ReminderOffsetDays): number {
  const key = `lq:${eventId}:${offset}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
  }
  const positive = Math.abs(hash);
  return ID_BASE + (positive % ID_SPAN);
}

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** 今年或明年：事件當天 09:00，再往前 offset 天 */
function nextAlertDateForAnnual(
  eventDateYmd: string,
  offset: ReminderOffsetDays,
  from: Date = new Date()
): Date | null {
  const p = parseYmd(eventDateYmd);
  if (!p) return null;

  const minMs = from.getTime() + 60_000;
  const years = [from.getFullYear(), from.getFullYear() + 1];

  for (const year of years) {
    const eventDay = new Date(year, p.m - 1, p.d, NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0);
    const alert = new Date(eventDay);
    alert.setDate(alert.getDate() - offset);
    if (alert.getTime() >= minMs) return alert;
  }
  return null;
}

export type ScheduledLoveQuestNotification = {
  id: number;
  eventId: string;
  offset: ReminderOffsetDays;
  at: Date;
  title: string;
  body: string;
};

export function buildLoveQuestNotificationSchedule(
  profile: CoupleExtendedProfile,
  reminders: ImportantDateRemindersData,
  from: Date = new Date()
): ScheduledLoveQuestNotification[] {
  const events = buildImportantDateEvents(profile, from);
  const out: ScheduledLoveQuestNotification[] = [];

  for (const event of events) {
    const settings = getEventSettings(reminders, event.id);
    if (!settings.offsets.length) continue;

    const label = event.displayTitle || event.name;
    for (const offset of settings.offsets) {
      const at = nextAlertDateForAnnual(event.dateYmd, offset, from);
      if (!at) continue;
      out.push({
        id: loveQuestNotificationNumericId(event.id, offset),
        eventId: event.id,
        offset,
        at,
        title: LOVEQUEST_NOTIFICATION_TITLE,
        body: buildImportantDateNotificationBody(label, offset),
      });
    }
  }

  return out;
}

async function listLoveQuestPendingIds(): Promise<number[]> {
  try {
    const { notifications } = await LocalNotifications.getPending();
    return (notifications ?? [])
      .map((n) => n.id)
      .filter((id): id is number => typeof id === 'number' && id >= ID_BASE && id < ID_BASE + ID_SPAN);
  } catch {
    return [];
  }
}

export type ScheduleLoveQuestDebugTestResult = {
  ok: boolean;
  permission: LoveQuestNotificationPermission;
  message: string;
};

/** 除錯：10 秒後觸發一則測試本機推播 */
export async function scheduleLoveQuestDebugTestNotification(): Promise<ScheduleLoveQuestDebugTestResult> {
  if (!isLoveQuestDevMode()) {
    return { ok: false, permission: 'unsupported', message: '僅開發模式可用' };
  }

  if (!isLoveQuestNativeNotificationsAvailable()) {
    return { ok: false, permission: 'unsupported', message: '此裝置不支援本機推播' };
  }

  const permission = await requestLoveQuestNotificationPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      permission,
      message:
        permission === 'denied'
          ? '請至系統設定允許 LoveQuest 通知'
          : '請允許通知權限後再試',
    };
  }

  const at = new Date(Date.now() + 10_000);
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: LOVEQUEST_DEBUG_TEST_NOTIFICATION_ID }],
    });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: LOVEQUEST_DEBUG_TEST_NOTIFICATION_ID,
          title: LOVEQUEST_DEBUG_TEST_NOTIFICATION_TITLE,
          body: LOVEQUEST_DEBUG_TEST_NOTIFICATION_BODY,
          schedule: { at, allowWhileIdle: true },
          extra: { source: 'lovequest-debug-test' },
        },
      ],
    });
    return { ok: true, permission, message: '已排程，約 10 秒後會收到測試通知' };
  } catch (e) {
    console.error('[lovequest-notifications] debug test schedule failed', e);
    return { ok: false, permission, message: '排程失敗，請稍後再試' };
  }
}

export async function cancelAllLoveQuestScheduledNotifications(): Promise<void> {
  if (!isLoveQuestNativeNotificationsAvailable()) return;
  const ids = await listLoveQuestPendingIds();
  if (!ids.length) return;
  try {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch (e) {
    console.warn('[lovequest-notifications] cancel', e);
  }
}

export async function rescheduleLoveQuestImportantDateNotifications(
  profile: CoupleExtendedProfile,
  reminders: ImportantDateRemindersData
): Promise<{ scheduled: number; permission: LoveQuestNotificationPermission }> {
  const permission = await getLoveQuestNotificationPermission();
  if (permission !== 'granted') {
    return { scheduled: 0, permission };
  }

  await cancelAllLoveQuestScheduledNotifications();

  const rows = buildLoveQuestNotificationSchedule(profile, reminders);
  if (!rows.length) return { scheduled: 0, permission };

  try {
    await LocalNotifications.schedule({
      notifications: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        schedule: { at: row.at, allowWhileIdle: true },
        extra: { eventId: row.eventId, offset: row.offset, source: 'lovequest' },
      })),
    });
    return { scheduled: rows.length, permission };
  } catch (e) {
    console.error('[lovequest-notifications] schedule failed', e);
    return { scheduled: 0, permission };
  }
}

export type LoveQuestNotificationOpenHandler = () => void;

let openHandler: LoveQuestNotificationOpenHandler | null = null;

export function setLoveQuestNotificationOpenHandler(handler: LoveQuestNotificationOpenHandler | null): void {
  openHandler = handler;
}

let listenersBound = false;

/** App 啟動時呼叫一次：點擊通知回到 App */
export function initLoveQuestNotificationBridge(): void {
  if (!isLoveQuestNativeNotificationsAvailable() || listenersBound) return;
  listenersBound = true;

  void LocalNotifications.addListener('localNotificationActionPerformed', () => {
    openHandler?.();
  });

  void LocalNotifications.addListener('localNotificationReceived', () => {
    /* 前景可選處理 */
  });
}
