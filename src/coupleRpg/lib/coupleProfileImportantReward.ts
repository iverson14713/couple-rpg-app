import type { CoupleExtendedProfile } from '../storage/coupleExtendedTypes';

const DATE_KEYS = [
  'myBirthday',
  'partnerBirthday',
  'relationshipStart',
  'weddingAnniversary',
  'firstDate',
] as const;

/**
 * 是否「新增／補齊」了首頁會用到的紀念日欄位（相對於儲存前），用於每日最多一次 RPG 獎勵。
 */
export function importantDatesKnowledgeIncreased(
  before: CoupleExtendedProfile,
  after: CoupleExtendedProfile
): boolean {
  for (const k of DATE_KEYS) {
    if (!before[k].trim() && after[k].trim()) return true;
  }
  if (after.customDates.length > before.customDates.length) return true;
  for (const na of after.customDates) {
    const ob = before.customDates.find((c) => c.id === na.id);
    if (!ob && na.date.trim()) return true;
    if (ob && !ob.date.trim() && na.date.trim()) return true;
  }
  return false;
}
