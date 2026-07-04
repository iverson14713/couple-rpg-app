export type DailyMemorySourceType =
  | 'love_task'
  | 'anniversary'
  | 'ai_date'
  | 'mini_game'
  | 'housework'
  | 'dinner'
  | 'reward'
  | 'custom';

/** Shared couple daily memory (one per couple per day). */
export type CoupleDailyNote = {
  id: string;
  coupleId: string;
  createdBy: string;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  /** YYYY-MM-DD (Asia/Taipei) */
  noteDate: string;
  content: string | null;
  photoPath: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  /** Signed or cached display URL (client-only, not persisted). */
  photoUrl?: string | null;
  sourceType: DailyMemorySourceType | string | null;
  sourceId: string | null;
  sourceMeta: Record<string, unknown>;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DailyNotesCache = {
  coupleId: string;
  notes: CoupleDailyNote[];
  syncedAt: string | null;
};

export type DailyMemoryQuota = {
  yearMonth: string;
  used: number;
  limit: number;
  remaining: number;
};

export type DailyMemoryPromptMode = 'create' | 'supplement' | 'edit';

export type DailyMemoryPromptRequest = {
  noteDate: string;
  sourceType: DailyMemorySourceType;
  sourceId?: string;
  sourceMeta?: Record<string, unknown>;
  title?: string;
  body?: string;
  supplementTitle?: string;
  supplementBody?: string;
};
