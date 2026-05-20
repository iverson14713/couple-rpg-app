export type AnniversaryEventType =
  | 'relationship'
  | 'birthday'
  | 'valentine'
  | 'christmas'
  | 'qixi'
  | 'important'
  | 'other';

export type AnniversaryEvent = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  type: AnniversaryEventType;
  note: string;
  repeatYearly: boolean;
  celebratedYears: string[];
  planRewardedYears: string[];
};

export type AnniversaryPlan = {
  datePlan: string;
  budget: string;
  schedule: string;
  surprises: string;
  backup: string;
  generatedAt: string;
};

export type GiftSuggestion = {
  id: string;
  name: string;
  budgetRange: string;
  whyFit: string;
  prepTip: string;
};

export type GiftPreferences = {
  favoriteColor: string;
  interests: string;
  budget: string;
  dislikes: string;
};

export type AnniversaryData = {
  events: AnniversaryEvent[];
  plans: Record<string, AnniversaryPlan>;
  giftPreferences: GiftPreferences;
  lastGiftSuggestions: GiftSuggestion[];
  /** `${eventId}:${occurrenceYear}:${offset}` -> acknowledged date key */
  reminderAck: Record<string, string>;
};

export type UpcomingEvent = {
  event: AnniversaryEvent;
  occurrenceDate: string;
  daysUntil: number;
  typeLabel: string;
  emoji: string;
};

export type ActiveAnniversaryReminder = {
  id: string;
  event: AnniversaryEvent;
  occurrenceDate: string;
  daysUntil: number;
  offset: 7 | 3 | 0;
  message: string;
  emoji: string;
};

export const DEFAULT_GIFT_PREFERENCES = (): GiftPreferences => ({
  favoriteColor: '',
  interests: '',
  budget: '',
  dislikes: '',
});

export const DEFAULT_ANNIVERSARY_DATA = (): AnniversaryData => ({
  events: [],
  plans: {},
  giftPreferences: DEFAULT_GIFT_PREFERENCES(),
  lastGiftSuggestions: [],
  reminderAck: {},
});
