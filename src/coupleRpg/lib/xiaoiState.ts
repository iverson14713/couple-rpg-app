import { todayKey } from './dates';

export type XiaoiState = 'happy' | 'sad' | 'sleepy' | 'back_angry';

export type XiaoiStateResult = {
  state: XiaoiState;
  imageName: string;
  title: string;
  message: string;
  /** Reserved for future pet level visuals */
  level?: number;
  /** Reserved for future skins */
  skin?: string;
  /** Reserved for future backgrounds */
  background?: string;
  /** Reserved for future animations */
  animation?: string;
};

export const XIAOI_HERO_MESSAGES: Record<XiaoiState, string> = {
  happy: '今天好幸福 💕',
  sad: '我在等你們說說話…🥺',
  sleepy: '晚安，明天也要好好愛對方',
  back_angry: '快把我們的愛哄回來',
};

function isNightHour(hour: number): boolean {
  return hour >= 23 || hour < 7;
}

function daysSinceLastInteraction(lastInteractionDate: string | null, today: string): number {
  if (!lastInteractionDate) return 999;
  const last = new Date(`${lastInteractionDate}T12:00:00`);
  const ref = new Date(`${today}T12:00:00`);
  if (Number.isNaN(last.getTime()) || Number.isNaN(ref.getTime())) return 999;
  return Math.floor((ref.getTime() - last.getTime()) / 86_400_000);
}

function backAngryResult(message: string): XiaoiStateResult {
  return {
    state: 'back_angry',
    imageName: 'xiaoi_back_angry',
    title: '小愛鬧脾氣了',
    message,
  };
}

export function getXiaoiState(input: {
  hasInteractedToday: boolean;
  flameDays: number;
  lastInteractionDate: string | null;
  isLoggedIn?: boolean;
  isCoupleBound?: boolean;
  currentHour?: number;
  today?: string;
}): XiaoiStateResult {
  const today = input.today ?? todayKey();
  const hour = input.currentHour ?? new Date().getHours();
  const flameDays = Math.max(0, Math.floor(input.flameDays));
  const daysSince = daysSinceLastInteraction(input.lastInteractionDate, today);

  if (input.isLoggedIn === false) {
    return backAngryResult('登入後讓小愛陪你們互動');
  }

  if (input.isCoupleBound === false) {
    return backAngryResult('綁定另一半，喚醒你們的小愛');
  }

  if (flameDays <= 0 || daysSince > 1) {
    return backAngryResult('快把我們的愛哄回來');
  }

  if (input.hasInteractedToday === true) {
    return {
      state: 'happy',
      imageName: 'xiaoi_happy',
      title: '今天好幸福',
      message: '互動完成，小愛超開心 💕',
    };
  }

  if (isNightHour(hour)) {
    return {
      state: 'sleepy',
      imageName: 'xiaoi_sleepy',
      title: '小愛睡著了',
      message: '明天也要好好愛對方',
    };
  }

  return {
    state: 'sad',
    imageName: 'xiaoi_sad',
    title: '小愛在等你',
    message: '今天還沒互動，別冷落對方 🥺',
  };
}
