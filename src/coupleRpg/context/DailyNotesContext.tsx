import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  DAILY_MEMORY_FREE_MONTHLY_LIMIT,
  DAILY_MEMORY_PRO_MONTHLY_LIMIT,
  todayNoteDateKey,
  yearMonthFromNoteDate,
} from '../lib/dailyNoteDates';
import { compressMemoryPhoto } from '../lib/dailyMemoryPhoto';
import {
  requestDailyNotePrompt,
  setDailyNotePromptListener,
} from '../lib/dailyNotePromptTrigger';
import {
  attachSignedPhotoUrls,
  fetchCoupleDailyNotes,
  fetchDailyMemoryQuota,
  memoryPhotoStoragePath,
  signDailyMemoryPhotoUrl,
  uploadDailyMemoryPhoto,
  upsertCoupleDailyMemory,
} from '../services/dailyNotesApi';
import {
  buildMemoryPromptSourceKey,
  clearDailyNotePromptDismiss,
  dismissDailyNotePrompt,
  isDailyNotePromptDismissed,
  loadDailyNotesCache,
  mergeDailyNotes,
  saveDailyNotesCache,
} from '../storage/dailyNotesStore';
import type {
  CoupleDailyNote,
  DailyMemoryPromptMode,
  DailyMemoryPromptRequest,
  DailyMemoryQuota,
  DailyMemorySourceType,
} from '../storage/dailyNotesTypes';
import { canUseUserStorage } from '../storage/storageGuard';
import { useCoupleSpace } from './CoupleSpaceContext';
import { useLoveQuest } from './LoveQuestContext';
import { useUserPlan } from './UserPlanContext';

export type DailyNoteSaveResult =
  | 'ok'
  | 'ok_photo_failed'
  | 'empty'
  | 'offline'
  | 'no_couple'
  | 'quota_free'
  | 'quota_pro'
  | 'error';

export type DailyMemorySaveInput = {
  noteDate: string;
  content: string;
  /** New photo file from picker; null = keep existing; undefined = no change intent */
  photoFile?: File | Blob | null;
  removePhoto?: boolean;
  sourceType?: DailyMemorySourceType | string | null;
  sourceId?: string | null;
  sourceMeta?: Record<string, unknown>;
};

type DailyNotesContextValue = {
  notes: CoupleDailyNote[];
  todayNote: CoupleDailyNote | null;
  todayNoteDate: string;
  loading: boolean;
  promptOpen: boolean;
  promptMode: DailyMemoryPromptMode;
  promptRequest: DailyMemoryPromptRequest | null;
  promptInitialContent: string;
  promptInitialPhotoUrl: string | null;
  canUseDailyNotes: boolean;
  quota: DailyMemoryQuota | null;
  refreshNotes: () => Promise<void>;
  saveNote: (input: DailyMemorySaveInput) => Promise<DailyNoteSaveResult>;
  openPrompt: (noteDate?: string) => void;
  openEditPrompt: (noteDate?: string) => void;
  closePrompt: () => void;
  dismissPrompt: () => void;
  openSupplementEdit: () => void;
};

const DailyNotesContext = createContext<DailyNotesContextValue | null>(null);

const PROMPT_DELAY_MS = 520;

export function DailyNotesProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const { space, hasMembership } = useCoupleSpace();
  const { isPro, openUpgradeModal } = useUserPlan();
  const { upcomingAnniversaries } = useLoveQuest();
  const isOnline = useOnlineStatus();
  const userId = auth.user?.id ?? null;
  const coupleId = space?.coupleId ?? null;

  const [notes, setNotes] = useState<CoupleDailyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<DailyMemoryPromptMode>('create');
  const [promptRequest, setPromptRequest] = useState<DailyMemoryPromptRequest | null>(null);
  const [quota, setQuota] = useState<DailyMemoryQuota | null>(null);
  const anniversaryCheckedRef = useRef<string | null>(null);

  const todayNoteDate = todayNoteDateKey();

  const canUseDailyNotes = Boolean(
    auth.configured && userId && coupleId && hasMembership && canUseUserStorage(userId)
  );

  const persistCache = useCallback(
    (nextNotes: CoupleDailyNote[]) => {
      if (!userId || !coupleId) return;
      saveDailyNotesCache(userId, {
        coupleId,
        notes: nextNotes.map(({ photoUrl: _u, ...rest }) => rest),
        syncedAt: new Date().toISOString(),
      });
    },
    [coupleId, userId]
  );

  const applyNotes = useCallback(
    (nextNotes: CoupleDailyNote[]) => {
      setNotes(nextNotes);
      persistCache(nextNotes);
    },
    [persistCache]
  );

  const refreshQuota = useCallback(async () => {
    if (!canUseDailyNotes || !auth.supabase || !coupleId) return;
    try {
      const q = await fetchDailyMemoryQuota(
        auth.supabase,
        coupleId,
        yearMonthFromNoteDate(todayNoteDate),
        isPro
      );
      setQuota(q);
    } catch (e) {
      console.warn('[daily-memory quota]', e);
      setQuota({
        yearMonth: yearMonthFromNoteDate(todayNoteDate),
        used: 0,
        limit: isPro ? DAILY_MEMORY_PRO_MONTHLY_LIMIT : DAILY_MEMORY_FREE_MONTHLY_LIMIT,
        remaining: isPro ? DAILY_MEMORY_PRO_MONTHLY_LIMIT : DAILY_MEMORY_FREE_MONTHLY_LIMIT,
      });
    }
  }, [auth.supabase, canUseDailyNotes, coupleId, isPro, todayNoteDate]);

  const refreshNotes = useCallback(async () => {
    if (!canUseDailyNotes || !auth.supabase || !coupleId) return;
    setLoading(true);
    try {
      const remote = await fetchCoupleDailyNotes(auth.supabase, coupleId);
      const withUrls = await attachSignedPhotoUrls(auth.supabase, remote);
      const local = loadDailyNotesCache(userId);
      const merged =
        local.coupleId === coupleId ? mergeDailyNotes(local.notes, withUrls) : withUrls;
      applyNotes(merged);
      await refreshQuota();
    } catch (e) {
      console.warn('[daily-memory refresh]', e);
      const local = loadDailyNotesCache(userId);
      if (local.coupleId === coupleId && local.notes.length > 0) {
        setNotes(local.notes);
      }
    } finally {
      setLoading(false);
    }
  }, [applyNotes, auth.supabase, canUseDailyNotes, coupleId, refreshQuota, userId]);

  useEffect(() => {
    if (!userId || !coupleId) {
      setNotes([]);
      return;
    }
    const local = loadDailyNotesCache(userId);
    if (local.coupleId === coupleId) setNotes(local.notes);
    if (canUseDailyNotes && isOnline) void refreshNotes();
  }, [userId, coupleId, canUseDailyNotes, isOnline, refreshNotes]);

  const todayNote = useMemo(
    () => notes.find((n) => n.noteDate === todayNoteDate) ?? null,
    [notes, todayNoteDate]
  );

  const promptNoteDate = promptRequest?.noteDate ?? null;

  const promptInitialContent = useMemo(() => {
    if (!promptNoteDate) return '';
    return notes.find((n) => n.noteDate === promptNoteDate)?.content ?? '';
  }, [notes, promptNoteDate]);

  const promptInitialPhotoUrl = useMemo(() => {
    if (!promptNoteDate) return null;
    return notes.find((n) => n.noteDate === promptNoteDate)?.photoUrl ?? null;
  }, [notes, promptNoteDate]);

  const openCreatePrompt = useCallback(
    (request: DailyMemoryPromptRequest) => {
      if (!canUseDailyNotes) return;
      setPromptRequest(request);
      setPromptMode('create');
      setPromptOpen(true);
    },
    [canUseDailyNotes]
  );

  const openSupplementPrompt = useCallback(
    (request: DailyMemoryPromptRequest) => {
      if (!canUseDailyNotes) return;
      setPromptRequest(request);
      setPromptMode('supplement');
      setPromptOpen(true);
    },
    [canUseDailyNotes]
  );

  const openEditPrompt = useCallback(
    (noteDate = todayNoteDate) => {
      if (!canUseDailyNotes) return;
      setPromptRequest({
        noteDate,
        sourceType: 'custom',
        title: '❤️ 留下今天',
        body: '可以補充文字或照片。',
      });
      setPromptMode('edit');
      setPromptOpen(true);
    },
    [canUseDailyNotes, todayNoteDate]
  );

  const openPrompt = useCallback(
    (noteDate = todayNoteDate) => {
      openEditPrompt(noteDate);
    },
    [openEditPrompt, todayNoteDate]
  );

  const openSupplementEdit = useCallback(() => {
    if (!promptRequest) return;
    setPromptMode('edit');
  }, [promptRequest]);

  const closePrompt = useCallback(() => {
    setPromptOpen(false);
    setPromptRequest(null);
    setPromptMode('create');
  }, []);

  const dismissPrompt = useCallback(() => {
    if (userId && coupleId && promptRequest) {
      const key = buildMemoryPromptSourceKey(
        coupleId,
        promptRequest.noteDate,
        promptRequest.sourceType,
        promptRequest.sourceId
      );
      dismissDailyNotePrompt(userId, key);
    }
    closePrompt();
  }, [closePrompt, coupleId, promptRequest, userId]);

  const maybeOpenPrompt = useCallback(
    (request: DailyMemoryPromptRequest) => {
      if (!canUseDailyNotes || !coupleId || !userId) return;

      const sourceKey = buildMemoryPromptSourceKey(
        coupleId,
        request.noteDate,
        request.sourceType,
        request.sourceId
      );
      if (isDailyNotePromptDismissed(userId, sourceKey)) return;

      const local = loadDailyNotesCache(userId);
      const existing =
        local.coupleId === coupleId
          ? local.notes.find((n) => n.noteDate === request.noteDate)
          : notes.find((n) => n.noteDate === request.noteDate);

      window.setTimeout(() => {
        if (existing) openSupplementPrompt(request);
        else openCreatePrompt(request);
      }, PROMPT_DELAY_MS);
    },
    [canUseDailyNotes, coupleId, notes, openCreatePrompt, openSupplementPrompt, userId]
  );

  useEffect(() => {
    setDailyNotePromptListener(maybeOpenPrompt);
    return () => setDailyNotePromptListener(null);
  }, [maybeOpenPrompt]);

  // Anniversary-day prompt (once per event per day; prefer after 20:00 or first open)
  useEffect(() => {
    if (!canUseDailyNotes || !coupleId || !userId) return;
    if (anniversaryCheckedRef.current === todayNoteDate) return;

    const todays = upcomingAnniversaries.filter((u) => u.daysUntil === 0);
    if (todays.length === 0) {
      anniversaryCheckedRef.current = todayNoteDate;
      return;
    }

    // Once per event per day (dismiss key includes sourceId). First app open of the day is enough.
    anniversaryCheckedRef.current = todayNoteDate;
    const event = todays[0];
    const request: DailyMemoryPromptRequest = {
      noteDate: todayNoteDate,
      sourceType: 'anniversary',
      sourceId: event.event.id,
      sourceMeta: { name: event.event.name, type: event.event.type },
      title: '❤️ 留下今天',
      body: `今天是「${event.event.name}」，要不要把今天的小回憶留下來？`,
      supplementTitle: '❤️ 今天是重要日子',
      supplementBody: '要不要補充今天的小回憶？',
    };
    window.setTimeout(() => maybeOpenPrompt(request), 1200);
  }, [
    canUseDailyNotes,
    coupleId,
    maybeOpenPrompt,
    todayNoteDate,
    upcomingAnniversaries,
    userId,
  ]);

  const saveNote = useCallback(
    async (input: DailyMemorySaveInput): Promise<DailyNoteSaveResult> => {
      const content = input.content.trim() || null;
      const removePhoto = input.removePhoto === true;
      const hasNewPhoto = input.photoFile instanceof Blob;
      const existing = notes.find((n) => n.noteDate === input.noteDate) ?? null;
      const willHavePhoto =
        hasNewPhoto || (!removePhoto && Boolean(existing?.photoPath));

      if (!content && !willHavePhoto) return 'empty';
      if (!canUseDailyNotes || !auth.supabase || !coupleId || !userId) {
        return coupleId ? 'offline' : 'no_couple';
      }
      if (!isOnline) return 'offline';

      const isNewDate = !existing;

      try {
        let photoPath: string | null | undefined = undefined;
        let photoWidth: number | null | undefined = undefined;
        let photoHeight: number | null | undefined = undefined;
        let clearPhoto = removePhoto && !hasNewPhoto;
        let photoFailed = false;

        if (hasNewPhoto && input.photoFile) {
          try {
            const compressed = await compressMemoryPhoto(input.photoFile);
            const path = memoryPhotoStoragePath(coupleId, input.noteDate, compressed.ext);
            await uploadDailyMemoryPhoto(auth.supabase, path, compressed.blob);
            photoPath = path;
            photoWidth = compressed.width;
            photoHeight = compressed.height;
            clearPhoto = false;
          } catch (photoErr) {
            console.warn('[daily-memory photo upload]', photoErr);
            photoFailed = true;
            if (!content && !existing?.photoPath) {
              return 'error';
            }
          }
        }

        if (photoFailed && !content && !existing?.content && !existing?.photoPath) {
          return 'error';
        }

        const saved = await upsertCoupleDailyMemory(auth.supabase, {
          coupleId,
          memoryDate: input.noteDate,
          content,
          clearPhoto,
          photoPath,
          photoWidth,
          photoHeight,
          sourceType: input.sourceType ?? promptRequest?.sourceType ?? null,
          sourceId: input.sourceId ?? promptRequest?.sourceId ?? null,
          sourceMeta: input.sourceMeta ?? promptRequest?.sourceMeta ?? {},
          isPro,
        });

        const photoUrl = await signDailyMemoryPhotoUrl(auth.supabase, saved.photoPath);

        const withUrl = { ...saved, photoUrl };
        const without = notes.filter((n) => n.noteDate !== input.noteDate);
        applyNotes([withUrl, ...without].sort((a, b) => b.noteDate.localeCompare(a.noteDate)));

        if (promptRequest) {
          clearDailyNotePromptDismiss(
            userId,
            buildMemoryPromptSourceKey(
              coupleId,
              promptRequest.noteDate,
              promptRequest.sourceType,
              promptRequest.sourceId
            )
          );
        }
        closePrompt();
        void refreshQuota();

        if (photoFailed) return 'ok_photo_failed';
        return 'ok';
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[daily-memory save]', e);
        if (msg.includes('quota_exceeded')) {
          if (isNewDate) {
            if (isPro) return 'quota_pro';
            openUpgradeModal(
              '❤️ 這個月的故事書已經寫滿了。\n升級 LoveQuest Pro，繼續留下更多屬於你們的回憶。'
            );
            return 'quota_free';
          }
        }
        if (msg.includes('empty_content')) return 'empty';
        return 'error';
      }
    },
    [
      applyNotes,
      auth.supabase,
      canUseDailyNotes,
      closePrompt,
      coupleId,
      isOnline,
      isPro,
      notes,
      openUpgradeModal,
      promptRequest,
      refreshQuota,
      userId,
    ]
  );

  const value = useMemo(
    () => ({
      notes,
      todayNote,
      todayNoteDate,
      loading,
      promptOpen,
      promptMode,
      promptRequest,
      promptInitialContent,
      promptInitialPhotoUrl,
      canUseDailyNotes,
      quota,
      refreshNotes,
      saveNote,
      openPrompt,
      openEditPrompt,
      closePrompt,
      dismissPrompt,
      openSupplementEdit,
    }),
    [
      notes,
      todayNote,
      todayNoteDate,
      loading,
      promptOpen,
      promptMode,
      promptRequest,
      promptInitialContent,
      promptInitialPhotoUrl,
      canUseDailyNotes,
      quota,
      refreshNotes,
      saveNote,
      openPrompt,
      openEditPrompt,
      closePrompt,
      dismissPrompt,
      openSupplementEdit,
    ]
  );

  return <DailyNotesContext.Provider value={value}>{children}</DailyNotesContext.Provider>;
}

export function useDailyNotes() {
  const ctx = useContext(DailyNotesContext);
  if (!ctx) throw new Error('useDailyNotes must be used within DailyNotesProvider');
  return ctx;
}

export { requestDailyNotePrompt };
