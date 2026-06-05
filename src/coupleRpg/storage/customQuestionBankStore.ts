import { makeId } from '../lib/id';
import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';

export const CUSTOM_QUESTION_CATEGORIES = ['互動', '挑戰', '甜蜜', '約會', '真心話'] as const;

export type CustomQuestionCategory = (typeof CUSTOM_QUESTION_CATEGORIES)[number];

export type CustomQuestion = {
  id: string;
  text: string;
  category: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomQuestionBankData = {
  version: 1;
  questions: CustomQuestion[];
};

const DEFAULT_SEED: ReadonlyArray<{ text: string; category: CustomQuestionCategory }> = [
  { text: '抱抱 10 秒', category: '互動' },
  { text: '說一句今天最喜歡對方的地方', category: '甜蜜' },
  { text: '幫對方按摩肩膀 3 分鐘', category: '互動' },
  { text: '一起拍一張可愛自拍', category: '甜蜜' },
  { text: '牽手散步 10 分鐘', category: '約會' },
  { text: '說一件最近感謝對方的事', category: '真心話' },
];

function defaultBankData(): CustomQuestionBankData {
  const now = new Date().toISOString();
  return {
    version: 1,
    questions: DEFAULT_SEED.map((row) => ({
      id: makeId(),
      text: row.text,
      category: row.category,
      enabled: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })),
  };
}

function normalizeCategory(raw: string): string {
  const t = raw.trim();
  return CUSTOM_QUESTION_CATEGORIES.includes(t as CustomQuestionCategory) ? t : '互動';
}

export function loadCustomQuestionBank(): CustomQuestionBankData {
  const empty: CustomQuestionBankData = { version: 1, questions: [] };
  const data = loadJson(LQ_KEYS.customQuestionBank, empty);
  if (!data.questions?.length) {
    const seeded = defaultBankData();
    saveCustomQuestionBank(seeded);
    return seeded;
  }
  return {
    version: 1,
    questions: data.questions.filter((q) => q?.id && q.text?.trim()),
  };
}

export function saveCustomQuestionBank(data: CustomQuestionBankData): void {
  saveJson(LQ_KEYS.customQuestionBank, data);
}

export function countEnabledQuestions(data: CustomQuestionBankData): number {
  return data.questions.filter((q) => q.enabled).length;
}

export function pickRandomCustomQuestion(
  data: CustomQuestionBankData,
  excludeId?: string | null
): CustomQuestion | null {
  const enabled = data.questions.filter((q) => q.enabled);
  if (enabled.length === 0) return null;
  const pool =
    excludeId && enabled.length > 1 ? enabled.filter((q) => q.id !== excludeId) : enabled;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick ?? null;
}

export function addCustomQuestion(
  data: CustomQuestionBankData,
  input: { text: string; category: string }
): CustomQuestionBankData {
  const now = new Date().toISOString();
  const question: CustomQuestion = {
    id: makeId(),
    text: input.text.trim(),
    category: normalizeCategory(input.category),
    enabled: true,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  const next = { ...data, questions: [...data.questions, question] };
  saveCustomQuestionBank(next);
  return next;
}

export function updateCustomQuestion(
  data: CustomQuestionBankData,
  id: string,
  input: { text: string; category: string }
): CustomQuestionBankData {
  const now = new Date().toISOString();
  const next = {
    ...data,
    questions: data.questions.map((q) =>
      q.id === id
        ? {
            ...q,
            text: input.text.trim(),
            category: normalizeCategory(input.category),
            updatedAt: now,
          }
        : q
    ),
  };
  saveCustomQuestionBank(next);
  return next;
}

export function deleteCustomQuestion(data: CustomQuestionBankData, id: string): CustomQuestionBankData {
  const next = { ...data, questions: data.questions.filter((q) => q.id !== id) };
  saveCustomQuestionBank(next);
  return next;
}

export function toggleCustomQuestionEnabled(
  data: CustomQuestionBankData,
  id: string
): CustomQuestionBankData {
  const next = {
    ...data,
    questions: data.questions.map((q) =>
      q.id === id ? { ...q, enabled: !q.enabled, updatedAt: new Date().toISOString() } : q
    ),
  };
  saveCustomQuestionBank(next);
  return next;
}
