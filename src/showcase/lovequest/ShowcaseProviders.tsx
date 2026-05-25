import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../../safeStorage';
import { CoupleSpaceProvider } from '../../coupleRpg/context/CoupleSpaceContext';
import { CoupleRpgNavProvider } from '../../coupleRpg/context/CoupleRpgNavContext';
import { LoveQuestProvider } from '../../coupleRpg/context/LoveQuestContext';
import { UserPlanProvider } from '../../coupleRpg/context/UserPlanContext';
import { AiToastProvider } from '../../coupleRpg/context/AiToastContext';
import { AiUsageProvider } from '../../coupleRpg/hooks/useAiUsage';
import { clearLoveQuestUserData } from '../../coupleRpg/storage/clearLoveQuestStorage';
import {
  getActiveStorageUserId,
  scopedStorageKey,
  setActiveStorageUserId,
} from '../../coupleRpg/storage/storageSession';
import { seedShowcaseLocalStorage, SHOWCASE_SEED_KEYS } from './showcaseSeed';

/** 展示專用 storage userId（與真實登入帳號隔離） */
export const SHOWCASE_STORAGE_USER_ID = '__lq_showcase__';

type Props = {
  children: ReactNode;
};

type BackupState = {
  priorUserId: string | null;
  entries: Record<string, string | null>;
};

function keysToBackup(userId: string | null): string[] {
  const keys = new Set<string>();
  for (const base of SHOWCASE_SEED_KEYS) {
    keys.add(base);
    if (userId) keys.add(scopedStorageKey(base, userId));
  }
  return [...keys];
}

function backupShowcaseKeys(userId: string | null): Record<string, string | null> {
  const backup: Record<string, string | null> = {};
  for (const key of keysToBackup(userId)) {
    backup[key] = safeGetItem(key);
  }
  return backup;
}

function restoreShowcaseKeys(backup: Record<string, string | null>): void {
  for (const [key, v] of Object.entries(backup)) {
    if (v === null) safeRemoveItem(key);
    else safeSetItem(key, v);
  }
}

/**
 * 與正式 App 相同 Provider 樹 + 展示用 localStorage 種子。
 * 離開 showcase 時還原使用者資料，避免假資料寫入正式 App。
 */
export function ShowcaseProviders({ children }: Props) {
  const backupRef = useRef<BackupState | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const priorUserId = getActiveStorageUserId();
    backupRef.current = {
      priorUserId,
      entries: backupShowcaseKeys(priorUserId),
    };
    setActiveStorageUserId(SHOWCASE_STORAGE_USER_ID);
    seedShowcaseLocalStorage();
    setReady(true);
    return () => {
      clearLoveQuestUserData(SHOWCASE_STORAGE_USER_ID);
      if (backupRef.current) {
        restoreShowcaseKeys(backupRef.current.entries);
        setActiveStorageUserId(backupRef.current.priorUserId);
      } else {
        setActiveStorageUserId(null);
      }
    };
  }, []);

  if (!ready) return null;

  return (
    <CoupleSpaceProvider>
      <UserPlanProvider>
        <AiUsageProvider>
          <AiToastProvider>
            <LoveQuestProvider>
              <CoupleRpgNavProvider>{children}</CoupleRpgNavProvider>
            </LoveQuestProvider>
          </AiToastProvider>
        </AiUsageProvider>
      </UserPlanProvider>
    </CoupleSpaceProvider>
  );
}
