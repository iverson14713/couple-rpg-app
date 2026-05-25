import { isLoveQuestDevMode } from './loveQuestDevMode';

/** @deprecated 使用 isLoveQuestDevMode */
export function isLoveQuestNotificationDebugEnabled(): boolean {
  return isLoveQuestDevMode();
}
