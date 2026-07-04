import { todayKey } from './dates';
import {
  buildXiaoiHeroMessages,
  getXiaoiStateProfile,
  XIAOI_BACK_ANGRY_MESSAGE_LOGGED_OUT,
  XIAOI_BACK_ANGRY_MESSAGE_UNBOUND,
  XIAOI_STATE_PROFILES,
} from '../xiaoi/xiaoiStateProfiles';
import type { XiaoiState, XiaoiStateInput, XiaoiStateResult } from '../xiaoi/types';

export type { XiaoiState, XiaoiStateResult } from '../xiaoi/types';

export const XIAOI_HERO_MESSAGES = buildXiaoiHeroMessages();

/** 深夜時段：22:00–06:59（07:00 起視為白天） */
export function isXiaoiNightHour(hour: number): boolean {
  return hour >= 22 || hour < 7;
}

function daysSinceLastInteraction(lastInteractionDate: string | null, today: string): number {
  if (!lastInteractionDate) return 999;
  const last = new Date(`${lastInteractionDate}T12:00:00`);
  const ref = new Date(`${today}T12:00:00`);
  if (Number.isNaN(last.getTime()) || Number.isNaN(ref.getTime())) return 999;
  return Math.floor((ref.getTime() - last.getTime()) / 86_400_000);
}

function profileToResult(
  state: XiaoiState,
  messageOverride?: string
): XiaoiStateResult {
  const profile = getXiaoiStateProfile(state);
  return {
    state: profile.state,
    imageName: profile.imageName,
    title: profile.displayName,
    message: messageOverride ?? profile.detailMessage,
  };
}

function backAngryResult(message: string): XiaoiStateResult {
  return profileToResult('back_angry', message);
}

export function getXiaoiState(input: XiaoiStateInput): XiaoiStateResult {
  const today = input.today ?? todayKey();
  const hour = input.currentHour ?? new Date().getHours();
  const flameDays = Math.max(0, Math.floor(input.flameDays));
  const daysSince = daysSinceLastInteraction(input.lastInteractionDate, today);

  if (input.isLoggedIn === false) {
    return backAngryResult(XIAOI_BACK_ANGRY_MESSAGE_LOGGED_OUT);
  }

  if (input.isCoupleBound === false) {
    return backAngryResult(XIAOI_BACK_ANGRY_MESSAGE_UNBOUND);
  }

  if (flameDays <= 0 || daysSince > 1) {
    return backAngryResult(XIAOI_STATE_PROFILES.back_angry.detailMessage);
  }

  if (input.hasInteractedToday === true) {
    return profileToResult('happy');
  }

  if (isXiaoiNightHour(hour)) {
    return profileToResult('sleepy');
  }

  return profileToResult('sad');
}
