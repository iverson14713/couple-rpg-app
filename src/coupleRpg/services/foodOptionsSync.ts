/**
 * Sync dinner options with Supabase public.food_options.
 * Schema (Phase 5): id, couple_id, client_id, label, sort_order, created_at, updated_at
 * — no created_by on this table (only food_decisions has created_by).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DinnerData, DinnerOption } from '../storage/types';

const LOG = '[food-sync]';

/** Row shape from public.food_options — must match migration columns. */
export type FoodOptionRow = {
  id: string;
  couple_id: string;
  client_id: string | null;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function canSyncFoodOptions(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
}): boolean {
  return Boolean(input.configured && input.userId && input.coupleId && input.online);
}

function normLabel(s: string): string {
  return s.trim().toLowerCase();
}

/** Remote id wins; then dedupe by label (first occurrence wins, remote order first). */
export function mergeRemoteFoodOptions(local: DinnerOption[], remoteRows: FoodOptionRow[]): DinnerOption[] {
  const sortedRemote = [...remoteRows].sort((a, b) => a.sort_order - b.sort_order);
  const out: DinnerOption[] = [];
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();

  for (const r of sortedRemote) {
    const label = r.label?.trim() ?? '';
    if (!label) continue;
    const id = r.client_id?.trim() ? r.client_id.trim() : r.id;
    const nl = normLabel(label);
    if (seenLabels.has(nl)) continue;
    out.push({ id, label });
    seenIds.add(id);
    seenLabels.add(nl);
  }

  for (const lo of local) {
    const nl = normLabel(lo.label);
    if (seenIds.has(lo.id)) continue;
    if (seenLabels.has(nl)) continue;
    out.push(lo);
    seenIds.add(lo.id);
    seenLabels.add(nl);
  }

  return out;
}

export async function pullRemoteFoodOptions(
  supabase: SupabaseClient,
  coupleId: string,
  currentLocal: DinnerData
): Promise<DinnerData> {
  console.log(`${LOG} pulling remote food options`);
  const { data, error } = await supabase
    .from('food_options')
    .select('id, couple_id, client_id, label, sort_order, created_at, updated_at')
    .eq('couple_id', coupleId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(`${LOG} pull failed:`, error.message);
    throw error;
  }

  const rows = (data ?? []) as FoodOptionRow[];
  console.log(`${LOG} pull success count = ${rows.length}`);
  const mergedOptions = mergeRemoteFoodOptions(currentLocal.options, rows);
  return { ...currentLocal, options: mergedOptions };
}

async function upsertSingleRow(
  supabase: SupabaseClient,
  coupleId: string,
  option: DinnerOption,
  sortOrder: number
): Promise<void> {
  const { data: existing, error: selErr } = await supabase
    .from('food_options')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('client_id', option.id)
    .maybeSingle();

  if (selErr) {
    console.error(`${LOG} push failed (select):`, selErr.message);
    throw selErr;
  }

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from('food_options')
      .update({
        label: option.label,
        sort_order: sortOrder,
      })
      .eq('id', existing.id);
    if (upErr) {
      console.error(`${LOG} push failed (update):`, upErr.message);
      throw upErr;
    }
    return;
  }

  const { error: insErr } = await supabase.from('food_options').insert({
    couple_id: coupleId,
    client_id: option.id,
    label: option.label,
    sort_order: sortOrder,
  });
  if (insErr) {
    console.error(`${LOG} push failed (insert):`, insErr.message);
    throw insErr;
  }
}

export async function pushDinnerOptionToSupabase(
  supabase: SupabaseClient,
  coupleId: string,
  option: DinnerOption,
  sortOrder: number
): Promise<void> {
  console.log(`${LOG} pushing option to supabase`);
  await upsertSingleRow(supabase, coupleId, option, sortOrder);
  console.log(`${LOG} push success`);
}

export async function pushAllLocalDinnerOptions(
  supabase: SupabaseClient,
  coupleId: string,
  data: DinnerData
): Promise<void> {
  console.log(`${LOG} current couple_id = ${coupleId}`);
  console.log(`${LOG} pushing all local options count = ${data.options.length}`);
  let i = 0;
  for (const opt of data.options) {
    await upsertSingleRow(supabase, coupleId, opt, i);
    i += 1;
  }
  console.log(`${LOG} push all success`);
}

export async function deleteFoodOptionRemote(
  supabase: SupabaseClient,
  coupleId: string,
  localOrServerId: string
): Promise<void> {
  const byClient = await supabase
    .from('food_options')
    .delete()
    .eq('couple_id', coupleId)
    .eq('client_id', localOrServerId)
    .select('id');
  if (byClient.error) {
    console.error(`${LOG} delete remote failed:`, byClient.error.message);
    throw byClient.error;
  }
  if (byClient.data && byClient.data.length > 0) return;

  const byId = await supabase.from('food_options').delete().eq('couple_id', coupleId).eq('id', localOrServerId).select('id');
  if (byId.error) {
    console.error(`${LOG} delete remote failed:`, byId.error.message);
    throw byId.error;
  }
}
