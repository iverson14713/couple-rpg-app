import { LOVE_TASK_POOL, type LoveTaskTemplate } from '../data/loveTaskPool';
import { LOVE_TASK_POOL_CHEMISTRY } from '../data/loveTaskPoolChemistry';
import { LOVE_TASK_POOL_PRO } from '../data/loveTaskPoolPro';

const MIN_COUPLE_LEVEL_FOR_CHEMISTRY = 2;

/** 組裝今日戀愛任務抽選池（Lv.1 不含默契型） */
export function buildDailyLoveTaskPool(isPro: boolean, coupleLevel: number): LoveTaskTemplate[] {
  let pool: LoveTaskTemplate[] = [...LOVE_TASK_POOL];
  if (isPro) pool = [...pool, ...LOVE_TASK_POOL_PRO];
  if (coupleLevel >= MIN_COUPLE_LEVEL_FOR_CHEMISTRY) {
    pool = [...pool, ...LOVE_TASK_POOL_CHEMISTRY];
  }
  return pool;
}

export function isChemistryLoveTask(task: {
  templateId: string;
  kind?: 'standard' | 'chemistry';
}): boolean {
  return task.kind === 'chemistry' || task.templateId.startsWith('tp-chem-');
}
