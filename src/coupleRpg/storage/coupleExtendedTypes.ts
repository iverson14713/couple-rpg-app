/** Extended couple profile (localStorage only; no Supabase yet). */
export type CustomImportantDate = {
  id: string;
  /** 顯示名稱，例如：第一次旅行 */
  name: string;
  /** YYYY-MM-DD */
  date: string;
  note: string;
};

export type CoupleExtendedProfile = {
  version: 1;
  /** ISO 8601 — 雲端合併用 */
  updatedAt: string;
  myNickname: string;
  partnerNickname: string;
  /** YYYY-MM-DD 或空字串 */
  myBirthday: string;
  partnerBirthday: string;
  relationshipStart: string;
  weddingAnniversary: string;
  firstDate: string;
  customDates: CustomImportantDate[];
};

export function defaultCoupleExtendedProfile(): CoupleExtendedProfile {
  return {
    version: 1,
    updatedAt: '',
    myNickname: '',
    partnerNickname: '',
    myBirthday: '',
    partnerBirthday: '',
    relationshipStart: '',
    weddingAnniversary: '',
    firstDate: '',
    customDates: [],
  };
}
