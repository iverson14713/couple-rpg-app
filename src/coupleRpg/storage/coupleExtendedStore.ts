import { LQ_KEYS } from './keys';
import { loadJson, saveJson } from './persist';
import type { CoupleExtendedProfile } from './coupleExtendedTypes';
import { defaultCoupleExtendedProfile } from './coupleExtendedTypes';

function sanitizeCustomDates(raw: unknown): CoupleExtendedProfile['customDates'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map((x) => ({
      id: typeof x.id === 'string' ? x.id : '',
      name: typeof x.name === 'string' ? x.name : '',
      date: typeof x.date === 'string' ? x.date : '',
      note: typeof x.note === 'string' ? x.note : '',
    }))
    .filter((x) => x.id.length > 0);
}

export function loadCoupleExtendedProfile(): CoupleExtendedProfile {
  const raw = loadJson<Partial<CoupleExtendedProfile> | null>(LQ_KEYS.coupleExtended, null);
  if (!raw || typeof raw !== 'object') return defaultCoupleExtendedProfile();
  return {
    ...defaultCoupleExtendedProfile(),
    ...raw,
    version: 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    customDates: sanitizeCustomDates(raw.customDates),
  };
}

export function stampCoupleExtendedProfile(data: CoupleExtendedProfile): CoupleExtendedProfile {
  return {
    ...defaultCoupleExtendedProfile(),
    ...data,
    version: 1,
    updatedAt: new Date().toISOString(),
    customDates: sanitizeCustomDates(data.customDates),
  };
}

export function saveCoupleExtendedProfile(data: CoupleExtendedProfile): void {
  saveJson(LQ_KEYS.coupleExtended, { ...data, version: 1 });
}
