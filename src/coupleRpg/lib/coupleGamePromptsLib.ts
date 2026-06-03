import type {
  CoupleGameModeDef,
  CoupleGameModeId,
  CoupleGamePrompt,
  PromptTier,
} from '../data/coupleGamePrompts';
import { COUPLE_GAME_MODES, COUPLE_GAME_PROMPTS } from '../data/coupleGamePrompts';

const FREE_MODE_IDS: CoupleGameModeId[] = [
  'coupleDice',
  'truth',
  'syncQuiz',
  'sweetTalk',
  'coupleChallenge',
];

export function getPromptsForMode(mode: CoupleGameModeId, tier: PromptTier): CoupleGamePrompt[] {
  return COUPLE_GAME_PROMPTS.filter((p) => p.mode === mode && p.tier === tier);
}

export function getAvailablePromptPool(mode: CoupleGameModeId, isPro: boolean): CoupleGamePrompt[] {
  const def = getModeDef(mode);
  if (def?.proOnly && !isPro) {
    return [];
  }
  const free = getPromptsForMode(mode, 'free');
  if (!isPro) return free;
  const pro = getPromptsForMode(mode, 'pro');
  return [...free, ...pro];
}

/** 畫面中央顯示的真正題目文字（不使用 category / id） */
export function getPromptDisplayText(prompt: CoupleGamePrompt): string {
  const text = prompt.title?.trim();
  if (!text) return '';
  if (prompt.description?.trim()) {
    return `${text} — ${prompt.description.trim()}`;
  }
  return text;
}

/** @deprecated 使用 getPromptDisplayText */
export function formatPromptLine(prompt: CoupleGamePrompt): string {
  return getPromptDisplayText(prompt);
}

export function pickGamePrompt(
  mode: CoupleGameModeId,
  isPro: boolean,
  excludeId?: string | null
): CoupleGamePrompt | null {
  const pool = getAvailablePromptPool(mode, isPro);
  if (pool.length === 0) return null;
  const candidates = excludeId ? pool.filter((p) => p.id !== excludeId) : pool;
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)] ?? list[0]!;
}

export function getModeDef(mode: CoupleGameModeId): CoupleGameModeDef | undefined {
  return COUPLE_GAME_MODES.find((m) => m.id === mode);
}

export type ModePoolCounts = {
  free: number;
  pro: number;
  total: number;
  proOnly: boolean;
};

export function getModePoolCounts(mode: CoupleGameModeId, isPro: boolean): ModePoolCounts {
  const def = getModeDef(mode);
  const proOnly = Boolean(def?.proOnly);
  const free = getPromptsForMode(mode, 'free').length;
  const pro = getPromptsForMode(mode, 'pro').length;
  if (proOnly && !isPro) {
    return { free: 0, pro, total: 0, proOnly: true };
  }
  if (!isPro) {
    return { free, pro, total: free, proOnly };
  }
  return { free, pro, total: free + pro, proOnly };
}

/** 模式標題旁的題庫數量 */
export function formatModePoolLabel(mode: CoupleGameModeId, isPro: boolean): string {
  const { free, pro, total, proOnly } = getModePoolCounts(mode, isPro);
  if (proOnly && !isPro) {
    return 'Pro 專屬';
  }
  if (!isPro) {
    return `題庫 ${free} 題`;
  }
  if (proOnly) {
    return `題庫 ${pro} 題`;
  }
  return `題庫 ${total} 題（基本 ${free} + 進階 ${pro}）`;
}

export function getCoupleGameLibraryStatus(isPro: boolean): {
  headline: string;
  subline: string;
  freePromptCount: number;
  proPromptCount: number;
  availableCount: number;
} {
  const freePromptCount = COUPLE_GAME_PROMPTS.filter((p) => p.tier === 'free').length;
  const proPromptCount = COUPLE_GAME_PROMPTS.filter((p) => p.tier === 'pro').length;
  const availableCount = isPro ? freePromptCount + proPromptCount : freePromptCount;
  if (isPro) {
    return {
      headline: '目前題庫：基本題庫 150+ · 進階已解鎖',
      subline: 'Pro 解鎖更多進階互動題庫',
      freePromptCount,
      proPromptCount,
      availableCount,
    };
  }
  return {
    headline: '目前題庫：基本題庫 150+',
    subline: 'Pro 解鎖更多進階互動題庫',
    freePromptCount,
    proPromptCount,
    availableCount,
  };
}

export function countPromptsByMode(mode: CoupleGameModeId, isPro: boolean): number {
  return getModePoolCounts(mode, isPro).total;
}

export function countFreePromptsAllModes(): number {
  return FREE_MODE_IDS.reduce((sum, mode) => sum + getPromptsForMode(mode, 'free').length, 0);
}
