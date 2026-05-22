import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../../safeStorage';
import { CoupleSpaceProvider } from '../../coupleRpg/context/CoupleSpaceContext';
import { CoupleRpgNavProvider } from '../../coupleRpg/context/CoupleRpgNavContext';
import { LoveQuestProvider } from '../../coupleRpg/context/LoveQuestContext';
import { UserPlanProvider } from '../../coupleRpg/context/UserPlanContext';
import { AiToastProvider } from '../../coupleRpg/context/AiToastContext';
import { seedShowcaseLocalStorage, SHOWCASE_SEED_KEYS } from './showcaseSeed';

type Props = {
  children: ReactNode;
};

function backupShowcaseKeys(): Record<string, string | null> {
  const backup: Record<string, string | null> = {};
  for (const key of SHOWCASE_SEED_KEYS) {
    backup[key] = safeGetItem(key);
  }
  return backup;
}

function restoreShowcaseKeys(backup: Record<string, string | null>): void {
  for (const key of SHOWCASE_SEED_KEYS) {
    const v = backup[key];
    if (v === null) safeRemoveItem(key);
    else safeSetItem(key, v);
  }
}

/**
 * 與正式 App 相同 Provider 樹 + 展示用 localStorage 種子。
 * 離開 showcase 時還原使用者資料，避免假資料寫入正式 App。
 */
export function ShowcaseProviders({ children }: Props) {
  const backupRef = useRef<Record<string, string | null> | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    backupRef.current = backupShowcaseKeys();
    seedShowcaseLocalStorage();
    setReady(true);
    return () => {
      if (backupRef.current) restoreShowcaseKeys(backupRef.current);
    };
  }, []);

  if (!ready) return null;

  return (
    <CoupleSpaceProvider>
      <UserPlanProvider>
        <AiToastProvider>
          <LoveQuestProvider>
            <CoupleRpgNavProvider>{children}</CoupleRpgNavProvider>
          </LoveQuestProvider>
        </AiToastProvider>
      </UserPlanProvider>
    </CoupleSpaceProvider>
  );
}
