/** Tracks recent local housework edits so background sync does not overwrite UI. */

const USER_EDITING_WINDOW_MS = 2500;

let lastLocalChangeAt = 0;
let hasLocalDirtyChanges = false;

export function markHouseworkLocalDirty(): void {
  lastLocalChangeAt = Date.now();
  hasLocalDirtyChanges = true;
}

export function touchHouseworkLocalChange(): void {
  markHouseworkLocalDirty();
}

export function isHouseworkUserEditing(now = Date.now()): boolean {
  return now - lastLocalChangeAt < USER_EDITING_WINDOW_MS;
}

export function hasHouseworkLocalDirty(): boolean {
  return hasLocalDirtyChanges;
}

export function clearHouseworkLocalDirty(): void {
  hasLocalDirtyChanges = false;
}

export function getHouseworkLastLocalChangeAt(): number {
  return lastLocalChangeAt;
}
