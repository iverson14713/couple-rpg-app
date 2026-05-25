/**
 * Sync housework items & today's assignments with public.chores / public.chore_records.
 */
import {
  ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC,
  ENABLE_CHORE_ITEMS_CLOUD_SYNC,
} from '../constants/choreSyncFlags';
import type { SupabaseClient } from '@supabase/supabase-js';
import { todayKey } from '../lib/dates';
import { DEFAULT_HOUSEWORK_ITEMS } from '../storage/houseworkStore';
import type {
  HouseworkAssignedChore,
  HouseworkData,
  HouseworkItem,
  HouseworkTodayAssignment,
  PartnerId,
} from '../storage/types';
import { loadHousework, saveHousework } from '../storage/houseworkStore';
import { canUseUserStorage } from '../storage/storageGuard';

const LOG = '[chore-sync]';
const META_LOCAL_PREFIX = 'lq-hw-meta-';

const DEFAULT_HW_IDS = new Set(DEFAULT_HOUSEWORK_ITEMS.map((i) => i.id));

export type ChoreSyncStatus = 'local' | 'editing' | 'syncing' | 'synced' | 'error';

export type ChoreRow = {
  id: string;
  couple_id: string;
  local_id: string | null;
  client_id?: string | null;
  title: string | null;
  label?: string | null;
  icon: string | null;
  emoji?: string | null;
  difficulty: number | null;
  is_default: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChoreRecordRow = {
  id: string;
  couple_id: string;
  local_id: string | null;
  client_id?: string | null;
  chore_id: string | null;
  chore_local_id: string | null;
  title: string | null;
  task_label?: string | null;
  emoji: string | null;
  assigned_to: string | null;
  assigned_role: string | null;
  partner_slot?: string | null;
  assigned_name: string | null;
  date_key: string | null;
  status: 'pending' | 'completed' | 'skipped';
  completed_by: string | null;
  completed_at: string | null;
  rewarded: boolean | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignmentMeta = {
  selectedTaskIds: string[];
  assignedAt: string | null;
  lastExtraAssignee: PartnerId | null;
};

const CHORES_COLS =
  'id, couple_id, local_id, client_id, title, label, icon, emoji, difficulty, is_default, is_active, sort_order, created_by, created_at, updated_at';

const RECORD_COLS =
  'id, couple_id, local_id, client_id, chore_id, chore_local_id, title, task_label, emoji, assigned_to, assigned_role, partner_slot, assigned_name, date_key, status, completed_by, completed_at, rewarded, note, created_by, created_at, updated_at';

export function canSyncChores(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  return canSyncChoreItems(input);
}

export function canSyncChoreItems(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_CHORE_ITEMS_CLOUD_SYNC) return false;
  return Boolean(
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

export function canSyncChoreAssignment(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  if (!ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC) return false;
  return Boolean(
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

/** 合併遠端資料時保留本機今日分配（分配同步關閉時） */
export function preserveLocalHouseworkAssignment(
  incoming: HouseworkData,
  local: HouseworkData
): HouseworkData {
  if (ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC) return incoming;
  return {
    ...incoming,
    todayAssignment: local.todayAssignment,
    completions: local.completions,
    lastExtraAssignee: local.lastExtraAssignee,
    pendingSpin: local.pendingSpin,
  };
}

function rowLocalId(row: { local_id?: string | null; client_id?: string | null }): string {
  return String(row.local_id ?? row.client_id ?? '').trim();
}

function rowTitle(row: { title?: string | null; label?: string | null; task_label?: string | null }): string {
  return String(row.title ?? row.label ?? row.task_label ?? '').trim();
}

function rowIcon(row: { icon?: string | null; emoji?: string | null }): string {
  return String(row.icon ?? row.emoji ?? '🏠').trim() || '🏠';
}

function parseTs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function metaLocalId(dateKey: string): string {
  return `${META_LOCAL_PREFIX}${dateKey}`;
}

export function choreRecordLocalId(dateKey: string, taskId: string): string {
  return `${dateKey}::${taskId}`;
}

export function isMetaChoreRecordLocalId(localId: string): boolean {
  return localId.startsWith(META_LOCAL_PREFIX);
}

function parseMetaNote(note: string | null | undefined): AssignmentMeta | null {
  if (!note?.trim()) return null;
  try {
    const raw = JSON.parse(note) as AssignmentMeta;
    if (!raw || typeof raw !== 'object') return null;
    return {
      selectedTaskIds: Array.isArray(raw.selectedTaskIds) ? raw.selectedTaskIds.map(String) : [],
      assignedAt: raw.assignedAt != null ? String(raw.assignedAt) : null,
      lastExtraAssignee:
        raw.lastExtraAssignee === 'A' || raw.lastExtraAssignee === 'B' ? raw.lastExtraAssignee : null,
    };
  } catch {
    return null;
  }
}

function metaNote(meta: AssignmentMeta): string {
  return JSON.stringify(meta);
}

export function rowToHouseworkItem(row: ChoreRow): HouseworkItem | null {
  const localId = rowLocalId(row);
  const title = rowTitle(row);
  if (!localId || !title) return null;
  return {
    id: localId,
    remoteId: row.id,
    label: title,
    emoji: rowIcon(row),
    isActive: row.is_active !== false,
    syncPending: false,
    updatedAt: row.updated_at,
    localVersion: 0,
  };
}

export function houseworkItemToChorePayload(
  item: HouseworkItem,
  coupleId: string,
  sortOrder: number,
  createdBy: string | null
) {
  return {
    couple_id: coupleId,
    local_id: item.id,
    client_id: item.id,
    title: item.label,
    label: item.label,
    icon: item.emoji,
    emoji: item.emoji,
    difficulty: 1,
    is_default: DEFAULT_HW_IDS.has(item.id),
    is_active: item.isActive !== false,
    sort_order: sortOrder,
    created_by: createdBy,
  };
}

/** @alias mergeRemoteChores */
export function mergeChores(local: HouseworkItem[], remoteRows: ChoreRow[]): HouseworkItem[] {
  return mergeRemoteChores(local, remoteRows);
}

export function mergeRemoteChores(local: HouseworkItem[], remoteRows: ChoreRow[]): HouseworkItem[] {
  const remoteItems = remoteRows.map(rowToHouseworkItem).filter((i): i is HouseworkItem => i != null);
  const byId = new Map<string, HouseworkItem>();

  for (const r of remoteItems) {
    if (r.isActive === false) continue;
    byId.set(r.id, r);
  }

  for (const lo of local) {
    if (lo.isActive === false) continue;
    const existing = byId.get(lo.id);
    if (existing) {
      const preferLocal = parseTs(lo.updatedAt) >= parseTs(existing.updatedAt);
      const primary = preferLocal ? lo : existing;
      const secondary = preferLocal ? existing : lo;
      byId.set(lo.id, {
        ...primary,
        label: primary.label || secondary.label,
        emoji: primary.emoji || secondary.emoji,
        remoteId: existing.remoteId ?? lo.remoteId ?? null,
        isActive: lo.isActive !== false && existing.isActive !== false,
        localVersion: Math.max(lo.localVersion ?? 0, existing.localVersion ?? 0),
        updatedAt: preferLocal ? lo.updatedAt : existing.updatedAt,
      });
    } else {
      byId.set(lo.id, { ...lo, syncPending: !lo.remoteId });
    }
  }

  const labels = new Set<string>();
  const out: HouseworkItem[] = [];
  for (const item of byId.values()) {
    const key = item.label.trim().toLowerCase();
    if (labels.has(key)) continue;
    labels.add(key);
    out.push(item);
  }
  return out;
}

const RECORD_STATUS_RANK: Record<string, number> = {
  pending: 0,
  skipped: 1,
  completed: 2,
};

function mergeTwoAssignedChores(
  local: HouseworkAssignedChore | undefined,
  remote: HouseworkAssignedChore,
  remoteUpdatedAt: string,
  options?: { preferLocal?: boolean }
): HouseworkAssignedChore {
  if (!local) return remote;

  const localRank = local.completed ? 2 : 0;
  const remoteRank = remote.completed ? 2 : 0;
  const localTs = Math.max(parseTs(local.updatedAt), parseTs(local.completedAt));
  const remoteTs = Math.max(parseTs(remoteUpdatedAt), parseTs(remote.completedAt));
  const localVer = local.localVersion ?? 0;
  const remoteVer = remote.localVersion ?? 0;

  let preferRemote = false;
  if (options?.preferLocal) {
    if (localRank > remoteRank) preferRemote = false;
    else if (remoteRank > localRank) preferRemote = true;
    else if (localTs > remoteTs) preferRemote = false;
    else if (remoteTs > localTs) preferRemote = true;
    else if (localVer >= remoteVer) preferRemote = false;
    else preferRemote = true;
  } else if (remoteRank > localRank) preferRemote = true;
  else if (localRank > remoteRank) preferRemote = false;
  else if (remoteTs > localTs) preferRemote = true;
  else if (localTs > remoteTs) preferRemote = false;
  else if (remoteVer > localVer) preferRemote = true;

  const primary = preferRemote ? remote : local;
  const secondary = preferRemote ? local : remote;

  const completed = local.completed || remote.completed;
  const rewarded = local.rewarded || remote.rewarded;

  return {
    taskId: primary.taskId,
    assignee: primary.assignee,
    completed,
    rewarded,
    remoteId: remote.remoteId ?? local.remoteId ?? null,
    completedAt: completed
      ? primary.completedAt ?? secondary.completedAt ?? null
      : null,
    completedBy: primary.completedBy ?? secondary.completedBy ?? null,
    updatedAt:
      localTs >= remoteTs ? local.updatedAt ?? local.completedAt : remote.updatedAt ?? remote.completedAt,
    localVersion: Math.max(localVer, remoteVer),
  };
}

function recordToAssignedChore(row: ChoreRecordRow): HouseworkAssignedChore | null {
  const localId = rowLocalId(row);
  if (!localId || isMetaChoreRecordLocalId(localId)) return null;

  const taskId = String(row.chore_local_id ?? '').trim() || localId.split('::').pop() || '';
  if (!taskId) return null;

  const role = (row.assigned_role ?? row.partner_slot ?? 'A') as PartnerId;
  const assignee: PartnerId = role === 'B' ? 'B' : 'A';
  const completed = row.status === 'completed';

  return {
    taskId,
    assignee,
    completed,
    rewarded: Boolean(row.rewarded),
    remoteId: row.id,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    updatedAt: row.updated_at,
    localVersion: 0,
  };
}

export function mergeChoreRecords(
  localAssignment: HouseworkTodayAssignment | null,
  remoteRows: ChoreRecordRow[],
  dateKey: string,
  options?: { preferLocal?: boolean }
): { assignment: HouseworkTodayAssignment | null; meta: AssignmentMeta | null } {
  const todayRows = remoteRows.filter((r) => {
    const dk = r.date_key?.trim();
    return dk === dateKey;
  });

  let meta: AssignmentMeta | null = null;
  const remoteChores = new Map<string, { chore: HouseworkAssignedChore; updatedAt: string }>();

  for (const row of todayRows) {
    const localId = rowLocalId(row);
    if (isMetaChoreRecordLocalId(localId)) {
      meta = parseMetaNote(row.note);
      continue;
    }
    const chore = recordToAssignedChore(row);
    if (!chore) continue;
    remoteChores.set(chore.taskId, { chore, updatedAt: row.updated_at });
  }

  const local = localAssignment?.date === dateKey ? localAssignment : null;
  const selectedTaskIds =
    local?.selectedTaskIds?.length
      ? local.selectedTaskIds
      : meta?.selectedTaskIds?.length
        ? meta.selectedTaskIds
        : [...remoteChores.keys()];

  const assignedAt = local?.assignedAt ?? meta?.assignedAt ?? null;
  const choreIds = new Set<string>([
    ...selectedTaskIds,
    ...(local?.chores.map((c) => c.taskId) ?? []),
    ...remoteChores.keys(),
  ]);

  const chores: HouseworkAssignedChore[] = [];
  for (const taskId of choreIds) {
    const loc = local?.chores.find((c) => c.taskId === taskId);
    const rem = remoteChores.get(taskId);
    if (loc && rem) {
      chores.push(mergeTwoAssignedChores(loc, rem.chore, rem.updatedAt, options));
    } else if (rem) {
      chores.push(rem.chore);
    } else if (loc) {
      chores.push(loc);
    }
  }

  if (!assignedAt && chores.length === 0 && selectedTaskIds.length === 0) {
    return { assignment: local, meta };
  }

  return {
    assignment: {
      date: dateKey,
      selectedTaskIds,
      assignedAt,
      chores: assignedAt ? chores.filter((c) => selectedTaskIds.includes(c.taskId) || remoteChores.has(c.taskId)) : [],
    },
    meta,
  };
}

export async function getRemoteChores(
  supabase: SupabaseClient,
  coupleId: string
): Promise<ChoreRow[]> {
  const { data, error } = await supabase
    .from('chores')
    .select(CHORES_COLS)
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(`${LOG} getRemoteChores failed:`, error.message);
    throw error;
  }
  return (data ?? []) as ChoreRow[];
}

export async function getRemoteChoreRecords(
  supabase: SupabaseClient,
  coupleId: string,
  dateKey: string
): Promise<ChoreRecordRow[]> {
  const { data, error } = await supabase
    .from('chore_records')
    .select(RECORD_COLS)
    .eq('couple_id', coupleId)
    .eq('date_key', dateKey);

  if (error) {
    console.error(`${LOG} getRemoteChoreRecords failed:`, error.message);
    throw error;
  }
  return (data ?? []) as ChoreRecordRow[];
}

export async function pullChoresFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  current: HouseworkData
): Promise<HouseworkData> {
  const rows = await getRemoteChores(supabase, coupleId);
  const items = mergeRemoteChores(current.items, rows);
  return { ...current, items };
}

export async function pullTodayChoreRecordsFromRemote(
  supabase: SupabaseClient,
  coupleId: string,
  current: HouseworkData,
  dateKey: string = todayKey(),
  options?: { preferLocal?: boolean }
): Promise<HouseworkData> {
  if (!ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC) return current;
  const rows = await getRemoteChoreRecords(supabase, coupleId, dateKey);
  const { assignment, meta } = mergeChoreRecords(current.todayAssignment, rows, dateKey, options);
  return {
    ...current,
    todayAssignment: assignment,
    lastExtraAssignee: meta?.lastExtraAssignee ?? current.lastExtraAssignee,
  };
}

function mergeTwoHouseworkItems(local: HouseworkItem, incoming: HouseworkItem, preferLocal: boolean): HouseworkItem {
  const preferLo = preferLocal && parseTs(local.updatedAt) >= parseTs(incoming.updatedAt);
  const primary = preferLo ? local : incoming;
  const secondary = preferLo ? incoming : local;
  const mergedActive =
    local.isActive === false || incoming.isActive === false
      ? false
      : local.isActive !== false && incoming.isActive !== false;
  return {
    ...primary,
    label: primary.label || secondary.label,
    emoji: primary.emoji || secondary.emoji,
    remoteId: incoming.remoteId ?? local.remoteId ?? null,
    isActive: mergedActive,
    syncPending: false,
    localVersion: Math.max(local.localVersion ?? 0, incoming.localVersion ?? 0),
    updatedAt: preferLo ? local.updatedAt : incoming.updatedAt,
  };
}

function mergeHouseworkItems(
  current: HouseworkItem[],
  incoming: HouseworkItem[],
  preferLocal: boolean
): HouseworkItem[] {
  const byId = new Map<string, HouseworkItem>();
  for (const item of incoming) {
    if (item.isActive === false) continue;
    byId.set(item.id, item);
  }
  for (const lo of current) {
    if (lo.isActive === false) continue;
    const ex = byId.get(lo.id);
    if (ex) {
      byId.set(lo.id, mergeTwoHouseworkItems(lo, ex, preferLocal));
    } else {
      byId.set(lo.id, lo);
    }
  }
  const labels = new Set<string>();
  const out: HouseworkItem[] = [];
  for (const item of byId.values()) {
    const key = item.label.trim().toLowerCase();
    if (!key || labels.has(key)) continue;
    labels.add(key);
    out.push(item);
  }
  return out;
}

function mergeTodayAssignmentPreferLocal(
  local: HouseworkTodayAssignment,
  incoming: HouseworkTodayAssignment
): HouseworkTodayAssignment {
  const selectedTaskIds = local.selectedTaskIds.length
    ? local.selectedTaskIds
    : incoming.selectedTaskIds;
  const assignedAt = local.assignedAt ?? incoming.assignedAt;
  const choreIds = new Set([
    ...local.chores.map((c) => c.taskId),
    ...incoming.chores.map((c) => c.taskId),
  ]);
  const chores: HouseworkAssignedChore[] = [];
  for (const taskId of choreIds) {
    const loc = local.chores.find((c) => c.taskId === taskId);
    const inc = incoming.chores.find((c) => c.taskId === taskId);
    if (loc && inc) {
      chores.push(mergeTwoAssignedChores(loc, inc, inc.updatedAt ?? '', { preferLocal: true }));
    } else if (loc) {
      chores.push(loc);
    } else if (inc) {
      chores.push(inc);
    }
  }
  return {
    date: local.date,
    selectedTaskIds,
    assignedAt,
    chores: assignedAt
      ? chores.filter((c) => selectedTaskIds.includes(c.taskId) || local.chores.some((x) => x.taskId === c.taskId))
      : [],
    updatedAt: local.updatedAt ?? incoming.updatedAt,
  };
}

/** Merge remote pull result into current UI state without clobbering optimistic edits. */
export function mergeHouseworkDataSafe(
  current: HouseworkData,
  incoming: HouseworkData,
  options?: { preferLocal?: boolean }
): HouseworkData {
  const preferLocal = options?.preferLocal ?? false;
  const dateKey = todayKey();
  const items = mergeHouseworkItems(current.items, incoming.items, preferLocal);

  let todayAssignment = current.todayAssignment;
  const incTa = incoming.todayAssignment;
  if (incTa?.date === dateKey) {
    if (preferLocal && current.todayAssignment?.date === dateKey && current.todayAssignment.assignedAt) {
      todayAssignment = mergeTodayAssignmentPreferLocal(current.todayAssignment, incTa);
    } else if (incTa.assignedAt || incTa.chores.length > 0) {
      todayAssignment = incTa;
    }
  }

  const completions =
    preferLocal && current.completions.length >= incoming.completions.length
      ? current.completions
      : incoming.completions.length > current.completions.length
        ? incoming.completions
        : current.completions;

  return {
    ...current,
    items,
    todayAssignment,
    completions,
    lastExtraAssignee: preferLocal
      ? current.lastExtraAssignee
      : incoming.lastExtraAssignee ?? current.lastExtraAssignee,
    pendingSpin: current.pendingSpin,
    updatedAt: preferLocal ? current.updatedAt : incoming.updatedAt ?? current.updatedAt,
    syncRevision: Math.max(current.syncRevision ?? 0, incoming.syncRevision ?? 0),
  };
}

/** Apply only remote ids from a push result — keeps assignment/completion UI stable. */
export function mergeHouseworkRemoteIdsOnly(current: HouseworkData, pushed: HouseworkData): HouseworkData {
  const items = current.items.map((item) => {
    const p = pushed.items.find((x) => x.id === item.id);
    if (!p) return item;
    return { ...item, remoteId: p.remoteId ?? item.remoteId ?? null, syncPending: false };
  });

  const curTa = current.todayAssignment;
  const pushedTa = pushed.todayAssignment;
  if (!curTa || !pushedTa || curTa.date !== pushedTa.date) {
    return { ...current, items };
  }

  const chores = curTa.chores.map((c) => {
    const p = pushedTa.chores.find((x) => x.taskId === c.taskId);
    return p ? { ...c, remoteId: p.remoteId ?? c.remoteId ?? null } : c;
  });

  return {
    ...current,
    items,
    todayAssignment: { ...curTa, chores },
  };
}

async function upsertChore(
  supabase: SupabaseClient,
  coupleId: string,
  item: HouseworkItem,
  sortOrder: number,
  createdBy: string | null
): Promise<string | null> {
  const payload = {
    ...houseworkItemToChorePayload(item, coupleId, sortOrder, createdBy),
    updated_at: item.updatedAt ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('chores')
    .upsert(payload, { onConflict: 'couple_id,local_id' })
    .select('id')
    .single();

  if (error) {
    console.warn(`${LOG} chore upsert failed, fallback select/update:`, error.message);
    const { data: existing, error: selErr } = await supabase
      .from('chores')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('local_id', item.id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) {
      const { error: upErr } = await supabase.from('chores').update(payload).eq('id', existing.id);
      if (upErr) throw upErr;
      return existing.id as string;
    }
    const { data: ins, error: insErr } = await supabase.from('chores').insert(payload).select('id').single();
    if (insErr) throw insErr;
    return (ins as { id: string } | null)?.id ?? null;
  }

  return (data as { id: string } | null)?.id ?? null;
}

export async function pushChoresToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: HouseworkData,
  createdBy: string | null
): Promise<HouseworkData> {
  let items = data.items;
  let i = 0;
  for (const item of data.items) {
    if (item.isActive === false) {
      const { error } = await supabase
        .from('chores')
        .update({ is_active: false })
        .eq('couple_id', coupleId)
        .eq('local_id', item.id);
      if (error) console.warn(`${LOG} deactivate chore failed:`, error.message);
      continue;
    }
    const remoteId = await upsertChore(supabase, coupleId, item, i, createdBy);
    items = items.map((x) =>
      x.id === item.id ? { ...x, remoteId: remoteId ?? x.remoteId ?? null, syncPending: false } : x
    );
    i += 1;
  }
  return { ...data, items };
}

function assignmentMetaFromData(data: HouseworkData, dateKey: string): AssignmentMeta | null {
  const a = data.todayAssignment;
  if (!a || a.date !== dateKey) return null;
  return {
    selectedTaskIds: a.selectedTaskIds,
    assignedAt: a.assignedAt,
    lastExtraAssignee: data.lastExtraAssignee,
  };
}

async function upsertChoreRecord(
  supabase: SupabaseClient,
  coupleId: string,
  payload: Record<string, unknown>,
  localId: string
): Promise<string | null> {
  const fullPayload = {
    ...payload,
    updated_at: payload.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('chore_records')
    .upsert(fullPayload, { onConflict: 'couple_id,local_id' })
    .select('id')
    .single();

  if (error) {
    console.warn(`${LOG} record upsert failed, fallback:`, error.message);
    const { data: existing, error: selErr } = await supabase
      .from('chore_records')
      .select('id')
      .eq('couple_id', coupleId)
      .eq('local_id', localId)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing?.id) {
      const { error: upErr } = await supabase.from('chore_records').update(fullPayload).eq('id', existing.id);
      if (upErr) throw upErr;
      return existing.id as string;
    }
    const { data: ins, error: insErr } = await supabase
      .from('chore_records')
      .insert(fullPayload)
      .select('id')
      .single();
    if (insErr) throw insErr;
    return (ins as { id: string } | null)?.id ?? null;
  }

  return (data as { id: string } | null)?.id ?? null;
}

function buildRecordPayload(input: {
  coupleId: string;
  localId: string;
  dateKey: string;
  taskId: string;
  item: HouseworkItem | undefined;
  chore: HouseworkAssignedChore;
  currentUserId: string | null;
  partnerUserId: string | null;
  myName: string;
  partnerName: string;
  remoteChoreId: string | null;
}): Record<string, unknown> {
  const { chore, item, currentUserId, partnerUserId } = input;
  const assignedTo =
    chore.assignee === 'A' ? currentUserId : chore.assignee === 'B' ? partnerUserId : null;
  const assignedName = chore.assignee === 'A' ? input.myName : input.partnerName;
  const status = chore.completed ? 'completed' : 'pending';

  return {
    couple_id: input.coupleId,
    local_id: input.localId,
    client_id: input.localId,
    chore_local_id: input.taskId,
    chore_id: input.remoteChoreId,
    title: item?.label ?? input.taskId,
    task_label: item?.label ?? input.taskId,
    emoji: item?.emoji ?? '🏠',
    assigned_to: assignedTo,
    assigned_role: chore.assignee,
    partner_slot: chore.assignee,
    assigned_name: assignedName,
    date_key: input.dateKey,
    status,
    completed_by: chore.completed ? chore.completedBy ?? currentUserId : null,
    completed_at: chore.completed ? chore.completedAt ?? new Date().toISOString() : null,
    rewarded: chore.rewarded,
    created_by: currentUserId,
    updated_at: chore.updatedAt ?? new Date().toISOString(),
  };
}

export async function pushTodayChoreRecordsToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: HouseworkData,
  ctx: {
    currentUserId: string | null;
    partnerUserId: string | null;
    myName: string;
    partnerName: string;
  },
  dateKey: string = todayKey()
): Promise<HouseworkData> {
  if (!ENABLE_CHORE_ASSIGNMENT_CLOUD_SYNC) return data;
  const a = data.todayAssignment;
  if (!a || a.date !== dateKey) return data;

  const meta = assignmentMetaFromData(data, dateKey);
  if (meta) {
    await upsertChoreRecord(
      supabase,
      coupleId,
      {
        couple_id: coupleId,
        local_id: metaLocalId(dateKey),
        client_id: metaLocalId(dateKey),
        title: '__meta__',
        task_label: '__meta__',
        emoji: '📋',
        date_key: dateKey,
        status: 'skipped',
        note: metaNote(meta),
        assigned_role: 'A',
        partner_slot: 'A',
        rewarded: false,
        created_by: ctx.currentUserId,
      },
      metaLocalId(dateKey)
    );
  }

  let chores = a.chores;
  for (const chore of a.chores) {
    const item = data.items.find((i) => i.id === chore.taskId);
    const localId = choreRecordLocalId(dateKey, chore.taskId);
    const remoteChoreId = item?.remoteId ?? null;
    const payload = buildRecordPayload({
      coupleId,
      localId,
      dateKey,
      taskId: chore.taskId,
      item,
      chore,
      currentUserId: ctx.currentUserId,
      partnerUserId: ctx.partnerUserId,
      myName: ctx.myName,
      partnerName: ctx.partnerName,
      remoteChoreId,
    });

    const remoteId = await upsertChoreRecord(supabase, coupleId, payload, localId);
    chores = chores.map((c) =>
      c.taskId === chore.taskId ? { ...c, remoteId: remoteId ?? c.remoteId ?? null } : c
    );
  }

  return {
    ...data,
    todayAssignment: { ...a, chores },
  };
}

export async function syncChores(
  supabase: SupabaseClient,
  coupleId: string,
  ctx: {
    currentUserId: string | null;
    partnerUserId: string | null;
    myName: string;
    partnerName: string;
  },
  current?: HouseworkData
): Promise<HouseworkData> {
  const base = current ?? loadHousework();
  const pushed = await pushChoresToRemote(supabase, coupleId, base, ctx.currentUserId);
  const merged = await pullChoresFromRemote(supabase, coupleId, pushed);
  saveHousework(merged);
  return merged;
}

export async function syncTodayChores(
  supabase: SupabaseClient,
  coupleId: string,
  ctx: {
    currentUserId: string | null;
    partnerUserId: string | null;
    myName: string;
    partnerName: string;
  },
  current?: HouseworkData,
  dateKey: string = todayKey()
): Promise<HouseworkData> {
  let data = current ?? loadHousework();
  data = await pushTodayChoreRecordsToRemote(supabase, coupleId, data, ctx, dateKey);
  data = await pullTodayChoreRecordsFromRemote(supabase, coupleId, data, dateKey);
  saveHousework(data);
  return data;
}

export async function pushHouseworkChangeToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  data: HouseworkData,
  ctx: {
    currentUserId: string | null;
    partnerUserId: string | null;
    myName: string;
    partnerName: string;
  }
): Promise<HouseworkData> {
  let next = await pushChoresToRemote(supabase, coupleId, data, ctx.currentUserId);
  next = await pushTodayChoreRecordsToRemote(supabase, coupleId, next, ctx);
  return next;
}
