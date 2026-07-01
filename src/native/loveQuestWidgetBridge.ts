import { registerPlugin } from '@capacitor/core';
import type { LoveQuestWidgetData } from '../utils/widgetSync';

export interface LoveQuestWidgetBridgePlugin {
  saveWidgetData(data: LoveQuestWidgetData): Promise<void>;
  reloadWidget(): Promise<void>;
}

const LoveQuestWidgetBridge = registerPlugin<LoveQuestWidgetBridgePlugin>('LoveQuestWidgetBridge', {
  web: () => import('./loveQuestWidgetBridge.web').then((m) => m.default),
});

export default LoveQuestWidgetBridge;
