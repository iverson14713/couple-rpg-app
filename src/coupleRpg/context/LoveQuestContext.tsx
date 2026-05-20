import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { FLIRT_GAMES, type FlirtGameId } from '../data/flirtGames';
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
import {
  dailyTaskProgress,
  loadTasks,
  saveTasks,
  toggleDailyTask,
} from '../storage/tasksStore';
import {
  clearSession,
  isGameDoneToday,
  loadFlirtGames,
  markGameCompleted,
  rollGamePrompt,
  saveFlirtGames,
  startGameSession,
} from '../storage/flirtGamesStore';
import {
  appendCompletion,
  getRecentCompletions,
  loadCompletionHistory,
} from '../storage/completionHistoryStore';
import {
  completeCurrentDate,
  getFavoriteIdeas,
  getRecentDateHistory,
  loadDatePlanner,
  pickRandomDateIdea,
  saveDatePlanner,
  toggleFavorite,
} from '../storage/datePlannerStore';
import type { DateFilterKey, DatePlannerData } from '../storage/dateTypes';
import { DEFAULT_DATE_FILTERS } from '../storage/dateTypes';
import {
  acknowledgeReminder,
  addAnniversaryEvent,
  canRewardCelebrate,
  canRewardPlan,
  getActiveReminders,
  getNextImportant,
  getNextOccurrence,
  getUpcomingEvents,
  loadAnniversaries,
  markCelebrated,
  markPlanRewarded,
  occurrenceYear,
  removeAnniversaryEvent,
  saveAnniversaries,
  saveGiftSuggestions,
  savePlan,
  updateAnniversaryEvent,
  updateGiftPreferences,
} from '../storage/anniversaryStore';
import type { AnniversaryData, AnniversaryEventType, GiftPreferences } from '../storage/anniversaryTypes';
import { mockAnniversaryPlan } from '../data/mockAnniversaryPlans';
import { mockGiftSuggestions } from '../data/mockGiftSuggestions';
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
  CompletionRecord,
  CoupleProfile,
  DinnerData,
  FlirtGamesData,
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
  taskProgress: ReturnType<typeof dailyTaskProgress>;
  flirtGames: FlirtGamesData;
  flirtGameDefs: typeof FLIRT_GAMES;
  completionHistory: CompletionRecord[];
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
  toggleDailyTask: (id: string) => void;
  startFlirtGame: (gameId: FlirtGameId) => void;
  rerollFlirtPrompt: () => void;
  completeFlirtGame: () => void;
  cancelFlirtGame: () => void;
  isFlirtGameDoneToday: (gameId: FlirtGameId) => boolean;
  datePlanner: DatePlannerData;
  dateHistory: ReturnType<typeof getRecentDateHistory>;
  favoriteIdeas: ReturnType<typeof getFavoriteIdeas>;
  setDateFilter: (key: DateFilterKey, on: boolean) => void;
  clearDateFilters: () => void;
  generateDateIdea: () => boolean;
  toggleDateFavorite: (ideaId: string) => void;
  completeCurrentDate: () => void;
  anniversaries: AnniversaryData;
  upcomingAnniversaries: ReturnType<typeof getUpcomingEvents>;
  nextAnniversary: ReturnType<typeof getNextImportant>;
  activeAnniversaryReminders: ReturnType<typeof getActiveReminders>;
  addAnniversary: (input: {
    name: string;
    date: string;
    type: AnniversaryEventType;
    note: string;
    repeatYearly: boolean;
  }) => void;
  updateAnniversary: (
    id: string,
    input: Partial<{
      name: string;
      date: string;
      type: AnniversaryEventType;
      note: string;
      repeatYearly: boolean;
    }>
  ) => void;
  removeAnniversary: (id: string) => void;
  generateAnniversaryPlan: (eventId: string) => void;
  completeAnniversaryPlan: (eventId: string) => void;
  markAnniversaryCelebrated: (eventId: string) => void;
  updateGiftPrefs: (prefs: GiftPreferences) => void;
  generateGiftSuggestions: () => void;
  dismissAnniversaryReminder: (reminderId: string) => void;
  partnerName: (id: PartnerId) => string;
  partnerEmoji: (id: PartnerId) => string;
};

const LoveQuestContext = createContext<LoveQuestContextValue | null>(null);

function loadRpg(): RpgState {
  const raw = loadJson(LQ_KEYS.rpg, defaultRpgState());
  return {
    ...defaultRpgState(),
    ...raw,
    dateAchievements: raw.dateAchievements ?? 0,
    anniversaryAchievements: raw.anniversaryAchievements ?? 0,
  };
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
  const [flirtGames, setFlirtGames] = useState(loadFlirtGames);
  const [completionHistory, setCompletionHistory] = useState(loadCompletionHistory);
  const [datePlanner, setDatePlanner] = useState(loadDatePlanner);
  const [anniversaries, setAnniversaries] = useState(loadAnniversaries);
  const [activity, setActivity] = useState(loadActivity);
  const [draftPick, setDraftPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const taskProgress = useMemo(() => dailyTaskProgress(tasks.dailyTasks), [tasks.dailyTasks]);

  const grantReward = useCallback((reward: RpgReward, log: string) => {
    setRpg((prev) => {
      const next = applyReward(prev, reward);
      saveRpg(next);
      return next;
    });
    setActivity(appendActivity(log));
  }, []);

  const addCompletion = useCallback(
    (kind: CompletionRecord['kind'], title: string, emoji: string, meta?: { gameId?: FlirtGameId; detail?: string }) => {
      const next = appendCompletion(kind, title, emoji, meta);
      setCompletionHistory(next);
    },
    []
  );

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
      grantReward(REWARDS.houseworkComplete, `${name} 完成「${completion.taskLabel}」家事 +10 分`);
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

  const toggleDailyTaskFn = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const wasDone = prev.dailyTasks.find((t) => t.id === id)?.done ?? false;
        const { data: next, task } = toggleDailyTask(prev, id);
        saveTasks(next);
        if (task?.done && !wasDone) {
          grantReward(REWARDS.loveTaskComplete, `完成戀愛任務「${task.label}」`);
          addCompletion('task', task.label, task.emoji);
        }
        return next;
      });
    },
    [grantReward, addCompletion]
  );

  const startFlirtGame = useCallback((gameId: FlirtGameId) => {
    setFlirtGames((prev) => {
      const next = startGameSession(prev, gameId);
      saveFlirtGames(next);
      return next;
    });
  }, []);

  const rerollFlirtPrompt = useCallback(() => {
    setFlirtGames((prev) => {
      const gid = prev.activeSession?.gameId;
      if (!gid) return prev;
      const prompt = rollGamePrompt(gid, String(Date.now()));
      const next = {
        ...prev,
        activeSession: { ...prev.activeSession!, prompt },
      };
      saveFlirtGames(next);
      return next;
    });
  }, []);

  const completeFlirtGame = useCallback(() => {
    setFlirtGames((prev) => {
      const session = prev.activeSession;
      if (!session?.gameId) return prev;
      const gameId = session.gameId;
      const def = FLIRT_GAMES.find((g) => g.id === gameId);
      const alreadyDone = isGameDoneToday(prev, gameId);

      const next = markGameCompleted(prev, gameId);
      saveFlirtGames(next);

      if (!alreadyDone) {
        grantReward(REWARDS.flirtGameComplete, `完成小遊戲「${def?.title ?? gameId}」`);
      }
      addCompletion('game', def?.title ?? '曖昧小遊戲', def?.emoji ?? '🎮', {
        gameId,
        detail: session.prompt,
      });

      return next;
    });
  }, [grantReward, addCompletion]);

  const cancelFlirtGame = useCallback(() => {
    setFlirtGames((prev) => {
      const next = clearSession(prev);
      saveFlirtGames(next);
      return next;
    });
  }, []);

  const isFlirtGameDoneTodayFn = useCallback(
    (gameId: FlirtGameId) => isGameDoneToday(flirtGames, gameId),
    [flirtGames]
  );

  const setDateFilter = useCallback((key: DateFilterKey, on: boolean) => {
    setDatePlanner((prev) => {
      const next: DatePlannerData = {
        ...prev,
        filters: { ...prev.filters, [key]: on },
      };
      saveDatePlanner(next);
      return next;
    });
  }, []);

  const clearDateFilters = useCallback(() => {
    setDatePlanner((prev) => {
      const next: DatePlannerData = { ...prev, filters: DEFAULT_DATE_FILTERS() };
      saveDatePlanner(next);
      return next;
    });
  }, []);

  const generateDateIdea = useCallback(() => {
    let ok = false;
    setDatePlanner((prev) => {
      const suggestion = pickRandomDateIdea(prev.filters);
      if (!suggestion) return prev;
      ok = true;
      const next: DatePlannerData = { ...prev, current: suggestion };
      saveDatePlanner(next);
      return next;
    });
    return ok;
  }, []);

  const toggleDateFavoriteFn = useCallback((ideaId: string) => {
    setDatePlanner((prev) => {
      const next = toggleFavorite(prev, ideaId);
      saveDatePlanner(next);
      return next;
    });
  }, []);

  const completeCurrentDateFn = useCallback(() => {
    setDatePlanner((prev) => {
      const { data: next, entry } = completeCurrentDate(prev);
      if (!entry) return prev;
      saveDatePlanner(next);
      grantReward(REWARDS.dateComplete, `完成約會「${entry.title}」`);
      addCompletion('date', entry.title, entry.emoji);
      return next;
    });
  }, [grantReward, addCompletion]);

  const addAnniversaryFn = useCallback(
    (input: {
      name: string;
      date: string;
      type: AnniversaryEventType;
      note: string;
      repeatYearly: boolean;
    }) => {
      setAnniversaries((prev) => {
        const next = addAnniversaryEvent(prev, input);
        saveAnniversaries(next);
        return next;
      });
    },
    []
  );

  const updateAnniversaryFn = useCallback(
    (
      id: string,
      input: Partial<{
        name: string;
        date: string;
        type: AnniversaryEventType;
        note: string;
        repeatYearly: boolean;
      }>
    ) => {
      setAnniversaries((prev) => {
        const next = updateAnniversaryEvent(prev, id, input);
        saveAnniversaries(next);
        return next;
      });
    },
    []
  );

  const removeAnniversaryFn = useCallback((id: string) => {
    setAnniversaries((prev) => {
      const next = removeAnniversaryEvent(prev, id);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const generateAnniversaryPlanFn = useCallback((eventId: string) => {
    setAnniversaries((prev) => {
      const event = prev.events.find((e) => e.id === eventId);
      if (!event) return prev;
      const plan = mockAnniversaryPlan(event);
      const next = savePlan(prev, eventId, plan);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const completeAnniversaryPlanFn = useCallback(
    (eventId: string) => {
      setAnniversaries((prev) => {
        const event = prev.events.find((e) => e.id === eventId);
        if (!event) return prev;
        const occ = getNextOccurrence(event);
        const year = occurrenceYear(event, occ);
        if (!canRewardPlan(event, year)) return prev;
        const next = markPlanRewarded(prev, eventId, year);
        saveAnniversaries(next);
        grantReward(REWARDS.anniversaryPlanComplete, `完成「${event.name}」紀念日規劃`);
        addCompletion('anniversary', `${event.name} 規劃`, '✨');
        return next;
      });
    },
    [grantReward, addCompletion]
  );

  const markAnniversaryCelebratedFn = useCallback(
    (eventId: string) => {
      setAnniversaries((prev) => {
        const event = prev.events.find((e) => e.id === eventId);
        if (!event) return prev;
        const occ = getNextOccurrence(event);
        const year = occurrenceYear(event, occ);
        if (!canRewardCelebrate(event, year)) return prev;
        const next = markCelebrated(prev, eventId, year);
        saveAnniversaries(next);
        grantReward(REWARDS.anniversaryCelebrated, `慶祝「${event.name}」紀念日`);
        addCompletion('anniversary', `${event.name} 慶祝`, '🎉');
        return next;
      });
    },
    [grantReward, addCompletion]
  );

  const updateGiftPrefsFn = useCallback((prefs: GiftPreferences) => {
    setAnniversaries((prev) => {
      const next = updateGiftPreferences(prev, prefs);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const generateGiftSuggestionsFn = useCallback(() => {
    setAnniversaries((prev) => {
      const suggestions = mockGiftSuggestions(prev.giftPreferences);
      const next = saveGiftSuggestions(prev, suggestions);
      saveAnniversaries(next);
      return next;
    });
  }, []);

  const dismissAnniversaryReminderFn = useCallback((reminderId: string) => {
    setAnniversaries((prev) => {
      const next = acknowledgeReminder(prev, reminderId);
      saveAnniversaries(next);
      return next;
    });
  }, []);

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
      taskProgress,
      flirtGames,
      flirtGameDefs: FLIRT_GAMES,
      completionHistory: getRecentCompletions(completionHistory),
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
      toggleDailyTask: toggleDailyTaskFn,
      startFlirtGame,
      rerollFlirtPrompt,
      completeFlirtGame,
      cancelFlirtGame,
      isFlirtGameDoneToday: isFlirtGameDoneTodayFn,
      datePlanner,
      dateHistory: getRecentDateHistory(datePlanner.history),
      favoriteIdeas: getFavoriteIdeas(datePlanner.favoriteIds),
      setDateFilter,
      clearDateFilters,
      generateDateIdea,
      toggleDateFavorite: toggleDateFavoriteFn,
      completeCurrentDate: completeCurrentDateFn,
      anniversaries,
      upcomingAnniversaries: getUpcomingEvents(anniversaries.events, 20),
      nextAnniversary: getNextImportant(anniversaries.events),
      activeAnniversaryReminders: getActiveReminders(anniversaries),
      addAnniversary: addAnniversaryFn,
      updateAnniversary: updateAnniversaryFn,
      removeAnniversary: removeAnniversaryFn,
      generateAnniversaryPlan: generateAnniversaryPlanFn,
      completeAnniversaryPlan: completeAnniversaryPlanFn,
      markAnniversaryCelebrated: markAnniversaryCelebratedFn,
      updateGiftPrefs: updateGiftPrefsFn,
      generateGiftSuggestions: generateGiftSuggestionsFn,
      dismissAnniversaryReminder: dismissAnniversaryReminderFn,
      partnerName,
      partnerEmoji,
    }),
    [
      couple,
      rpg,
      dinner,
      housework,
      tasks,
      taskProgress,
      flirtGames,
      completionHistory,
      datePlanner,
      anniversaries,
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
      toggleDailyTaskFn,
      startFlirtGame,
      rerollFlirtPrompt,
      completeFlirtGame,
      cancelFlirtGame,
      isFlirtGameDoneTodayFn,
      setDateFilter,
      clearDateFilters,
      generateDateIdea,
      toggleDateFavoriteFn,
      completeCurrentDateFn,
      addAnniversaryFn,
      updateAnniversaryFn,
      removeAnniversaryFn,
      generateAnniversaryPlanFn,
      completeAnniversaryPlanFn,
      markAnniversaryCelebratedFn,
      updateGiftPrefsFn,
      generateGiftSuggestionsFn,
      dismissAnniversaryReminderFn,
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
