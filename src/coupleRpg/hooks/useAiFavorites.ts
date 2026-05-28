import { useCallback, useEffect, useState } from 'react';
import {
  AI_FAVORITES_CHANGED_EVENT,
  AI_FAVORITES_SYNC_STATUS_EVENT,
  loadAiFavoriteIds,
  retryAiFavoritesCloudSync,
  toggleAiFavorite,
} from '../storage/aiFavoritesStore';
import type { AiFavoritesSyncStatus } from '../storage/aiFavoritesStore';
import { STORAGE_USER_CHANGED_EVENT } from '../storage/storageSession';
import { useUserPlan } from '../context/UserPlanContext';

type SyncStatusDetail = {
  status: AiFavoritesSyncStatus;
  error: string | null;
};

export function useAiFavorites() {
  const { isPro, openUpgradeModal } = useUserPlan();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => loadAiFavoriteIds());
  const [syncState, setSyncState] = useState<SyncStatusDetail>({
    status: 'idle',
    error: null,
  });

  const sync = useCallback(() => {
    setFavoriteIds(loadAiFavoriteIds());
  }, []);

  useEffect(() => {
    sync();
    const onFavorites = () => sync();
    const onSyncStatus = (e: Event) => {
      const detail = (e as CustomEvent<SyncStatusDetail>).detail;
      if (detail) setSyncState(detail);
    };
    window.addEventListener(AI_FAVORITES_CHANGED_EVENT, onFavorites);
    window.addEventListener(AI_FAVORITES_SYNC_STATUS_EVENT, onSyncStatus);
    window.addEventListener(STORAGE_USER_CHANGED_EVENT, onFavorites);
    return () => {
      window.removeEventListener(AI_FAVORITES_CHANGED_EVENT, onFavorites);
      window.removeEventListener(AI_FAVORITES_SYNC_STATUS_EVENT, onSyncStatus);
      window.removeEventListener(STORAGE_USER_CHANGED_EVENT, onFavorites);
    };
  }, [sync]);

  const checkFavorite = useCallback((recordId: string) => favoriteIds.has(recordId), [favoriteIds]);

  const toggleFavorite = useCallback(
    (recordId: string): boolean | null => {
      if (!isPro) {
        openUpgradeModal('收藏喜歡的 AI 建議為 Pro 功能');
        return null;
      }
      const on = toggleAiFavorite(recordId);
      sync();
      return on;
    },
    [isPro, openUpgradeModal, sync]
  );

  const isLoading =
    syncState.status === 'loading' || syncState.status === 'syncing';

  return {
    isPro,
    favoriteIds,
    isFavorite: checkFavorite,
    toggleFavorite,
    refresh: sync,
    syncStatus: syncState.status,
    syncError: syncState.error,
    isLoadingFavorites: isLoading,
    retryFavoritesSync: retryAiFavoritesCloudSync,
  };
}
