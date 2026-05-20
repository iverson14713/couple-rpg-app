import type { SupabaseClient, User } from '@supabase/supabase-js';
import { mapCoupleSpaceError } from './coupleSpaceErrors';

export type CoupleMemberInfo = {
  userId: string;
  role: 'owner' | 'partner';
  joinedAt: string;
  isSelf: boolean;
  label: string;
};

export type CoupleSpaceInfo = {
  coupleId: string;
  inviteCode: string;
  coupleName: string | null;
  members: CoupleMemberInfo[];
  memberCount: number;
  isFullyBound: boolean;
};

type CoupleRow = {
  id: string;
  invite_code: string;
  couple_name?: string | null;
  display_name?: string | null;
};

type MemberRow = {
  user_id: string;
  role: 'owner' | 'partner';
  joined_at: string;
};

function memberLabel(role: 'owner' | 'partner', isSelf: boolean): string {
  if (isSelf) return role === 'owner' ? '你（建立者）' : '你（伴侶）';
  return role === 'owner' ? '另一半（建立者）' : '另一半（伴侶）';
}

export async function fetchMyCoupleSpace(
  supabase: SupabaseClient,
  user: User
): Promise<CoupleSpaceInfo | null> {
  const { data: membership, error: memErr } = await supabase
    .from('couple_members')
    .select('couple_id, role, joined_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (memErr) throw new Error(memErr.message);
  if (!membership) return null;

  const coupleId = membership.couple_id as string;

  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select('id, invite_code, couple_name, display_name')
    .eq('id', coupleId)
    .maybeSingle();

  if (coupleErr) throw new Error(coupleErr.message);
  if (!couple) return null;

  const { data: members, error: membersErr } = await supabase
    .from('couple_members')
    .select('user_id, role, joined_at')
    .eq('couple_id', coupleId)
    .order('joined_at', { ascending: true });

  if (membersErr) throw new Error(membersErr.message);

  const rows = (members ?? []) as MemberRow[];
  const c = couple as CoupleRow;

  const memberInfos: CoupleMemberInfo[] = rows.map((m) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    isSelf: m.user_id === user.id,
    label: memberLabel(m.role, m.user_id === user.id),
  }));

  return {
    coupleId: c.id,
    inviteCode: c.invite_code,
    coupleName: c.couple_name ?? c.display_name ?? null,
    members: memberInfos,
    memberCount: memberInfos.length,
    isFullyBound: memberInfos.length >= 2,
  };
}

export async function createCoupleSpace(
  supabase: SupabaseClient,
  coupleName?: string
): Promise<{ coupleId: string; inviteCode: string }> {
  const { data, error } = await supabase.rpc('create_couple_space', {
    p_couple_name: coupleName?.trim() || null,
  });

  if (error) throw new Error(mapCoupleSpaceError(error));

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, string> | null;
  const coupleId = row?.out_couple_id ?? row?.couple_id;
  const inviteCode = row?.out_invite_code ?? row?.invite_code;
  if (!coupleId || !inviteCode) {
    throw new Error('建立失敗，請稍後再試');
  }

  return { coupleId, inviteCode };
}

export async function acceptCoupleInvite(supabase: SupabaseClient, code: string): Promise<string> {
  const trimmed = code.trim();
  if (!trimmed) throw new Error('請輸入邀請碼');

  const { data, error } = await supabase.rpc('accept_couple_invite', { p_code: trimmed });

  if (error) throw new Error(mapCoupleSpaceError(error));
  if (!data) throw new Error('加入失敗，請稍後再試');

  return data as string;
}

export async function copyInviteCode(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}
