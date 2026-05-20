import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadJson, saveJson } from '../storage/persist';
import { LQ_KEYS } from '../storage/keys';
import {
  getRecentHistory,
  getTodayDinner,
  loadDinner,
  pickRandomOption,
  saveDinner,
  saveTodayResult,
} from '../storage/dinnerStore';
import {
  completePending,
  getWeeklyStats,
  loadHousework,
  saveHousework,
  spinHousework,
} from '../storage/houseworkStore';
import { loadTasks, saveTasks, toggleLoveTask } from '../storage/tasksStore';
import { appendActivity, loadActivity } from '../storage/activityStore';
import {
  applyReward,
  defaultRpgState,
  REWARDS,
  rpgSnapshot,
  type RpgReward,
} from '../storage/rpgLogic';
import type {
  ActivityLogEntry,
  CoupleProfile,
  DinnerData,
  HouseworkData,
  PartnerId,
  RpgState,
  TasksData,
} from '../storage/types';
import type { WeeklyHouseworkStats } from '../storage/houseworkStore';
import { makeId } from '../lib/id';

const DEFAULT_COUPLE: CoupleProfile = {
  nameA: '小晴',
  nameB: '阿宇',
  emojiA: '💗',
  emojiB: '💙',
};

type LoveQuestContextValue = {
  couple: CoupleProfile;
  rpg: RpgState;
  rpgView: ReturnType<typeof rpgSnapshot>;
  dinner: DinnerData;
  todayDinner: ReturnType<typeof getTodayDinner>;
  dinnerHistory: ReturnType<typeof getRecentHistory>;
  housework: HouseworkData;
  weeklyStats: WeeklyHouseworkStats;
  tasks: TasksData;
  activity: ActivityLogEntry[];
  draftPick: string | null;
  spinning: boolean;
  addDinnerOption: (label: string) => void;
  removeDinnerOption: (id: string) => void;
  rollDinner: () => void;
  saveDinnerResult: (label?: string) => void;
  addHouseworkItem: (label: string, emoji?: string) => void;
  removeHouseworkItem: (id: string) => void;
  rollHousework: () => void;
  completeHouseworkSpin: () => void;
  clearHouseworkSpin: () => void;
  toggleTask: (id: string) => void;
  partnerName: (id: PartnerId) => string;
  partnerEmoji: (id: PartnerId) => string;
};

const LoveQuestContext = createContext<LoveQuestContextValue | null>(null);

function loadRpg(): RpgState {
  return loadJson(LQ_KEYS.rpg, defaultRpgState());
}

function saveRpg(state: RpgState): void {
  saveJson(LQ_KEYS.rpg, state);
}

function loadCouple(): CoupleProfile {
  return loadJson(LQ_KEYS.couple, DEFAULT_COUPLE);
}

export function LoveQuestProvider({ children }: { children: ReactNode }) {
  const [couple] = useState(loadCouple);
  const [rpg, setRpg] = useState(loadRpg);
  const [dinner, setDinner] = useState(loadDinner);
  const [housework, setHousework] = useState(loadHousework);
  const [tasks, setTasks] = useState(loadTasks);
  const [activity, setActivity] = useState(loadActivity);
  const [draftPick, setDraftPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const grantReward = useCallback((reward: RpgReward, log: string) => {
    setRpg((prev) => {
      const next = applyReward(prev, reward);
      saveRpg(next);
      return next;
    });
    setActivity(appendActivity(log));
  }, []);

  const addDinnerOption = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setDinner((prev) => {
      const next: DinnerData = {
        ...prev,
        options: [...prev.options, { id: makeId(), label: trimmed }],
      };
      saveDinner(next);
      return next;
    });
  }, []);

  const removeDinnerOption = useCallback((id: string) => {
    setDinner((prev) => {
      const next = { ...prev, options: prev.options.filter((o) => o.id !== id) };
      saveDinner(next);
      return next;
    });
  }, []);

  const rollDinner = useCallback(() => {
    setDinner((prev) => {
      const picked = pickRandomOption(prev.options);
      const label = picked?.label ?? null;
      queueMicrotask(() => setDraftPick(label));
      return prev;
    });
  }, []);

  const saveDinnerResult = useCallback(
    (label?: string) => {
      const choice = (label ?? draftPick)?.trim();
      if (!choice) return;
      setDinner((prev) => {
        const next = saveTodayResult(prev, choice);
        saveDinner(next);
        return next;
      });
      setDraftPick(null);
      grantReward(REWARDS.dinnerSaved, `今晚晚餐：${choice}`);
    },
    [draftPick, grantReward]
  );

  const addHouseworkItem = useCallback((label: string, emoji = '🏠') => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setHousework((prev) => {
      const next: HouseworkData = {
        ...prev,
        items: [...prev.items, { id: makeId(), label: trimmed, emoji }],
      };
      saveHousework(next);
      return next;
    });
  }, []);

  const removeHouseworkItem = useCallback((id: string) => {
    setHousework((prev) => {
      const next = {
        ...prev,
        items: prev.items.filter((i) => i.id !== id),
        pendingSpin: prev.pendingSpin?.taskId === id ? null : prev.pendingSpin,
      };
      saveHousework(next);
      return next;
    });
  }, []);

  const rollHousework = useCallback(() => {
    setSpinning(true);
    setTimeout(() => {
      setHousework((prev) => {
        const pending = spinHousework(prev.items);
        const next = { ...prev, pendingSpin: pending };
        saveHousework(next);
        return next;
      });
      setSpinning(false);
    }, 520);
  }, []);

  const completeHouseworkSpin = useCallback(() => {
    setHousework((prev) => {
      if (!prev.pendingSpin) return prev;
      const { data: next, completion } = completePending(prev, prev.pendingSpin);
      saveHousework(next);
      const name = completion.partner === 'A' ? couple.nameA : couple.nameB;
      grantReward(
        REWARDS.houseworkComplete,
        `${name} 完成「${completion.taskLabel}」家事 +10 分`
      );
      return next;
    });
  }, [couple.nameA, couple.nameB, grantReward]);

  const clearHouseworkSpin = useCallback(() => {
    setHousework((prev) => {
      const next = { ...prev, pendingSpin: null };
      saveHousework(next);
      return next;
    });
  }, []);

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const wasDone = prev.loveTasks.find((t) => t.id === id)?.done ?? false;
        const { data: next, task } = toggleLoveTask(prev, id);
        saveTasks(next);
        if (task?.done && !wasDone) {
          grantReward(REWARDS.loveTaskComplete, `完成戀愛任務「${task.label}」`);
        }
        return next;
      });
    },
    [grantReward]
  );

  const partnerName = useCallback(
    (id: PartnerId) => (id === 'A' ? couple.nameA : couple.nameB),
    [couple]
  );

  const partnerEmoji = useCallback(
    (id: PartnerId) => (id === 'A' ? couple.emojiA : couple.emojiB),
    [couple]
  );

  const value = useMemo<LoveQuestContextValue>(
    () => ({
      couple,
      rpg,
      rpgView: rpgSnapshot(rpg),
      dinner,
      todayDinner: getTodayDinner(dinner.history),
      dinnerHistory: getRecentHistory(dinner.history),
      housework,
      weeklyStats: getWeeklyStats(housework.completions),
      tasks,
      activity,
      draftPick,
      spinning,
      addDinnerOption,
      removeDinnerOption,
      rollDinner,
      saveDinnerResult,
      addHouseworkItem,
      removeHouseworkItem,
      rollHousework,
      completeHouseworkSpin,
      clearHouseworkSpin,
      toggleTask,
      partnerName,
      partnerEmoji,
    }),
    [
      couple,
      rpg,
      dinner,
      housework,
      tasks,
      activity,
      draftPick,
      spinning,
      addDinnerOption,
      removeDinnerOption,
      rollDinner,
      saveDinnerResult,
      addHouseworkItem,
      removeHouseworkItem,
      rollHousework,
      completeHouseworkSpin,
      clearHouseworkSpin,
      toggleTask,
      partnerName,
      partnerEmoji,
    ]
  );

  return <LoveQuestContext.Provider value={value}>{children}</LoveQuestContext.Provider>;
}

export function useLoveQuest(): LoveQuestContextValue {
  const ctx = useContext(LoveQuestContext);
  if (!ctx) throw new Error('useLoveQuest must be used within LoveQuestProvider');
  return ctx;
}
