import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Cloud, Heart, RefreshCw } from 'lucide-react';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { makeId } from '../lib/id';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { CoupleExtendedProfile, CustomImportantDate } from '../storage/coupleExtendedTypes';
import { defaultCoupleExtendedProfile } from '../storage/coupleExtendedTypes';
import { lq } from '../theme';

const COUPLE_PROFILE_ANCHOR_ID = 'lq-couple-profile';

const SYNC_STATUS_LABEL = {
  local: '本機保存',
  syncing: '同步中',
  synced: '已同步',
  error: '同步失敗，稍後再試',
} as const;

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
    customDates: Array.isArray(coupleExtended?.customDates) ? coupleExtended.customDates : [],
  }));
  const [savedFlash, setSavedFlash] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    setDraft({
      ...defaultCoupleExtendedProfile(),
      ...coupleExtended,
      customDates: Array.isArray(coupleExtended?.customDates) ? coupleExtended.customDates : [],
    });
  }, [coupleExtended]);

  useLayoutEffect(() => {
    if (pendingScrollElementId !== COUPLE_PROFILE_ANCHOR_ID) return;
    acknowledgePendingScroll();
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pendingScrollElementId, acknowledgePendingScroll]);

  const updateDraft = useCallback((patch: Partial<CoupleExtendedProfile>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const addCustomDate = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      customDates: [...prev.customDates, { id: makeId(), name: '', date: '', note: '' }],
    }));
  }, []);

  const updateCustom = useCallback((id: string, patch: Partial<CustomImportantDate>) => {
    setDraft((prev) => ({
      ...prev,
      customDates: prev.customDates.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCustom = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      customDates: prev.customDates.filter((c) => c.id !== id),
    }));
  }, []);

  const onSave = useCallback(() => {
    setCoupleExtendedProfile({ ...defaultCoupleExtendedProfile(), ...draft });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2800);
  }, [draft, setCoupleExtendedProfile]);

  return (
    <section ref={sectionRef} id={COUPLE_PROFILE_ANCHOR_ID} className={`mb-4 p-3.5 ${lq.card}`}>
      <div className="mb-3 flex items-start gap-2">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-stone-900">💑 情侶資料</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-stone-500">生日 · 紀念日 · 重要日子</p>
          <p className="mt-1 text-[10px] leading-snug text-violet-700/90">{coupleSyncHint}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50/90 px-2.5 py-2 ring-1 ring-stone-100">
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
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100 active:scale-[0.98] disabled:opacity-50"
          >
            同步情侶資料
          </button>
        ) : null}
      </div>
      {coupleProfileSyncError ? (
        <p className="mb-2 text-[10px] font-semibold text-amber-800">{coupleProfileSyncError}</p>
      ) : null}

      <div className="space-y-2.5">
        <FieldRow label="我的暱稱">
          <input
            type="text"
            value={draft.myNickname}
            onChange={(e) => updateDraft({ myNickname: e.target.value })}
            placeholder="你的名字"
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="另一半暱稱">
          <input
            type="text"
            value={draft.partnerNickname}
            onChange={(e) => updateDraft({ partnerNickname: e.target.value })}
            placeholder="對方的名字"
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="我的生日">
          <input
            type="date"
            value={draft.myBirthday}
            onChange={(e) => updateDraft({ myBirthday: e.target.value })}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="另一半生日">
          <input
            type="date"
            value={draft.partnerBirthday}
            onChange={(e) => updateDraft({ partnerBirthday: e.target.value })}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="在一起紀念日">
          <input
            type="date"
            value={draft.relationshipStart}
            onChange={(e) => updateDraft({ relationshipStart: e.target.value })}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="結婚紀念日（選填）">
          <input
            type="date"
            value={draft.weddingAnniversary}
            onChange={(e) => updateDraft({ weddingAnniversary: e.target.value })}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="第一次約會日（選填）">
          <input
            type="date"
            value={draft.firstDate}
            onChange={(e) => updateDraft({ firstDate: e.target.value })}
            className={inputClass}
          />
        </FieldRow>
      </div>

      <div className="mt-4 border-t border-stone-100 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-stone-700">自訂重要日子</p>
          <button
            type="button"
            onClick={addCustomDate}
            className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 ring-1 ring-rose-100 active:scale-95"
          >
            ＋ 新增
          </button>
        </div>
        {draft.customDates.length === 0 ? (
          <p className="text-[10px] text-stone-400">尚無自訂日子，可新增旅行、牽手日等紀念。</p>
        ) : (
          <ul className="space-y-2">
            {draft.customDates.map((c) => (
              <li key={c.id} className="rounded-xl border border-stone-100 bg-stone-50/50 p-2">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCustom(c.id, { name: e.target.value })}
                  placeholder="名稱"
                  className={`${inputClass} mb-1.5`}
                />
                <input
                  type="date"
                  value={c.date}
                  onChange={(e) => updateCustom(c.id, { date: e.target.value })}
                  className={`${inputClass} mb-1.5`}
                />
                <input
                  type="text"
                  value={c.note}
                  onChange={(e) => updateCustom(c.id, { note: e.target.value })}
                  placeholder="備註（選填）"
                  className={`${inputClass} mb-1.5`}
                />
                <button
                  type="button"
                  onClick={() => removeCustom(c.id)}
                  className="text-[10px] font-bold text-stone-400 underline decoration-stone-300"
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col items-stretch gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.99]"
        >
          儲存資料
        </button>
        {savedFlash ? (
          <p className="text-center text-[11px] font-semibold text-emerald-600" role="status">
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

const inputClass =
  'w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] text-stone-800 placeholder:text-stone-400 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200';

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
    </label>
  );
}
