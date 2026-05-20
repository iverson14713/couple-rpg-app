import {
  COQUETTISH_CHALLENGES,
  DICE_ACTIONS,
  MASSAGE_PROMPT,
  STARE_PROMPT,
  TRUTH_QUESTIONS,
} from '../data/flirtGames';
import type { FlirtGameId } from './types';
import { createSeededRandom } from '../lib/seededRandom';
import { todayKey } from '../lib/dates';
import type { FlirtGamesData, FlirtGameSession } from './types';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export function defaultFlirtGamesData(): FlirtGamesData {
  return { completedToday: {}, activeSession: null };
}

export function loadFlirtGames(): FlirtGamesData {
  const data = loadJson(LQ_KEYS.flirtGames, defaultFlirtGamesData());
  return pruneCompletedToday(data);
}

function pruneCompletedToday(data: FlirtGamesData): FlirtGamesData {
  const today = todayKey();
  const completedToday: FlirtGamesData['completedToday'] = {};
  for (const [k, v] of Object.entries(data.completedToday)) {
    if (v === today) completedToday[k as FlirtGameId] = today;
  }
  return { ...data, completedToday };
}

export function saveFlirtGames(data: FlirtGamesData): void {
  saveJson(LQ_KEYS.flirtGames, data);
}

export function isGameDoneToday(data: FlirtGamesData, gameId: FlirtGameId): boolean {
  return data.completedToday[gameId] === todayKey();
}

function pickFromPool<T>(pool: T[], seed: string): T {
  const rand = createSeededRandom(seed);
  return pool[Math.floor(rand() * pool.length)]!;
}

export function rollGamePrompt(gameId: FlirtGameId, salt = ''): string {
  const seed = `${todayKey()}-${gameId}-${salt}-${Date.now()}`;
  switch (gameId) {
    case 'dice': {
      const face = 1 + Math.floor(createSeededRandom(seed)() * 6);
      const action = pickFromPool(DICE_ACTIONS, seed);
      return `🎲 點數 ${face}：${action}`;
    }
    case 'truth':
      return pickFromPool(TRUTH_QUESTIONS, seed);
    case 'coquettish':
      return pickFromPool(COQUETTISH_CHALLENGES, seed);
    case 'stare':
      return STARE_PROMPT;
    case 'massage':
      return MASSAGE_PROMPT;
    default:
      return '';
  }
}

export function startGameSession(data: FlirtGamesData, gameId: FlirtGameId): FlirtGamesData {
  const prompt = rollGamePrompt(gameId);
  const session: FlirtGameSession = {
    gameId,
    prompt,
    startedAt: new Date().toISOString(),
  };
  return { ...data, activeSession: session };
}

export function clearSession(data: FlirtGamesData): FlirtGamesData {
  return { ...data, activeSession: null };
}

export function markGameCompleted(data: FlirtGamesData, gameId: FlirtGameId): FlirtGamesData {
  const today = todayKey();
  return {
    ...data,
    activeSession: null,
    completedToday: { ...data.completedToday, [gameId]: today },
  };
}
