import { saveLastDateItineraryAi } from '../../coupleRpg/storage/dateItineraryAiCache';
import { defaultDinnerData, saveDinner, saveTodayResult } from '../../coupleRpg/storage/dinnerStore';
import { defaultImportantDateReminders, saveImportantDateReminders } from '../../coupleRpg/storage/importantDateRemindersStore';
import { DEFAULT_EVENT_SETTINGS } from '../../coupleRpg/storage/importantDateReminderTypes';
import { todayKey } from '../../coupleRpg/lib/dates';
import { LQ_KEYS } from '../../coupleRpg/storage/keys';
import { saveJson } from '../../coupleRpg/storage/persist';
import { defaultTasksData, normalizeTasksShape, saveTasks } from '../../coupleRpg/storage/tasksStore';
import { EXP_PER_LEVEL_SEGMENT } from '../../coupleRpg/storage/rpgLogic';
import { SHOWCASE_DATE_AI_RECORD } from './showcaseDemoData';

/** 展示模式會暫時覆寫的 keys（離開 /showcase 後還原） */
export const SHOWCASE_SEED_KEYS = [
  LQ_KEYS.couple,
  LQ_KEYS.coupleExtended,
  LQ_KEYS.rpg,
  LQ_KEYS.dinner,
  LQ_KEYS.tasks,
  LQ_KEYS.importantDateReminders,
  LQ_KEYS.lastDateItineraryAi,
  LQ_KEYS.userPlan,
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function addDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

function annualYmdFromTodayOffset(days: number): string {
  const target = addDaysFromToday(days);
  return `2018-${target.slice(5)}`;
}

function todayMonthDayYmd(): string {
  const t = todayKey();
  return `2019-${t.slice(5)}`;
}

/** 同步寫入 localStorage，須在 LoveQuestProvider 首次 render 前執行 */
export function seedShowcaseLocalStorage(): void {
  if (typeof window === 'undefined') return;

  const today = todayKey();
  const in14 = annualYmdFromTodayOffset(14);
  const todayAnniversary = todayMonthDayYmd();

  saveJson(LQ_KEYS.couple, {
    nameA: '阿明',
    nameB: '小柔',
    emojiA: '💗',
    emojiB: '💙',
  });

  saveJson(LQ_KEYS.coupleExtended, {
    version: 1,
    updatedAt: new Date().toISOString(),
    myNickname: '阿明',
    partnerNickname: '小柔',
    myBirthday: '',
    partnerBirthday: annualYmdFromTodayOffset(30),
    relationshipStart: in14,
    weddingAnniversary: todayAnniversary,
    firstDate: '2020-05-20',
    customDates: [],
  });

  saveJson(LQ_KEYS.rpg, {
    heartPoints: 78,
    compatibility: 86,
    xp: 7 * EXP_PER_LEVEL_SEGMENT + 60,
    level: 8,
    houseworkPoints: 42,
    dateAchievements: 12,
    anniversaryAchievements: 3,
    loveCoins: 328,
    loginStreak: 5,
    lastLoginDate: today,
    rpgSchemaVersion: 2,
  });

  const dinner = saveTodayResult(defaultDinnerData(), '義式小館');
  saveDinner(dinner);

  const tasks = defaultTasksData();
  if (tasks.dailyTasks.length >= 2) {
    tasks.dailyTasks[0] = { ...tasks.dailyTasks[0], done: true };
    tasks.dailyTasks[1] = { ...tasks.dailyTasks[1], done: true };
  }
  saveTasks(normalizeTasksShape(tasks));

  saveImportantDateReminders({
    version: 1,
    byEventId: {
      wedding: { ...DEFAULT_EVENT_SETTINGS, offsets: [0, 1, 3, 7, 14, 30] },
      together: { ...DEFAULT_EVENT_SETTINGS, offsets: [14, 7, 3, 1, 0] },
      'partner-bd': { ...DEFAULT_EVENT_SETTINGS, offsets: [30, 14, 7, 3, 1, 0] },
    },
    dismissedAck: {},
  });

  saveLastDateItineraryAi(SHOWCASE_DATE_AI_RECORD);

  saveJson(LQ_KEYS.userPlan, 'free');
}
