import { AUTH_LOGIN_ANCHOR_ID, DELETE_ACCOUNT_ANCHOR_ID } from './authNav';

export const IMPORTANT_DATE_REMINDERS_ANCHOR_ID = 'lq-important-date-reminders';

export type SettingsScreenId =
  | 'hub'
  | 'pro'
  | 'account'
  | 'coupleSpace'
  | 'coupleProfile'
  | 'reminders'
  | 'about';

const COUPLE_PROFILE_ANCHOR_ID = 'lq-couple-profile';

const SCROLL_TO_SETTINGS_SCREEN: Record<string, SettingsScreenId> = {
  [AUTH_LOGIN_ANCHOR_ID]: 'account',
  [DELETE_ACCOUNT_ANCHOR_ID]: 'account',
  [COUPLE_PROFILE_ANCHOR_ID]: 'coupleProfile',
  [IMPORTANT_DATE_REMINDERS_ANCHOR_ID]: 'reminders',
};

export function settingsScreenForScrollTarget(elementId: string | null): SettingsScreenId | null {
  if (!elementId) return null;
  return SCROLL_TO_SETTINGS_SCREEN[elementId] ?? null;
}
