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

export type LoggedInUserLabelInput = {
  user: User | null;
  profile: UserProfile | null;
  /** 已依 auth.uid() 對應的「我的暱稱」（couple profile members[userId]） */
  myNickname?: string;
  /** 另一半暱稱 — 僅用於排除誤顯示，不可作為登入者名稱 */
  partnerNickname?: string;
};

/**
 * 頂部「已登入 xxx」：永遠顯示目前登入者，不用 partner / nameB。
 * 優先：profiles.display_name → 我的情侶暱稱 → email → 已登入
 */
export function resolveLoggedInUserLabel(input: LoggedInUserLabelInput): string {
  const user = input.user;
  if (!user) return '已登入';

  const profileName = input.profile?.display_name?.trim() ?? '';
  const myNick = input.myNickname?.trim() ?? '';
  const partnerNick = input.partnerNickname?.trim() ?? '';

  const profileIsPartnerNick =
    Boolean(profileName && partnerNick && profileName === partnerNick && profileName !== myNick);

  if (profileName && !profileIsPartnerNick) return profileName;
  if (myNick) return myNick;

  const email = user.email?.trim();
  if (email) return email;
  return '已登入';
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
