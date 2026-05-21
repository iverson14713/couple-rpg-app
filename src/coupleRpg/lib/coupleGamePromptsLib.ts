import type {
  CoupleGameModeDef,
  CoupleGameModeId,
  CoupleGamePrompt,
  PromptTier,
} from '../data/coupleGamePrompts';
import { COUPLE_GAME_MODES, COUPLE_GAME_PROMPTS } from '../data/coupleGamePrompts';

export function getPromptsForMode(mode: CoupleGameModeId, tier: PromptTier): CoupleGamePrompt[] {
  return COUPLE_GAME_PROMPTS.filter((p) => p.mode === mode && p.tier === tier);
}

export function getAvailablePromptPool(mode: CoupleGameModeId, isPro: boolean): CoupleGamePrompt[] {
  const free = getPromptsForMode(mode, 'free');
  if (!isPro) return free;
  const pro = getPromptsForMode(mode, 'pro');
  return [...free, ...pro];
}

export function formatPromptLine(prompt: CoupleGamePrompt): string {
  if (prompt.description) return `${prompt.title} — ${prompt.description}`;
  return prompt.title;
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
      headline: '目前題庫：完整題庫已解鎖',
      subline: `共 ${availableCount} 題（基本 + Pro 進階）`,
      freePromptCount,
      proPromptCount,
      availableCount,
    };
  }
  return {
    headline: '目前題庫：基本題庫',
    subline: '升級 Pro 解鎖更多題目',
    freePromptCount,
    proPromptCount,
    availableCount,
  };
}

export function countPromptsByMode(mode: CoupleGameModeId, isPro: boolean): number {
  return getAvailablePromptPool(mode, isPro).length;
}
