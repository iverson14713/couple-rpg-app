import { useCallback, useRef } from 'react';
import { isDevModeFeatureEnabled } from '../lib/devModeOverride';
import { useDevModeOptional } from '../context/DevModeContext';

const TAP_TARGET = 7;
const TAP_WINDOW_MS = 5000;

/** 連續點擊 7 次（間隔 ≤5s）觸發開發模式密碼視窗 */
export function useDevModeSecretTap() {
  const devMode = useDevModeOptional();
  const countRef = useRef(0);
  const lastTapRef = useRef(0);

  const onSecretTap = useCallback(() => {
    if (!isDevModeFeatureEnabled() || !devMode) return;
    const now = Date.now();
    if (countRef.current > 0 && now - lastTapRef.current > TAP_WINDOW_MS) {
      countRef.current = 0;
    }
    lastTapRef.current = now;
    countRef.current += 1;
    if (countRef.current >= TAP_TARGET) {
      countRef.current = 0;
      devMode.openPasswordModal();
    }
  }, [devMode]);

  return onSecretTap;
}
