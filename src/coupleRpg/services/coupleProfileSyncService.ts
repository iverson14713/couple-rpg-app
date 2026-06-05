/**
 * Sync couple extended profile via public.couple_app_state.state.coupleProfile
 * (does not touch RPG, rewards, dinner, etc.)
 *
 * Nicknames / birthdays are per-user (members[userId]) so A/B stay mirrored correctly.
 * Shared dates & custom important dates live in `shared`.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoupleExtendedProfile, CustomImportantDate } from '../storage/coupleExtendedTypes';
import { defaultCoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import {
  loadCoupleExtendedProfile,
  saveCoupleExtendedProfile,
} from '../storage/coupleExtendedStore';
import { canUseUserStorage } from '../storage/storageGuard';

const LOG = '[couple-profile-sync]';

export type RemoteMemberProfile = {
  nickname: string;
  birthday: string;
  updatedAt: string;
};

export type RemoteCoupleProfileShared = {
  updatedAt: string;
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

/** Stored in couple_app_state.state.coupleProfile (v2) */
export type RemoteCoupleProfilePayload = {
  version: 2;
  updatedAt: string;
  members: Record<string, RemoteMemberProfile>;
  shared: RemoteCoupleProfileShared;
};

/** Legacy v1 — perspective-relative nicknames; not applied on read */
type RemoteCoupleProfilePayloadV1 = {
  version: 1;
  updatedAt: string;
  myNickname: string;
  partnerNickname: string;
  myBirthday: string;
  partnerBirthday: string;
  anniversaryDate: string;
  weddingDate: string;
  firstDateDate: string;
  customImportantDates: RemoteCoupleProfileShared['customImportantDates'];
};

export type CoupleProfileSyncContext = {
  currentUserId: string | null;
  partnerUserId: string | null;
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
    canUseUserStorage(input.userId) &&
      input.configured &&
      input.userId &&
      input.coupleId &&
      input.online &&
      input.isFullyBound
  );
}

function sanitizeCustomRemote(raw: unknown): RemoteCoupleProfileShared['customImportantDates'] {
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

function emptyShared(updatedAt = ''): RemoteCoupleProfileShared {
  return {
    updatedAt,
    anniversaryDate: '',
    weddingDate: '',
    firstDateDate: '',
    customImportantDates: [],
  };
}

function emptyRemotePayload(): RemoteCoupleProfilePayload {
  return {
    version: 2,
    updatedAt: '',
    members: {},
    shared: emptyShared(),
  };
}

function sharedFromV1(raw: RemoteCoupleProfilePayloadV1): RemoteCoupleProfileShared {
  return {
    updatedAt: raw.updatedAt || '',
    anniversaryDate: raw.anniversaryDate ?? '',
    weddingDate: raw.weddingDate ?? '',
    firstDateDate: raw.firstDateDate ?? '',
    customImportantDates: sanitizeCustomRemote(raw.customImportantDates),
  };
}

function normalizeRemotePayload(raw: unknown): RemoteCoupleProfilePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = (raw as { version?: number }).version;

  if (v === 2) {
    const r = raw as Partial<RemoteCoupleProfilePayload>;
    const members: Record<string, RemoteMemberProfile> = {};
    if (r.members && typeof r.members === 'object') {
      for (const [uid, m] of Object.entries(r.members)) {
        if (!m || typeof m !== 'object') continue;
        const mm = m as Partial<RemoteMemberProfile>;
        members[uid] = {
          nickname: String(mm.nickname ?? ''),
          birthday: String(mm.birthday ?? ''),
          updatedAt: String(mm.updatedAt ?? ''),
        };
      }
    }
    const sh = r.shared as Partial<RemoteCoupleProfileShared> | undefined;
    return {
      version: 2,
      updatedAt: String(r.updatedAt ?? ''),
      members,
      shared: {
        updatedAt: String(sh?.updatedAt ?? r.updatedAt ?? ''),
        anniversaryDate: String(sh?.anniversaryDate ?? ''),
        weddingDate: String(sh?.weddingDate ?? ''),
        firstDateDate: String(sh?.firstDateDate ?? ''),
        customImportantDates: sanitizeCustomRemote(sh?.customImportantDates),
      },
    };
  }

  if (v === 1) {
    const r = raw as RemoteCoupleProfilePayloadV1;
    return {
      version: 2,
      updatedAt: r.updatedAt || '',
      members: {},
      shared: sharedFromV1(r),
    };
  }

  return null;
}

export function localToRemotePayload(
  profile: CoupleExtendedProfile,
  userId: string
): RemoteCoupleProfilePayload {
  const base = { ...defaultCoupleExtendedProfile(), ...profile, version: 1 as const };
  const updatedAt = base.updatedAt || new Date().toISOString();
  return {
    version: 2,
    updatedAt,
    members: {
      [userId]: {
        nickname: base.myNickname.trim(),
        birthday: base.myBirthday.trim(),
        updatedAt,
      },
    },
    shared: {
      updatedAt,
      anniversaryDate: base.relationshipStart.trim(),
      weddingDate: base.weddingAnniversary.trim(),
      firstDateDate: base.firstDate.trim(),
      customImportantDates: base.customDates.map((c) => ({
        id: c.id,
        title: c.name.trim(),
        date: c.date.trim(),
        note: c.note.trim(),
      })),
    },
  };
}

/** Remote wins only when strictly newer; ties keep local. */
function localFieldWins(_localValue: string, localUpdatedAt: string, remoteUpdatedAt: string): boolean {
  return parseTs(remoteUpdatedAt) <= parseTs(localUpdatedAt);
}

function pickNickname(
  remoteMember: RemoteMemberProfile | undefined,
  localValue: string,
  localUpdatedAt: string
): string {
  if (!remoteMember) return localValue;
  if (!localValue.trim()) return remoteMember.nickname;
  if (localFieldWins(localValue, localUpdatedAt, remoteMember.updatedAt)) return localValue;
  return remoteMember.nickname;
}

function pickBirthday(
  remoteMember: RemoteMemberProfile | undefined,
  localValue: string,
  localUpdatedAt: string
): string {
  if (!remoteMember) return localValue;
  if (!localValue.trim()) return remoteMember.birthday;
  if (localFieldWins(localValue, localUpdatedAt, remoteMember.updatedAt)) return localValue;
  return remoteMember.birthday;
}

export function remoteToLocalProfile(
  remote: RemoteCoupleProfilePayload,
  ctx: CoupleProfileSyncContext,
  localFallback: CoupleExtendedProfile
): CoupleExtendedProfile {
  const base = { ...defaultCoupleExtendedProfile(), ...localFallback, version: 1 };
  const uid = ctx.currentUserId;
  const pid = ctx.partnerUserId;
  const myMember = uid ? remote.members[uid] : undefined;
  const partnerMember = pid ? remote.members[pid] : undefined;

  const localTs = profileEffectiveTs(base);
  const remoteTs = remoteEffectiveTs(remote);
  const useShared = isLocalProfileEmpty(base) || remoteTs > localTs;

  const mergedUpdatedAt = Math.max(localTs, remoteTs);
  const mergedUpdatedAtIso =
    mergedUpdatedAt > 0
      ? new Date(mergedUpdatedAt).toISOString()
      : base.updatedAt || remote.updatedAt;

  return {
    version: 1,
    updatedAt: mergedUpdatedAtIso,
    myNickname: uid ? pickNickname(myMember, base.myNickname, base.updatedAt) : base.myNickname,
    partnerNickname: pid
      ? pickNickname(partnerMember, base.partnerNickname, base.updatedAt)
      : base.partnerNickname,
    myBirthday: uid ? pickBirthday(myMember, base.myBirthday, base.updatedAt) : base.myBirthday,
    partnerBirthday: pid
      ? pickBirthday(partnerMember, base.partnerBirthday, base.updatedAt)
      : base.partnerBirthday,
    relationshipStart: useShared ? remote.shared.anniversaryDate : base.relationshipStart,
    weddingAnniversary: useShared ? remote.shared.weddingDate : base.weddingAnniversary,
    firstDate: useShared ? remote.shared.firstDateDate : base.firstDate,
    customDates: useShared
      ? sanitizeCustomRemote(remote.shared.customImportantDates).map(
          (c): CustomImportantDate => ({
            id: c.id,
            name: c.title,
            date: c.date,
            note: c.note,
          })
        )
      : base.customDates,
  };
}

function parseTs(iso: string | undefined | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function remoteEffectiveTs(remote: RemoteCoupleProfilePayload): number {
  return Math.max(parseTs(remote.updatedAt), parseTs(remote.shared.updatedAt));
}

function profileEffectiveTs(local: CoupleExtendedProfile): number {
  return parseTs(local.updatedAt);
}

export function isCoupleProfilePayloadEmpty(p: RemoteCoupleProfilePayload | null): boolean {
  if (!p) return true;
  const hasMember = Object.values(p.members).some(
    (m) => m.nickname?.trim() || m.birthday?.trim()
  );
  const hasDate = Boolean(
    p.shared.anniversaryDate?.trim() ||
      p.shared.weddingDate?.trim() ||
      p.shared.firstDateDate?.trim()
  );
  const hasCustom = (p.shared.customImportantDates?.length ?? 0) > 0;
  return !hasMember && !hasDate && !hasCustom;
}

export function isLocalProfileEmpty(p: CoupleExtendedProfile): boolean {
  if (!p) return true;
  const hasNick = Boolean(p.myNickname?.trim() || p.partnerNickname?.trim());
  const hasDate = Boolean(
    p.myBirthday?.trim() ||
      p.partnerBirthday?.trim() ||
      p.relationshipStart?.trim() ||
      p.weddingAnniversary?.trim() ||
      p.firstDate?.trim()
  );
  const hasCustom = (p.customDates?.length ?? 0) > 0;
  return !hasNick && !hasDate && !hasCustom;
}

/**
 * Merge remote into local without swapping A/B nicknames.
 * Only applies remote fields when remote.updatedAt is strictly newer.
 */
export function mergeCoupleExtendedProfile(
  local: CoupleExtendedProfile,
  remote: RemoteCoupleProfilePayload | null,
  ctx: CoupleProfileSyncContext
): CoupleExtendedProfile {
  const localNorm = { ...defaultCoupleExtendedProfile(), ...local, version: 1 };
  const normalized = remote ? normalizeRemotePayload(remote) : null;
  if (!normalized || isCoupleProfilePayloadEmpty(normalized)) {
    return localNorm;
  }
  return remoteToLocalProfile(normalized, ctx, localNorm);
}

export function mergeRemotePayloadOnPush(
  existing: RemoteCoupleProfilePayload | null,
  incoming: RemoteCoupleProfilePayload,
  userId: string
): RemoteCoupleProfilePayload {
  const base = existing ?? emptyRemotePayload();
  const myIncoming = incoming.members[userId];
  const members = { ...base.members };
  if (myIncoming) {
    const prev = members[userId];
    if (!prev || parseTs(myIncoming.updatedAt) > parseTs(prev.updatedAt)) {
      members[userId] = myIncoming;
    }
  }

  const shared =
    parseTs(incoming.shared.updatedAt) > parseTs(base.shared.updatedAt)
      ? incoming.shared
      : base.shared;

  const updatedAt = [incoming.updatedAt, base.updatedAt, shared.updatedAt]
    .map(parseTs)
    .reduce((max, t) => Math.max(max, t), 0);

  return {
    version: 2,
    updatedAt: updatedAt > 0 ? new Date(updatedAt).toISOString() : incoming.updatedAt,
    members,
    shared,
  };
}

/** Pull only when remote updatedAt is strictly newer than local. */
export function remoteIsNewerThanLocal(
  local: CoupleExtendedProfile,
  remote: RemoteCoupleProfilePayload | null
): boolean {
  const normalized = remote ? normalizeRemotePayload(remote) : null;
  if (!normalized || isCoupleProfilePayloadEmpty(normalized)) return false;
  if (isLocalProfileEmpty(local)) return true;
  return remoteEffectiveTs(normalized) > profileEffectiveTs(local);
}

/** Push only when local updatedAt is strictly newer than remote. */
export function localIsNewerThanRemote(
  local: CoupleExtendedProfile,
  remote: RemoteCoupleProfilePayload | null
): boolean {
  if (isLocalProfileEmpty(local) || profileEffectiveTs(local) === 0) return false;
  const normalized = remote ? normalizeRemotePayload(remote) : null;
  if (!normalized || isCoupleProfilePayloadEmpty(normalized)) return true;
  return profileEffectiveTs(local) > remoteEffectiveTs(normalized);
}

function extractRemoteFromState(state: unknown): RemoteCoupleProfilePayload | null {
  if (!state || typeof state !== 'object') return null;
  const cp = (state as { coupleProfile?: unknown }).coupleProfile;
  if (!cp || typeof cp !== 'object') return null;
  return normalizeRemotePayload(cp);
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
  currentUserId: string,
  baseServerUpdatedAt: string | null
): Promise<{ ok: boolean; conflict: boolean }> {
  const incoming = localToRemotePayload(profile, currentUserId);
  const { state, serverUpdatedAt } = await readFullAppState(supabase, coupleId);
  const existing = extractRemoteFromState(state);
  const payload = mergeRemotePayloadOnPush(existing, incoming, currentUserId);

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
  coupleId: string,
  ctx: CoupleProfileSyncContext
): Promise<SyncCoupleProfileResult> {
  const local = loadCoupleExtendedProfile();
  const { profile: remote, serverUpdatedAt } = await pullCoupleProfileFromRemote(supabase, coupleId);

  const pulledNewer = remoteIsNewerThanLocal(local, remote);
  const pushNewer = localIsNewerThanRemote(local, remote);

  let merged = local;
  if (pulledNewer) {
    merged = mergeCoupleExtendedProfile(local, remote, ctx);
    saveCoupleExtendedProfile(merged);
  }

  let pushed = false;
  const uid = ctx.currentUserId;
  if (uid && pushNewer) {
    const pushResult = await pushCoupleProfileToRemote(
      supabase,
      coupleId,
      merged,
      uid,
      serverUpdatedAt
    );
    pushed = pushResult.ok;
    if (pushResult.conflict) {
      const again = await pullCoupleProfileFromRemote(supabase, coupleId);
      if (remoteIsNewerThanLocal(merged, again.profile)) {
        const remerged = mergeCoupleExtendedProfile(merged, again.profile, ctx);
        saveCoupleExtendedProfile(remerged);
        return { merged: remerged, pushed: false, pulledNewer: true };
      }
    }
    return { merged, pushed, pulledNewer };
  }

  return { merged, pushed, pulledNewer };
}
