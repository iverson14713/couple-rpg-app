/**
 * Sync dinner options & today's dinner decision with public.food_options / public.food_decisions.
 */
import {
  ENABLE_DINNER_DECISION_CLOUD_SYNC,
  ENABLE_DINNER_OPTIONS_CLOUD_SYNC,
} from '../constants/dinnerSyncFlags';
import type { SupabaseClient } from '@supabase/supabase-js';
import { todayKey } from '../lib/dates';
import { foodEmojiForLabel } from '../lib/dinnerFoodEmoji';
import { ensureDinnerStableIds } from '../storage/dinnerSyncMeta';
import { getActiveDinnerOptions, loadDinner, saveDinner } from '../storage/dinnerStore';
import type { DinnerData, DinnerHistoryEntry, DinnerOption } from '../storage/types';
import { canUseUserStorage } from '../storage/storageGuard';

const LOG = '[dinner-sync]';

export type DinnerSyncStatus = 'local' | 'editing' | 'syncing' | 'synced' | 'error';

const FOOD_OPTIONS_COLS =
  'id, couple_id, local_id, client_id, name, label, emoji, is_active, sort_order, created_by, created_at, updated_at';

const FOOD_DECISIONS_COLS =
  'id, couple_id, local_id, client_id, date_key, decision_date, selected_food_name, label, selected_food_local_id, decided_at, saved_at, decided_by, created_by, note, created_at, updated_at';

export type FoodOptionRow = {
  id: string;
  couple_id: string;
  local_id: string | null;
  client_id?: string | null;
  name: string | null;
  label?: string | null;
  emoji: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FoodDecisionRow = {
  id: string;
  couple_id: string;
  local_id: string | null;
  client_id?: string | null;
  date_key: string | null;
  decision_date?: string | null;
  selected_food_name: string | null;
  label?: string | null;
  selected_food_local_id: string | null;
  decided_at: string | null;
  saved_at?: string | null;
  decided_by: string | null;
  created_by?: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export function canSyncDinner(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  return canSyncDinnerOptions(input);
}

export function canSyncDinnerOptions(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_DINNER_OPTIONS_CLOUD_SYNC) return false;
  return Boolean(
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

export function canSyncDinnerDecision(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_DINNER_DECISION_CLOUD_SYNC) return false;
  return Boolean(
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

function rowLocalId(row: { local_id?: string | null; client_id?: string | null; id?: string }): string {
  return String(row.local_id ?? row.client_id ?? '').trim();
}

function rowName(row: { name?: string | null; label?: string | null }): string {
  return String(row.name ?? row.label ?? '').trim();
}

function rowDateKey(row: { date_key?: string | null; decision_date?: string | null }): string {
  const dk = row.date_key?.trim();
  if (dk) return dk;
  const d = row.decision_date;
  if (!d) return '';
  return String(d).slice(0, 10);
}

function parseTs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function optionToRowPayload(
  option: DinnerOption,
  coupleId: string,
  sortOrder: number,
  createdBy: string | null
) {
  const name = option.label.trim();
  return {
    couple_id: coupleId,
    local_id: option.id,
    client_id: option.id,
    name,
    label: name,
    emoji: option.emoji ?? foodEmojiForLabel(name),
    is_active: option.isActive !== false,
    sort_order: sortOrder,
    created_by: createdBy,
  };
}

export function rowToDinnerOption(row: FoodOptionRow): DinnerOption | null {
  const localId = rowLocalId(row);
  const label = rowName(row);
  if (!localId || !label) return null;
  return {
    id: localId,
    remoteId: row.id,
    label,
    emoji: row.emoji ?? undefined,
    isActive: row.is_active !== false,
    updatedAt: row.updated_at,
    localVersion: 0,
  };
}

export function rowToDinnerHistoryEntry(row: FoodDecisionRow): DinnerHistoryEntry | null {
  const dateKey = rowDateKey(row);
  const label = String(row.selected_food_name ?? row.label ?? '').trim();
  if (!dateKey || !label) return null;
  const decidedAt = row.decided_at ?? row.saved_at ?? row.updated_at ?? row.created_at;
  return {
    id: rowLocalId(row) || row.id,
    remoteId: row.id,
    date: dateKey,
    label,
    savedAt: decidedAt,
    selectedFoodLocalId: row.selected_food_local_id,
    decidedBy: row.decided_by ?? row.created_by ?? null,
    updatedAt: row.updated_at,
    localVersion: 0,
  };
}

export function mergeFoodOptions(local: DinnerOption[], remoteRows: FoodOptionRow[]): DinnerOption[] {
  const remoteItems = remoteRows.map(rowToDinnerOption).filter((o): o is DinnerOption => o != null);
  const byId = new Map<string, DinnerOption>();

  for (const r of remoteItems) {
    byId.set(r.id, r);
  }

  for (const lo of local) {
    const existing = byId.get(lo.id);
    if (existing) {
      const preferLocal = parseTs(lo.updatedAt) >= parseTs(existing.updatedAt);
      const primary = preferLocal ? lo : existing;
      const secondary = preferLocal ? existing : lo;
      const mergedActive =
        lo.isActive === false || existing.isActive === false
          ? false
          : lo.isActive !== false && existing.isActive !== false;
      byId.set(lo.id, {
        ...primary,
        label: primary.label?.trim() || secondary.label?.trim() || '',
        emoji: primary.emoji ?? secondary.emoji,
        remoteId: existing.remoteId ?? lo.remoteId ?? null,
        isActive: mergedActive,
        localVersion: Math.max(lo.localVersion ?? 0, existing.localVersion ?? 0),
        updatedAt: preferLocal ? lo.updatedAt : existing.updatedAt,
      });
    } else {
      byId.set(lo.id, { ...lo, remoteId: lo.remoteId ?? null });
    }
  }

  const labels = new Set<string>();
  const out: DinnerOption[] = [];
  for (const item of byId.values()) {
    if (item.isActive === false) continue;
    const key = item.label.trim().toLowerCase();
    if (!key || labels.has(key)) continue;
    labels.add(key);
    out.push(item);
  }
  return out;
}

export function mergeFoodDecision(
  local: DinnerHistoryEntry | null,
  remote: DinnerHistoryEntry | null
): DinnerHistoryEntry | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const localTs = Math.max(parseTs(local.updatedAt), parseTs(local.savedAt));
  const remoteTs = Math.max(parseTs(remote.updatedAt), parseTs(remote.savedAt));
  const preferLocal = localTs >= remoteTs;
  const primary = preferLocal ? local : remote;
  const secondary = preferLocal ? remote : local;

  return {
    ...primary,
    id: primary.id || secondary.id,
    label: primary.label?.trim() || secondary.label?.trim() || '',
    savedAt: preferLocal ? local.savedAt : remote.savedAt,
    selectedFoodLocalId: primary.selectedFoodLocalId ?? secondary.selectedFoodLocalId ?? null,
    decidedBy: primary.decidedBy ?? secondary.decidedBy ?? null,
    remoteId: remote.remoteId ?? local.remoteId ?? null,
    updatedAt: preferLocal ? local.updatedAt : remote.updatedAt,
    localVersion: Math.max(local.localVersion ?? 0, remote.localVersion ?? 0),
  };
}

export async function getRemoteFoodOptions(
  supabase: SupabaseClient,
  coupleId: string
): Promise<FoodOptionRow[]> {
  const { data, error } = await supabase
    .from('food_options')
    .select(FOOD_OPTIONS_COLS)
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn(`${LOG} getRemoteFoodOptions failed:`, error.message);
    throw error;
  }
  return (data ?? []) as FoodOptionRow[];
}

export async function getRemoteTodayFoodDecision(
  supabase: SupabaseClient,
  coupleId: string,
  dateKey: string = todayKey()
): Promise<FoodDecisionRow | null> {
  const { data, error } = await supabase
    .from('food_decisions')
    .select(FOOD_DECISIONS_COLS)
    .eq('couple_id', coupleId)
    .eq('date_key', dateKey)
    .maybeSingle();

  if (error) {
    console.warn(`${LOG} getRemoteTodayFoodDecision failed:`, error.message);
    throw error;
  }
  return (data as FoodDecisionRow | null) ?? null;
}

export async function pullFoodOptionsFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData
): Promise<DinnerData> {
  const rows = await getRemoteFoodOptions(supabase, coupleId);
  const merged = mergeFoodOptions(data.options, rows);
  return { ...data, options: merged };
}

export async function pullTodayFoodDecisionFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData,
  dateKey: string = todayKey()
): Promise<DinnerData> {
  if (!ENABLE_DINNER_DECISION_CLOUD_SYNC) return data;
  const row = await getRemoteTodayFoodDecision(supabase, coupleId, dateKey);
  const remoteEntry = row ? rowToDinnerHistoryEntry(row) : null;
  const localEntry = data.history.find((h) => h.date === dateKey) ?? null;
  const merged = mergeFoodDecision(localEntry, remoteEntry);

  const without = data.history.filter((h) => h.date !== dateKey);
  const history = merged
    ? [merged, ...without].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
    : without;

  return { ...data, history };
}

export async function pushFoodOptionsToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData,
  createdBy: string | null
): Promise<void> {
  const stable = ensureDinnerStableIds(data);
  const allOptions = stable.options;
  const payloads = allOptions.map((opt, i) => optionToRowPayload(opt, coupleId, i, createdBy));

  if (payloads.length === 0) return;

  const { error } = await supabase.from('food_options').upsert(payloads, {
    onConflict: 'couple_id,local_id',
  });

  if (error) {
    console.warn(`${LOG} pushFoodOptions failed:`, error.message);
    throw error;
  }
}

function historyEntryToDecisionPayload(
  entry: DinnerHistoryEntry,
  coupleId: string,
  dateKey: string
) {
  const name = entry.label.trim();
  const decidedAt = entry.savedAt ?? new Date().toISOString();
  return {
    couple_id: coupleId,
    local_id: entry.id,
    client_id: entry.id,
    date_key: dateKey,
    decision_date: dateKey,
    selected_food_name: name,
    label: name,
    selected_food_local_id: entry.selectedFoodLocalId ?? null,
    decided_at: decidedAt,
    saved_at: decidedAt,
    decided_by: entry.decidedBy ?? null,
    created_by: entry.decidedBy ?? null,
  };
}

export async function pushTodayFoodDecisionToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData,
  dateKey: string = todayKey()
): Promise<void> {
  if (!ENABLE_DINNER_DECISION_CLOUD_SYNC) return;
  const entry = data.history.find((h) => h.date === dateKey);
  if (!entry?.label?.trim()) return;

  const payload = historyEntryToDecisionPayload(entry, coupleId, dateKey);
  const { error } = await supabase.from('food_decisions').upsert(payload, {
    onConflict: 'couple_id,date_key',
  });

  if (error) {
    console.warn(`${LOG} pushTodayFoodDecision failed:`, error.message);
    throw error;
  }
}

export async function syncFoodOptions(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData,
  userId: string | null
): Promise<DinnerData> {
  let cur = ensureDinnerStableIds(data);
  await pushFoodOptionsToRemote(supabase, coupleId, cur, userId);
  cur = await pullFoodOptionsFromRemote(supabase, coupleId, cur);
  return cur;
}

export async function syncTodayFoodDecision(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData,
  dateKey: string = todayKey()
): Promise<DinnerData> {
  if (!ENABLE_DINNER_DECISION_CLOUD_SYNC) return data;
  let cur = ensureDinnerStableIds(data);
  await pushTodayFoodDecisionToRemote(supabase, coupleId, cur, dateKey);
  cur = await pullTodayFoodDecisionFromRemote(supabase, coupleId, cur, dateKey);
  return cur;
}

/** Push + pull food_options only; preserves local history when decision sync is off. */
export async function syncFoodOptionsOnly(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null
): Promise<DinnerData> {
  let data = ensureDinnerStableIds(loadDinner());
  const localHistory = data.history;
  data = await syncFoodOptions(supabase, coupleId, data, userId);
  if (!ENABLE_DINNER_DECISION_CLOUD_SYNC) {
    data = { ...data, history: localHistory };
  }
  saveDinner(data);
  return data;
}

export async function syncDinner(
  supabase: SupabaseClient,
  coupleId: string,
  userId: string | null
): Promise<DinnerData> {
  let data = await syncFoodOptionsOnly(supabase, coupleId, userId);
  if (ENABLE_DINNER_DECISION_CLOUD_SYNC) {
    data = await syncTodayFoodDecision(supabase, coupleId, data);
    saveDinner(data);
  }
  return data;
}

/** @deprecated Use dinnerSyncService — kept for import compatibility during transition */
export { canSyncDinner as canSyncFoodOptions };
