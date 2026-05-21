import { makeId } from '../lib/id';
import type { HouseworkAssignedChore, HouseworkData, HouseworkItem } from './types';

const nowIso = () => new Date().toISOString();

export function touchHouseworkItem(item: HouseworkItem): HouseworkItem {
  return {
    ...item,
    updatedAt: nowIso(),
    localVersion: (item.localVersion ?? 0) + 1,
  };
}

export function touchAssignedChore(chore: HouseworkAssignedChore): HouseworkAssignedChore {
  return {
    ...chore,
    updatedAt: nowIso(),
    localVersion: (chore.localVersion ?? 0) + 1,
  };
}

/** 每次寫入 localStorage 前呼叫，遞增 syncRevision */
export function stampHouseworkData(data: HouseworkData): HouseworkData {
  const ts = nowIso();
  return {
    ...data,
    updatedAt: ts,
    syncRevision: (data.syncRevision ?? 0) + 1,
  };
}

/** 確保項目有穩定 id，補齊同步用時間戳 */
export function ensureHouseworkStableIds(data: HouseworkData): HouseworkData {
  const items = data.items.map((item) => {
    const id = item.id?.trim() || makeId();
    return {
      ...item,
      id,
      updatedAt: item.updatedAt ?? nowIso(),
      localVersion: item.localVersion ?? 0,
    };
  });

  const ta = data.todayAssignment;
  let todayAssignment = ta;
  if (ta) {
    const chores = ta.chores.map((c) => ({
      ...c,
      taskId: c.taskId?.trim() || c.taskId,
      updatedAt: c.updatedAt ?? nowIso(),
      localVersion: c.localVersion ?? 0,
    }));
    todayAssignment = {
      ...ta,
      updatedAt: ta.updatedAt ?? nowIso(),
      chores,
    };
  }

  return stampHouseworkData({ ...data, items, todayAssignment });
}
