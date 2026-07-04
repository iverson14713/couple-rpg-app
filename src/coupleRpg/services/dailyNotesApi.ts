import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CoupleDailyNote,
  DailyMemoryQuota,
  DailyMemorySourceType,
} from '../storage/dailyNotesTypes';

const TABLE = 'couple_daily_memories';
const BUCKET = 'couple-daily-memories';
const LIST_LIMIT = 400;

type DailyMemoryRow = {
  id: string;
  couple_id: string;
  memory_date: string;
  content: string | null;
  photo_path: string | null;
  photo_width: number | null;
  photo_height: number | null;
  created_by: string;
  last_edited_by: string | null;
  last_edited_at: string | null;
  source_type: string | null;
  source_id: string | null;
  source_meta: Record<string, unknown> | null;
  is_favorite: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToNote(row: DailyMemoryRow): CoupleDailyNote {
  return {
    id: row.id,
    coupleId: row.couple_id,
    createdBy: row.created_by,
    lastEditedBy: row.last_edited_by,
    lastEditedAt: row.last_edited_at,
    noteDate: row.memory_date,
    content: row.content,
    photoPath: row.photo_path,
    photoWidth: row.photo_width,
    photoHeight: row.photo_height,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceMeta: row.source_meta ?? {},
    isFavorite: row.is_favorite ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCoupleDailyNotes(
  supabase: SupabaseClient,
  coupleId: string
): Promise<CoupleDailyNote[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, couple_id, memory_date, content, photo_path, photo_width, photo_height, created_by, last_edited_by, last_edited_at, source_type, source_id, source_meta, is_favorite, deleted_at, created_at, updated_at'
    )
    .eq('couple_id', coupleId)
    .is('deleted_at', null)
    .order('memory_date', { ascending: false })
    .limit(LIST_LIMIT);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToNote(row as DailyMemoryRow));
}

export async function fetchDailyMemoryQuota(
  supabase: SupabaseClient,
  coupleId: string,
  yearMonth: string,
  isPro: boolean
): Promise<DailyMemoryQuota> {
  const { data, error } = await supabase.rpc('get_couple_daily_memory_quota', {
    p_couple_id: coupleId,
    p_year_month: yearMonth,
    p_is_pro: isPro,
  });
  if (error) throw new Error(error.message);
  const q = data as { yearMonth: string; used: number; limit: number; remaining: number };
  return {
    yearMonth: q.yearMonth,
    used: q.used,
    limit: q.limit,
    remaining: q.remaining,
  };
}

export type UpsertDailyMemoryInput = {
  coupleId: string;
  memoryDate: string;
  content: string | null;
  photoPath?: string | null;
  photoWidth?: number | null;
  photoHeight?: number | null;
  clearPhoto?: boolean;
  sourceType?: DailyMemorySourceType | string | null;
  sourceId?: string | null;
  sourceMeta?: Record<string, unknown>;
  isPro: boolean;
};

export async function upsertCoupleDailyMemory(
  supabase: SupabaseClient,
  input: UpsertDailyMemoryInput
): Promise<CoupleDailyNote> {
  const { data, error } = await supabase.rpc('upsert_couple_daily_memory', {
    p_couple_id: input.coupleId,
    p_memory_date: input.memoryDate,
    p_content: input.content,
    p_photo_path: input.photoPath ?? null,
    p_photo_width: input.photoWidth ?? null,
    p_photo_height: input.photoHeight ?? null,
    p_source_type: input.sourceType ?? null,
    p_source_id: input.sourceId ?? null,
    p_source_meta: input.sourceMeta ?? {},
    p_is_pro: input.isPro,
    p_clear_photo: input.clearPhoto === true,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('quota_exceeded')) throw new Error('quota_exceeded');
    if (msg.includes('empty_content')) throw new Error('empty_content');
    throw new Error(msg || 'upsert_failed');
  }
  return rowToNote(data as DailyMemoryRow);
}

export function memoryPhotoStoragePath(
  coupleId: string,
  memoryDate: string,
  ext: 'jpg' | 'webp'
): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${coupleId}/${memoryDate}/${id}.${ext}`;
}

export async function uploadDailyMemoryPhoto(
  supabase: SupabaseClient,
  path: string,
  blob: Blob
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type || 'image/jpeg',
  });
  if (error) throw new Error(error.message);
}

export async function signDailyMemoryPhotoUrl(
  supabase: SupabaseClient,
  photoPath: string | null | undefined
): Promise<string | null> {
  if (!photoPath) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(photoPath, 3600);
  if (error) {
    console.warn('[daily-memory photo url]', error.message);
    return null;
  }
  return data.signedUrl;
}

export async function attachSignedPhotoUrls(
  supabase: SupabaseClient,
  notes: CoupleDailyNote[]
): Promise<CoupleDailyNote[]> {
  return Promise.all(
    notes.map(async (note) => {
      if (!note.photoPath) return { ...note, photoUrl: null };
      const photoUrl = await signDailyMemoryPhotoUrl(supabase, note.photoPath);
      return { ...note, photoUrl };
    })
  );
}
