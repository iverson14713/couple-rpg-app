import type { LoveQuestWidgetData } from './widgetSync';
import { syncLoveQuestWidgetData } from './widgetSync';

type WidgetSnapshotProvider = () => LoveQuestWidgetData | null;

let snapshotProvider: WidgetSnapshotProvider | null = null;

export function registerWidgetSnapshotProvider(provider: WidgetSnapshotProvider | null): void {
  snapshotProvider = provider;
}

/** 將目前 App 狀態寫入 Widget 並請求 reload（iOS 不保證即時） */
export async function flushWidgetSnapshot(options?: { forceReload?: boolean }): Promise<void> {
  const data = snapshotProvider?.();
  if (!data) return;
  await syncLoveQuestWidgetData(data, options);
}
