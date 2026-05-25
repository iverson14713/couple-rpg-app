/** Active Supabase user id for localStorage scoping (null = guest / logged out). */
let activeStorageUserId: string | null = null;

export const STORAGE_USER_CHANGED_EVENT = 'lovequest-storage-user-changed';

export function getActiveStorageUserId(): string | null {
  return activeStorageUserId;
}

export function setActiveStorageUserId(userId: string | null): void {
  if (activeStorageUserId === userId) return;
  activeStorageUserId = userId;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_USER_CHANGED_EVENT, { detail: { userId } }));
  }
}

export function scopedStorageKey(baseKey: string, userId: string): string {
  return `${baseKey}-${userId}`;
}
