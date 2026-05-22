import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../../useSupabaseAuth';
import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import type { CoupleProfile } from '../storage/types';

/** 舊版預設示範名稱，不再作為顯示用戶名 */
export const LEGACY_DEMO_NAMES = new Set(['小晴', '阿宇']);

export type NicknameSetupStatus = {
  needsMy: boolean;
  needsPartner: boolean;
  needsAny: boolean;
  message: string;
};

export function getNicknameSetupStatus(profile: CoupleExtendedProfile): NicknameSetupStatus {
  const needsMy = !profile.myNickname.trim();
  const needsPartner = !profile.partnerNickname.trim();
  const needsAny = needsMy || needsPartner;

  let message = '';
  if (needsMy && needsPartner) {
    message = '請設定你與另一半的暱稱，家事分配與獎勵會顯示正確名字';
  } else if (needsMy) {
    message = '請填寫「我的暱稱」';
  } else if (needsPartner) {
    message = '請填寫「另一半暱稱」';
  }

  return { needsMy, needsPartner, needsAny, message };
}

function resolveStoredName(stored: string, fallback: string): string {
  const t = stored.trim();
  if (!t || LEGACY_DEMO_NAMES.has(t)) return fallback;
  return t;
}

function isUsableDisplayName(name: string): boolean {
  const t = name.trim();
  return Boolean(t) && !LEGACY_DEMO_NAMES.has(t);
}

export function emailLocalPart(email: string): string {
  const t = email.trim();
  const at = t.indexOf('@');
  return at > 0 ? t.slice(0, at) : t;
}

function authMetadataDisplayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full = typeof meta?.full_name === 'string' ? meta.full_name.trim() : '';
  if (isUsableDisplayName(full)) return full;
  const name = typeof meta?.name === 'string' ? meta.name.trim() : '';
  if (isUsableDisplayName(name)) return name;
  const display = typeof meta?.display_name === 'string' ? meta.display_name.trim() : '';
  if (isUsableDisplayName(display)) return display;
  return '';
}

export type LoggedInUserLabelInput = {
  user: User | null;
  profile: UserProfile | null;
  /** 情侶資料「我的暱稱」 */
  myNickname?: string;
  partnerNickname?: string;
};

/**
 * 目前登入者顯示名稱（全站一致）：
 * 1. coupleProfile.myNickname
 * 2. profiles.display_name
 * 3. auth user_metadata（full_name / name / display_name）
 * 4. email 前綴
 */
export function resolveCurrentUserDisplayName(input: LoggedInUserLabelInput): string {
  const myNick = input.myNickname?.trim() ?? '';
  if (isUsableDisplayName(myNick)) return myNick;

  const profileName = input.profile?.display_name?.trim() ?? '';
  if (isUsableDisplayName(profileName)) return profileName;

  const user = input.user;
  if (user) {
    const metaName = authMetadataDisplayName(user);
    if (metaName) return metaName;
    const email = user.email?.trim();
    if (email) return emailLocalPart(email);
  }

  return '我';
}

/** 另一半顯示名稱：以情侶資料 partnerNickname 為主 */
export function resolvePartnerDisplayName(partnerNickname?: string): string {
  const nick = partnerNickname?.trim() ?? '';
  if (isUsableDisplayName(nick)) return nick;
  return '另一半';
}

/** 頂部「已登入 xxx」 */
export function resolveLoggedInUserLabel(input: LoggedInUserLabelInput): string {
  if (!input.user) return '已登入';
  return resolveCurrentUserDisplayName(input);
}

export type UserDisplayNameContext = {
  currentUserId: string | null;
  /** 情侶空間另一位成員的 auth user id */
  partnerUserId?: string | null;
  user: User | null;
  profile: UserProfile | null;
  coupleExtended: CoupleExtendedProfile;
};

export function buildCoupleDisplayNames(ctx: UserDisplayNameContext): {
  me: string;
  partner: string;
} {
  return {
    me: resolveCurrentUserDisplayName({
      user: ctx.user,
      profile: ctx.profile,
      myNickname: ctx.coupleExtended.myNickname,
      partnerNickname: ctx.coupleExtended.partnerNickname,
    }),
    partner: resolvePartnerDisplayName(ctx.coupleExtended.partnerNickname),
  };
}

/**
 * 依 user_id 解析顯示名稱（不用「非本人即另一半暱稱」推斷，避免錯名）
 * 1. 本人 → myNickname / profile / metadata / email
 * 2. 伴侶 user id → partnerNickname
 * 3. 其他 →「使用者」
 */
export function resolveDisplayNameForUserId(
  userId: string | null | undefined,
  ctx: UserDisplayNameContext
): string {
  if (!userId) return '使用者';
  if (ctx.currentUserId && userId === ctx.currentUserId) {
    return resolveCurrentUserDisplayName({
      user: ctx.user,
      profile: ctx.profile,
      myNickname: ctx.coupleExtended.myNickname,
      partnerNickname: ctx.coupleExtended.partnerNickname,
    });
  }
  if (ctx.partnerUserId && userId === ctx.partnerUserId) {
    return resolvePartnerDisplayName(ctx.coupleExtended.partnerNickname);
  }
  return '使用者';
}

/** 以情侶資料暱稱為主；無則顯示「我／另一半」，並忽略舊示範名 */
export function mergeCoupleProfile(base: CoupleProfile, extended: CoupleExtendedProfile): CoupleProfile {
  const my = extended.myNickname.trim();
  const partner = extended.partnerNickname.trim();
  return {
    ...base,
    nameA: my || resolveStoredName(base.nameA, '我'),
    nameB: partner || resolveStoredName(base.nameB, '另一半'),
  };
}
