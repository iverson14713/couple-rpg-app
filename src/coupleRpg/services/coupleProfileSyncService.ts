/**
 * Sync couple extended profile via public.couple_app_state.state.coupleProfile
 * (does not touch RPG, rewards, dinner, etc.)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoupleExtendedProfile, CustomImportantDate } from '../storage/coupleExtendedTypes';
import { defaultCoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import {
  loadCoupleExtendedProfile,
  saveCoupleExtendedProfile,
  stampCoupleExtendedProfile,
} from '../storage/coupleExtendedStore';

const LOG = '[couple-profile-sync]';

/** Stored in couple_app_state.state.coupleProfile */
export type RemoteCoupleProfilePayload = {
  version: 1;
  updatedAt: string;
  myNickname: string;
  partnerNickname: string;
  myBirthday: string;
  partnerBirthday: string;
  anniversaryDate: string;
  weddingDate: string;
  firstDateDate: string;
  customImportantDates: Array<{
    id: string;
    title: string;
    date: string;
    note: string;
  }>;
};

export type CoupleProfileSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export type RemoteCoupleProfileRow = {
  profile: RemoteCoupleProfilePayload | null;
  serverUpdatedAt: string | null;
};

export function canSyncCoupleProfile(input: {
  configured: boolean;
  userId: string | null;
  coupleId: string | null;
  online: boolean;
  isFullyBound: boolean;
}): boolean {
  return Boolean(
    input.configured && input.userId && input.coupleId && input.online && input.isFullyBound
  );
}

function sanitizeCustomRemote(raw: unknown): RemoteCoupleProfilePayload['customImportantDates'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map((x) => ({
      id: String(x.id ?? ''),
      title: String(x.title ?? x.name ?? ''),
      date: String(x.date ?? ''),
      note: String(x.note ?? ''),
    }))
    .filter((x) => x.id.length > 0);
}

export function localToRemotePayload(profile: CoupleExtendedProfile): RemoteCoupleProfilePayload {
  const base = { ...defaultCoupleExtendedProfile(), ...profile, version: 1 as const };
  return {
    version: 1,
    updatedAt: base.updatedAt || new Date().toISOString(),
    myNickname: base.myNickname.trim(),
    partnerNickname: base.partnerNickname.trim(),
    myBirthday: base.myBirthday.trim(),
    partnerBirthday: base.partnerBirthday.trim(),
    anniversaryDate: base.relationshipStart.trim(),
    weddingDate: base.weddingAnniversary.trim(),
    firstDateDate: base.firstDate.trim(),
    customImportantDates: base.customDates.map((c) => ({
      id: c.id,
      title: c.name.trim(),
      date: c.date.trim(),
      note: c.note.trim(),
    })),
  };
}

export function remoteToLocalProfile(remote: RemoteCoupleProfilePayload): CoupleExtendedProfile {
  return {
    version: 1,
    updatedAt: remote.updatedAt || '',
    myNickname: remote.myNickname ?? '',
    partnerNickname: remote.partnerNickname ?? '',
    myBirthday: remote.myBirthday ?? '',
    partnerBirthday: remote.partnerBirthday ?? '',
    relationshipStart: remote.anniversaryDate ?? '',
    weddingAnniversary: remote.weddingDate ?? '',
    firstDate: remote.firstDateDate ?? '',
    customDates: sanitizeCustomRemote(remote.customImportantDates).map(
      (c): CustomImportantDate => ({
        id: c.id,
        name: c.title,
        date: c.date,
        note: c.note,
      })
    ),
  };
}

function parseTs(iso: string | undefined | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function isCoupleProfilePayloadEmpty(p: RemoteCoupleProfilePayload | null): boolean {
  if (!p) return true;
  const hasNick = Boolean(p.myNickname?.trim() || p.partnerNickname?.trim());
  const hasDate = Boolean(
    p.myBirthday?.trim() ||
      p.partnerBirthday?.trim() ||
      p.anniversaryDate?.trim() ||
      p.weddingDate?.trim() ||
      p.firstDateDate?.trim()
  );
  const hasCustom = (p.customImportantDates?.length ?? 0) > 0;
  return !hasNick && !hasDate && !hasCustom;
}

export function isLocalProfileEmpty(p: CoupleExtendedProfile): boolean {
  return isCoupleProfilePayloadEmpty(localToRemotePayload(p));
}

/** 以整包 updatedAt 較新者為準 */
export function mergeCoupleProfile(
  local: CoupleExtendedProfile,
  remote: RemoteCoupleProfilePayload | null
): CoupleExtendedProfile {
  const localNorm = { ...defaultCoupleExtendedProfile(), ...local, version: 1 };
  if (!remote || isCoupleProfilePayloadEmpty(remote)) {
    return localNorm;
  }
  if (isLocalProfileEmpty(localNorm)) {
    return remoteToLocalProfile(remote);
  }
  const lt = parseTs(localNorm.updatedAt);
  const rt = parseTs(remote.updatedAt);
  if (rt > lt) return remoteToLocalProfile(remote);
  return localNorm;
}

export function shouldPushAfterMerge(
  localBefore: CoupleExtendedProfile,
  remote: RemoteCoupleProfilePayload | null
): boolean {
  if (!remote || isCoupleProfilePayloadEmpty(remote)) {
    return !isLocalProfileEmpty(localBefore);
  }
  const lt = parseTs(localBefore.updatedAt);
  const rt = parseTs(remote.updatedAt);
  return lt >= rt;
}

function extractRemoteFromState(state: unknown): RemoteCoupleProfilePayload | null {
  if (!state || typeof state !== 'object') return null;
  const cp = (state as { coupleProfile?: unknown }).coupleProfile;
  if (!cp || typeof cp !== 'object') return null;
  const raw = cp as Partial<RemoteCoupleProfilePayload>;
  if (raw.version !== 1) return null;
  return {
    version: 1,
    updatedAt: String(raw.updatedAt ?? ''),
    myNickname: String(raw.myNickname ?? ''),
    partnerNickname: String(raw.partnerNickname ?? ''),
    myBirthday: String(raw.myBirthday ?? ''),
    partnerBirthday: String(raw.partnerBirthday ?? ''),
    anniversaryDate: String(raw.anniversaryDate ?? ''),
    weddingDate: String(raw.weddingDate ?? ''),
    firstDateDate: String(raw.firstDateDate ?? ''),
    customImportantDates: sanitizeCustomRemote(raw.customImportantDates),
  };
}

export async function getRemoteCoupleProfile(
  supabase: SupabaseClient,
  coupleId: string
): Promise<RemoteCoupleProfileRow> {
  const { data, error } = await supabase
    .from('couple_app_state')
    .select('state, updated_at')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (error) {
    console.error(`${LOG} getRemote failed:`, error.message);
    throw error;
  }

  const row = data as { state?: unknown; updated_at?: string } | null;
  return {
    profile: extractRemoteFromState(row?.state),
    serverUpdatedAt: row?.updated_at ?? null,
  };
}

export async function pullCoupleProfileFromRemote(
  supabase: SupabaseClient,
  coupleId: string
): Promise<RemoteCoupleProfileRow> {
  console.log(`${LOG} pull`);
  return getRemoteCoupleProfile(supabase, coupleId);
}

async function readFullAppState(
  supabase: SupabaseClient,
  coupleId: string
): Promise<{ state: Record<string, unknown>; serverUpdatedAt: string | null }> {
  const { data, error } = await supabase
    .from('couple_app_state')
    .select('state, updated_at')
    .eq('couple_id', coupleId)
    .maybeSingle();

  if (error) throw error;
  const row = data as { state?: unknown; updated_at?: string } | null;
  const state =
    row?.state && typeof row.state === 'object' && !Array.isArray(row.state)
      ? { ...(row.state as Record<string, unknown>) }
      : {};
  return { state, serverUpdatedAt: row?.updated_at ?? null };
}

export async function pushCoupleProfileToRemote(
  supabase: SupabaseClient,
  coupleId: string,
  profile: CoupleExtendedProfile,
  baseServerUpdatedAt: string | null
): Promise<{ ok: boolean; conflict: boolean }> {
  const payload = localToRemotePayload(profile);
  const { state, serverUpdatedAt } = await readFullAppState(supabase, coupleId);
  const nextState = {
    ...state,
    version: typeof state.version === 'number' ? state.version : 1,
    coupleProfile: payload,
  };

  const base = baseServerUpdatedAt ?? serverUpdatedAt;

  const { data, error } = await supabase.rpc('save_couple_app_state', {
    p_couple_id: coupleId,
    p_state: nextState,
    p_base_updated_at: base,
  });

  if (error) {
    console.error(`${LOG} push rpc failed:`, error.message);
    throw error;
  }

  const rows = (data ?? []) as Array<{
    out_ok?: boolean;
    out_conflict?: boolean;
  }>;
  const first = rows[0];
  const conflict = Boolean(first?.out_conflict);
  const ok = Boolean(first?.out_ok) && !conflict;
  console.log(`${LOG} push ok=${ok} conflict=${conflict}`);
  return { ok, conflict };
}

export type SyncCoupleProfileResult = {
  merged: CoupleExtendedProfile;
  pushed: boolean;
  pulledNewer: boolean;
};

export async function syncCoupleProfile(
  supabase: SupabaseClient,
  coupleId: string
): Promise<SyncCoupleProfileResult> {
  const local = loadCoupleExtendedProfile();
  const { profile: remote, serverUpdatedAt } = await pullCoupleProfileFromRemote(supabase, coupleId);
  const merged = mergeCoupleProfile(local, remote);
  saveCoupleExtendedProfile(merged);

  const pulledNewer =
    Boolean(remote) &&
    !isCoupleProfilePayloadEmpty(remote) &&
    parseTs(remote!.updatedAt) > parseTs(local.updatedAt);

  let pushed = false;
  if (shouldPushAfterMerge(local, remote)) {
    const stamped = stampCoupleExtendedProfile(merged);
    saveCoupleExtendedProfile(stamped);
    const pushResult = await pushCoupleProfileToRemote(
      supabase,
      coupleId,
      stamped,
      serverUpdatedAt
    );
    pushed = pushResult.ok;
    if (pushResult.conflict) {
      const again = await pullCoupleProfileFromRemote(supabase, coupleId);
      const remerged = mergeCoupleProfile(stamped, again.profile);
      saveCoupleExtendedProfile(remerged);
      return { merged: remerged, pushed: false, pulledNewer: true };
    }
    return { merged: stamped, pushed, pulledNewer };
  }

  return { merged, pushed, pulledNewer };
}
