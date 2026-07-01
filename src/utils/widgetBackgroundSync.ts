import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { flushWidgetSnapshot } from './widgetSnapshotRegistry';

let initialized = false;

/** App 進入背景時同步 Widget 資料並 reload timeline */
export function initWidgetBackgroundSync(): void {
  if (initialized) return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
  initialized = true;

  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) return;
    void flushWidgetSnapshot({ forceReload: true });
  });
}
