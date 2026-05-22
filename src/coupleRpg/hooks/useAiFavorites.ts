import { useCallback, useEffect, useState } from 'react';
import {
  AI_FAVORITES_CHANGED_EVENT,
  loadAiFavoriteIds,
  toggleAiFavorite,
} from '../storage/aiFavoritesStore';
import { useUserPlan } from '../context/UserPlanContext';

export function useAiFavorites() {
  const { isPro, openUpgradeModal } = useUserPlan();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => loadAiFavoriteIds());

  const sync = useCallback(() => {
    setFavoriteIds(loadAiFavoriteIds());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(AI_FAVORITES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AI_FAVORITES_CHANGED_EVENT, sync);
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

  return { isPro, favoriteIds, isFavorite: checkFavorite, toggleFavorite, refresh: sync };
}
