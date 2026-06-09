import type { CoupleSpaceInfo } from '../services/coupleSpaceApi';
import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import { hasHomeImportantDatesConfigured } from './importantDates';

/** 與首頁 LoveQuest / CoupleSpace 同一套情侶狀態 */
export type CompanionshipActiveCouple = {
  coupleId: string | null;
  partnerUserId: string | null;
  isFullyBound: boolean;
  hasHomeCoupleProfile: boolean;
};

export function resolveCompanionshipActiveCouple(input: {
  space: CoupleSpaceInfo | null;
  currentUserId: string | null;
  coupleExtended: CoupleExtendedProfile;
}): CompanionshipActiveCouple {
  const coupleId = input.space?.coupleId ?? null;
  const isFullyBound = input.space?.isFullyBound ?? false;
  const partnerUserId =
    input.space && input.currentUserId
      ? (input.space.members.find((m) => m.userId !== input.currentUserId)?.userId ?? null)
      : null;
  const hasHomeCoupleProfile = hasHomeImportantDatesConfigured(input.coupleExtended);

  return { coupleId, partnerUserId, isFullyBound, hasHomeCoupleProfile };
}

/**
 * 可送出陪伴：與首頁一致 — 有情侶空間 + 伴侶 user id。
 * 首頁已設定戀愛天數（hasHomeCoupleProfile）時亦視為已綁定。
 */
export function canSendCompanionship(
  active: CompanionshipActiveCouple,
  currentUserId: string | null
): boolean {
  if (!currentUserId || !active.coupleId || !active.partnerUserId) return false;
  return active.isFullyBound || active.hasHomeCoupleProfile || Boolean(active.coupleId);
}

export function companionshipBindHint(
  active: CompanionshipActiveCouple,
  currentUserId: string | null
): string | null {
  if (!currentUserId) return '請先登入';
  if (!active.coupleId) return '請先綁定另一半';
  if (!active.partnerUserId) return '等待另一半加入情侶空間';
  if (!canSendCompanionship(active, currentUserId)) return '請先綁定另一半';
  return null;
}

export function logCompanionshipCoupleState(
  currentUserId: string | null,
  active: CompanionshipActiveCouple
): void {
  console.log('[companionship] couple state', {
    currentUserId,
    coupleId: active.coupleId,
    partnerId: active.partnerUserId,
    activeCouple: active,
  });
}
