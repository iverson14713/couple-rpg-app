import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Heart, RefreshCw } from 'lucide-react';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { makeId } from '../lib/id';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { CoupleExtendedProfile, CustomImportantDate } from '../storage/coupleExtendedTypes';
import { defaultCoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import { DatePickerField } from './DatePickerField';
import { lq } from '../theme';

const COUPLE_PROFILE_ANCHOR_ID = 'lq-couple-profile';

type ProfileFieldKey =
  | 'myNickname'
  | 'partnerNickname'
  | 'myBirthday'
  | 'partnerBirthday'
  | 'relationshipStart'
  | 'weddingAnniversary'
  | 'firstDate';

function isCustomDateComplete(c: CustomImportantDate): boolean {
  return Boolean(c.name.trim() && c.date.trim());
}

function onlyCompleteCustomDates(list: CustomImportantDate[]): CustomImportantDate[] {
  return list.filter(isCustomDateComplete);
}

/** 1989 / 11 / 12 */
function formatDisplayDateYmd(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  return `${m[1]} / ${m[2]} / ${m[3]}`;
}

const SYNC_STATUS_LABEL = {
  local: '本機保存',
  syncing: '同步中',
  synced: '已同步',
  error: '同步失敗，稍後再試',
} as const;

const inputClass =
  'w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-[14px] font-semibold text-stone-800 placeholder:text-stone-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100';

export function CoupleDetailsSection() {
  const {
    coupleExtended,
    setCoupleExtendedProfile,
    coupleProfileSyncStatus,
    coupleProfileSyncError,
    syncCoupleProfile,
  } = useLoveQuest();
  const { isFullyBound } = useCoupleSpace();
  const { pendingScrollElementId, acknowledgePendingScroll } = useCoupleRpgNav();
  const [draft, setDraft] = useState<CoupleExtendedProfile>(() => ({
    ...defaultCoupleExtendedProfile(),
    ...coupleExtended,
    customDates: onlyCompleteCustomDates(
      Array.isArray(coupleExtended?.customDates) ? coupleExtended.customDates : []
    ),
  }));
  const [editingField, setEditingField] = useState<ProfileFieldKey | null>(null);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const draftDirtyRef = useRef(false);

  const coupleSyncHint = isFullyBound
    ? '你們的情侶空間將一起同步這些資料'
    : '綁定另一半後，對方也能看到這些資料';

  const statusLabel =
    SYNC_STATUS_LABEL[coupleProfileSyncStatus as keyof typeof SYNC_STATUS_LABEL] ??
    SYNC_STATUS_LABEL.local;
  const showSyncing = coupleProfileSyncStatus === 'syncing' || syncingManual;

  const handleManualSync = useCallback(async () => {
    setSyncingManual(true);
    try {
      await syncCoupleProfile();
    } finally {
      setSyncingManual(false);
    }
  }, [syncCoupleProfile]);

  useEffect(() => {
    if (draftDirtyRef.current) return;
    setDraft({
      ...defaultCoupleExtendedProfile(),
      ...coupleExtended,
      customDates: onlyCompleteCustomDates(
        Array.isArray(coupleExtended?.customDates) ? coupleExtended.customDates : []
      ),
    });
    setEditingField(null);
    setEditingCustomId(null);
  }, [coupleExtended]);

  useLayoutEffect(() => {
    if (pendingScrollElementId !== COUPLE_PROFILE_ANCHOR_ID) return;
    acknowledgePendingScroll();
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pendingScrollElementId, acknowledgePendingScroll]);

  const markDraftDirty = useCallback(() => {
    draftDirtyRef.current = true;
  }, []);

  const updateDraft = useCallback(
    (patch: Partial<CoupleExtendedProfile>) => {
      markDraftDirty();
      setDraft((prev) => ({ ...prev, ...patch }));
    },
    [markDraftDirty]
  );

  const startEditField = useCallback((key: ProfileFieldKey) => {
    setEditingCustomId(null);
    setEditingField(key);
  }, []);

  const finishEditField = useCallback(() => {
    setEditingField(null);
  }, []);

  const incompleteCustom = useMemo(
    () => draft.customDates.find((c) => !isCustomDateComplete(c)) ?? null,
    [draft.customDates]
  );
  const canAddCustom = !incompleteCustom;

  const addCustomDate = useCallback(() => {
    if (!canAddCustom) return;
    const id = makeId();
    markDraftDirty();
    setEditingField(null);
    setDraft((prev) => ({
      ...prev,
      customDates: [...prev.customDates, { id, name: '', date: '', note: '' }],
    }));
    setEditingCustomId(id);
  }, [canAddCustom, markDraftDirty]);

  const updateCustom = useCallback(
    (id: string, patch: Partial<CustomImportantDate>) => {
      markDraftDirty();
      setDraft((prev) => ({
        ...prev,
        customDates: prev.customDates.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [markDraftDirty]
  );

  const removeCustom = useCallback(
    (id: string) => {
      markDraftDirty();
      setDraft((prev) => ({
        ...prev,
        customDates: prev.customDates.filter((c) => c.id !== id),
      }));
      setEditingCustomId((cur) => (cur === id ? null : cur));
    },
    [markDraftDirty]
  );

  const finishEditingCustom = useCallback(
    (id: string) => {
      const item = draft.customDates.find((c) => c.id === id);
      if (!item) {
        setEditingCustomId(null);
        return;
      }
      if (!isCustomDateComplete(item)) return;
      setEditingCustomId(null);
    },
    [draft.customDates]
  );

  const onSave = useCallback(() => {
    const cleaned = {
      ...defaultCoupleExtendedProfile(),
      ...draft,
      customDates: onlyCompleteCustomDates(draft.customDates),
    };
    setDraft(cleaned);
    setEditingField(null);
    setEditingCustomId(null);
    setCoupleExtendedProfile(cleaned);
    draftDirtyRef.current = false;
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2800);
  }, [draft, setCoupleExtendedProfile]);

  return (
    <section ref={sectionRef} id={COUPLE_PROFILE_ANCHOR_ID} className="mb-5 space-y-5">
      <header className="px-0.5">
        <div className="flex items-start gap-2">
          <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-extrabold text-stone-900">💑 情侶資料</h2>
            <p className="mt-0.5 text-[12px] font-semibold text-stone-500">
              基本資料 · 紀念日 · 自訂日子
            </p>
            <p className="mt-1 text-[11px] font-semibold text-violet-700/90">{coupleSyncHint}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-rose-100/70">
          <div className="flex min-w-0 items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5 shrink-0 text-stone-500" aria-hidden />
            <span className="text-[11px] font-semibold text-stone-600">{statusLabel}</span>
            {showSyncing ? (
              <RefreshCw className="h-3 w-3 animate-spin text-rose-500" aria-hidden />
            ) : null}
          </div>
          {isFullyBound ? (
            <button
              type="button"
              disabled={showSyncing}
              onClick={() => void handleManualSync()}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100 active:scale-[0.98] disabled:opacity-50"
            >
              同步情侶資料
            </button>
          ) : null}
        </div>
        {coupleProfileSyncError ? (
          <p className="mt-2 text-[10px] font-semibold text-amber-800">{coupleProfileSyncError}</p>
        ) : null}
      </header>

      {/* 基本資料 */}
      <ProfileSection title="👫 基本資料" hint="你們在 App 裡的稱呼">
        <ProfileTextCard
          icon="😊"
          label="我的暱稱"
          value={draft.myNickname}
          placeholder="你的名字"
          editing={editingField === 'myNickname'}
          onStartEdit={() => startEditField('myNickname')}
          onChange={(v) => updateDraft({ myNickname: v })}
          onDone={finishEditField}
          theme="soft"
        />
        <ProfileTextCard
          icon="💕"
          label="另一半暱稱"
          value={draft.partnerNickname}
          placeholder="對方的名字"
          editing={editingField === 'partnerNickname'}
          onStartEdit={() => startEditField('partnerNickname')}
          onChange={(v) => updateDraft({ partnerNickname: v })}
          onDone={finishEditField}
          theme="pink"
        />
      </ProfileSection>

      {/* 重要紀念日 */}
      <ProfileSection title="🎂 重要紀念日" hint="內建日子，點一下即可設定或修改">
        <ProfileDateCard
          icon="🎂"
          label="我的生日"
          value={draft.myBirthday}
          editing={editingField === 'myBirthday'}
          onStartEdit={() => startEditField('myBirthday')}
          onChange={(ymd) => updateDraft({ myBirthday: ymd })}
          onDone={finishEditField}
          theme="cream"
        />
        <ProfileDateCard
          icon="🎂"
          label="另一半生日"
          value={draft.partnerBirthday}
          editing={editingField === 'partnerBirthday'}
          onStartEdit={() => startEditField('partnerBirthday')}
          onChange={(ymd) => updateDraft({ partnerBirthday: ymd })}
          onDone={finishEditField}
          theme="cream"
        />
        <ProfileDateCard
          icon="💕"
          label="在一起紀念日"
          value={draft.relationshipStart}
          editing={editingField === 'relationshipStart'}
          onStartEdit={() => startEditField('relationshipStart')}
          onChange={(ymd) => updateDraft({ relationshipStart: ymd })}
          onDone={finishEditField}
          theme="pink"
        />
        <ProfileDateCard
          icon="💍"
          label="結婚紀念日"
          value={draft.weddingAnniversary}
          editing={editingField === 'weddingAnniversary'}
          onStartEdit={() => startEditField('weddingAnniversary')}
          onChange={(ymd) => updateDraft({ weddingAnniversary: ymd })}
          onDone={finishEditField}
          theme="gold"
          optional
        />
        <ProfileDateCard
          icon="☕"
          label="第一次約會"
          value={draft.firstDate}
          editing={editingField === 'firstDate'}
          onStartEdit={() => startEditField('firstDate')}
          onChange={(ymd) => updateDraft({ firstDate: ymd })}
          onDone={finishEditField}
          theme="sky"
          optional
        />
      </ProfileSection>

      {/* 自訂重要日子 */}
      <ProfileSection
        title="✨ 自訂重要日子"
        hint="旅行、牽手日、第一次見面… 一次新增一筆"
      >
        {draft.customDates.length === 0 ? (
          <p className="px-1 py-2 text-center text-[12px] font-semibold text-stone-400">
            還沒有自訂日子
          </p>
        ) : (
          <ul className="space-y-2">
            {draft.customDates.map((c) => {
              const complete = isCustomDateComplete(c);
              const editing = editingCustomId === c.id || !complete;

              if (!editing) {
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingField(null);
                        setEditingCustomId(c.id);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-50/90 via-white to-violet-50/50 px-3.5 py-3.5 text-left shadow-sm active:scale-[0.99]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-xl">
                        🎁
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-extrabold text-stone-900">{c.name}</p>
                        <p className="mt-0.5 text-[13px] font-semibold tracking-wide text-rose-600/90">
                          {formatDisplayDateYmd(c.date)}
                        </p>
                        {c.note.trim() ? (
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-stone-400">
                            {c.note.trim()}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-[11px] font-bold text-stone-400">編輯</span>
                    </button>
                  </li>
                );
              }

              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3.5 shadow-sm ring-1 ring-rose-100/60"
                >
                  {!complete ? (
                    <p className="mb-2 text-[11px] font-bold text-rose-600">新增中 · 請填寫名稱與日期</p>
                  ) : (
                    <p className="mb-2 text-[11px] font-bold text-stone-500">編輯</p>
                  )}
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCustom(c.id, { name: e.target.value })}
                    placeholder="名稱（例如：第一次旅行）"
                    className={`${inputClass} mb-2`}
                    autoFocus={!complete}
                  />
                  <DatePickerField
                    value={c.date}
                    onChange={(ymd) => updateCustom(c.id, { date: ymd })}
                    label="日期"
                    className="mb-2"
                  />
                  <input
                    type="text"
                    value={c.note}
                    onChange={(e) => updateCustom(c.id, { note: e.target.value })}
                    placeholder="備註（選填）"
                    className={`${inputClass} mb-2.5`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => removeCustom(c.id)}
                      className="rounded-xl px-3 py-2 text-[12px] font-bold text-stone-500 active:opacity-70"
                    >
                      移除
                    </button>
                    <button
                      type="button"
                      disabled={!isCustomDateComplete(c)}
                      onClick={() => finishEditingCustom(c.id)}
                      className="min-h-[44px] flex-1 rounded-xl bg-rose-500 py-2 text-[13px] font-extrabold text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      完成
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={addCustomDate}
          disabled={!canAddCustom}
          className="flex min-h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-[14px] font-extrabold text-white shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500 disabled:shadow-none"
        >
          {canAddCustom ? '➕ 新增重要日子' : '請先完成目前資料'}
        </button>
      </ProfileSection>

      <div className="flex flex-col items-stretch gap-2 px-0.5 pb-1">
        <button
          type="button"
          onClick={onSave}
          className="min-h-[50px] rounded-2xl bg-rose-600 text-[15px] font-extrabold text-white shadow-sm active:scale-[0.99]"
        >
          儲存資料
        </button>
        {savedFlash ? (
          <p className="text-center text-[12px] font-semibold text-emerald-600" role="status">
            {isFullyBound
              ? coupleProfileSyncStatus === 'synced'
                ? '已儲存並同步至情侶空間'
                : coupleProfileSyncStatus === 'syncing'
                  ? '已儲存，正在同步…'
                  : '已儲存到本機'
              : '已儲存到本機'}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ProfileSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 px-0.5">
        <h3 className="text-[14px] font-extrabold text-stone-900">{title}</h3>
        {hint ? <p className="mt-0.5 text-[11px] font-semibold text-stone-500">{hint}</p> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

type CardTheme = 'pink' | 'cream' | 'gold' | 'sky' | 'soft';

const CARD_THEME: Record<CardTheme, { card: string; icon: string; accent: string }> = {
  pink: {
    card: 'border-rose-100/80 bg-gradient-to-br from-rose-50/95 via-white to-pink-50/50',
    icon: 'bg-rose-100',
    accent: 'text-rose-600/90',
  },
  cream: {
    card: 'border-amber-100/80 bg-gradient-to-br from-amber-50/95 via-white to-yellow-50/40',
    icon: 'bg-amber-100',
    accent: 'text-amber-800/85',
  },
  gold: {
    card: 'border-amber-200/50 bg-gradient-to-br from-[#faf6ef] via-white to-amber-50/40',
    icon: 'bg-[#f5e6c8]',
    accent: 'text-amber-900/80',
  },
  sky: {
    card: 'border-sky-100/80 bg-gradient-to-br from-sky-50/95 via-white to-blue-50/40',
    icon: 'bg-sky-100',
    accent: 'text-sky-700/90',
  },
  soft: {
    card: 'border-violet-100/70 bg-gradient-to-br from-violet-50/80 via-white to-rose-50/40',
    icon: 'bg-violet-100',
    accent: 'text-violet-700/85',
  },
};

function ProfileTextCard({
  icon,
  label,
  value,
  placeholder,
  editing,
  onStartEdit,
  onChange,
  onDone,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  placeholder: string;
  editing: boolean;
  onStartEdit: () => void;
  onChange: (v: string) => void;
  onDone: () => void;
  theme: CardTheme;
}) {
  const t = CARD_THEME[theme];
  const hasValue = Boolean(value.trim());

  if (editing) {
    return (
      <div className={`rounded-2xl border p-3.5 shadow-sm ${t.card}`}>
        <p className="mb-2 text-[11px] font-bold text-stone-500">編輯 · {label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} mb-2.5`}
          autoFocus
        />
        <button
          type="button"
          onClick={onDone}
          className="min-h-[44px] w-full rounded-xl bg-rose-500 text-[13px] font-extrabold text-white active:scale-[0.99]"
        >
          完成
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left shadow-sm active:scale-[0.99] ${t.card}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${t.icon}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-stone-500">{label}</p>
        {hasValue ? (
          <p className={`mt-0.5 truncate text-[15px] font-extrabold text-stone-900`}>{value}</p>
        ) : (
          <p className="mt-0.5 text-[13px] font-semibold text-stone-400">尚未設定</p>
        )}
      </div>
      <span className={`shrink-0 text-[12px] font-bold ${hasValue ? 'text-stone-400' : t.accent}`}>
        {hasValue ? '編輯' : '＋ 新增'}
      </span>
    </button>
  );
}

function ProfileDateCard({
  icon,
  label,
  value,
  editing,
  onStartEdit,
  onChange,
  onDone,
  theme,
  optional = false,
}: {
  icon: string;
  label: string;
  value: string;
  editing: boolean;
  onStartEdit: () => void;
  onChange: (ymd: string) => void;
  onDone: () => void;
  theme: CardTheme;
  optional?: boolean;
}) {
  const t = CARD_THEME[theme];
  const hasValue = Boolean(value.trim());

  if (editing) {
    return (
      <div className={`rounded-2xl border p-3.5 shadow-sm ${t.card}`}>
        <p className="mb-2 text-[11px] font-bold text-stone-500">
          編輯 · {label}
          {optional ? '（選填）' : ''}
        </p>
        <DatePickerField value={value} onChange={onChange} label="日期" className="mb-2.5" />
        <div className="flex gap-2">
          {optional && hasValue ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                onDone();
              }}
              className="rounded-xl px-3 py-2 text-[12px] font-bold text-stone-500 active:opacity-70"
            >
              清除
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDone}
            className="min-h-[44px] flex-1 rounded-xl bg-rose-500 text-[13px] font-extrabold text-white active:scale-[0.99]"
          >
            完成
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left shadow-sm active:scale-[0.99] ${t.card}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${t.icon}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-stone-500">
          {label}
          {optional ? <span className="font-semibold text-stone-400"> · 選填</span> : null}
        </p>
        {hasValue ? (
          <p className={`mt-0.5 text-[15px] font-extrabold tracking-wide ${t.accent}`}>
            {formatDisplayDateYmd(value)}
          </p>
        ) : (
          <p className="mt-0.5 text-[13px] font-semibold text-stone-400">尚未設定</p>
        )}
      </div>
      <span className={`shrink-0 text-[12px] font-bold ${hasValue ? 'text-stone-400' : t.accent}`}>
        {hasValue ? '編輯' : '＋ 新增'}
      </span>
    </button>
  );
}
