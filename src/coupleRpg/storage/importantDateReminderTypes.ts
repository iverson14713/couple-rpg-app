/** 提前幾天提醒（0 = 當天） */
export type ReminderOffsetDays = 0 | 1 | 3 | 7 | 14 | 30;

export type ImportantDateEventSettings = {
  offsets: ReminderOffsetDays[];
  giftPrepared: boolean;
  activityPlanned: boolean;
  /** AI 面板：對方喜好備註 */
  partnerPrefs: string;
};

export type ImportantDateRemindersData = {
  version: 1;
  byEventId: Record<string, ImportantDateEventSettings>;
  /** reminderId → 使用者點「知道了」的日期 YYYY-MM-DD */
  dismissedAck?: Record<string, string>;
};

export const DEFAULT_EVENT_SETTINGS: ImportantDateEventSettings = {
  offsets: [7],
  giftPrepared: false,
  activityPlanned: false,
  partnerPrefs: '',
};

export const REMINDER_OFFSET_OPTIONS: { value: ReminderOffsetDays; label: string }[] = [
  { value: 0, label: '當天提醒' },
  { value: 1, label: '前 1 天' },
  { value: 3, label: '前 3 天' },
  { value: 7, label: '前 7 天' },
  { value: 14, label: '前 14 天' },
  { value: 30, label: '前 30 天' },
];
