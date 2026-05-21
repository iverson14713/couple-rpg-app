import { makeId } from '../lib/id';
import type { DinnerData, DinnerHistoryEntry, DinnerOption } from './types';

const nowIso = () => new Date().toISOString();

export function touchDinnerOption(option: DinnerOption): DinnerOption {
  return {
    ...option,
    updatedAt: nowIso(),
    localVersion: (option.localVersion ?? 0) + 1,
  };
}

export function touchDinnerHistoryEntry(entry: DinnerHistoryEntry): DinnerHistoryEntry {
  return {
    ...entry,
    updatedAt: nowIso(),
    localVersion: (entry.localVersion ?? 0) + 1,
  };
}

export function stampDinnerData(data: DinnerData): DinnerData {
  const ts = nowIso();
  return {
    ...data,
    updatedAt: ts,
    syncRevision: (data.syncRevision ?? 0) + 1,
  };
}

export function ensureDinnerStableIds(data: DinnerData): DinnerData {
  const options = data.options.map((opt) => {
    const id = opt.id?.trim() || makeId();
    return {
      ...opt,
      id,
      label: opt.label?.trim() || opt.label,
      isActive: opt.isActive !== false,
      updatedAt: opt.updatedAt ?? nowIso(),
      localVersion: opt.localVersion ?? 0,
    };
  });

  const history = data.history.map((h) => ({
    ...h,
    id: h.id?.trim() || makeId(),
    updatedAt: h.updatedAt ?? h.savedAt ?? nowIso(),
    localVersion: h.localVersion ?? 0,
  }));

  return stampDinnerData({ ...data, options, history });
}
