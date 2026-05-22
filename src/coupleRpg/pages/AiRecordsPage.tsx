import { useMemo, useState } from 'react';
import { Image, Trash2 } from 'lucide-react';
import { DateItineraryAiSheet } from '../components/DateItineraryAiSheet';
import { ImportantDateAiSheet } from '../components/ImportantDateAiSheet';
import { AiFavoriteButton } from '../components/AiFavoriteButton';
import { AiShareCardModal } from '../components/AiShareCardModal';
import { AiCollapsibleRecordsSection } from '../components/AiCollapsibleRecordsSection';
import { AiRecordDeleteDialog } from '../components/AiRecordDeleteDialog';
import { useAiRecords } from '../hooks/useAiRecords';
import { useAiFavorites } from '../hooks/useAiFavorites';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
import {
  buildDateItinerarySharePayload,
  buildImportantDateSharePayload,
  type AiShareCardPayload,
} from '../lib/aiShareCardContent';
import { dateItineraryRecordId, importantDateRecordId } from '../lib/aiRecordIds';
import { AI_RECORD_RETENTION_HINT } from '../lib/aiRecordsConfig';
import {
  sortDateItineraryRecords,
  sortImportantDateRecords,
  type AiRecordSortMode,
} from '../lib/aiRecordListUtils';
import {
  formatSavedItineraryDate,
  savedSuggestionToDateSuggestion,
  type SavedDateItineraryAi,
} from '../storage/dateItineraryAiCache';
import {
  formatSavedImportantDateLabel,
  savedEventToImportantDateEvent,
  type SavedImportantDateAi,
} from '../storage/importantDateAiCache';
import { countAiFavorites } from '../storage/aiFavoritesStore';
import { lq } from '../theme';

type ListFilter = 'all' | 'favorites';

type PendingDelete =
  | { kind: 'date'; record: SavedDateItineraryAi }
  | { kind: 'important'; record: SavedImportantDateAi }
  | null;

export function AiRecordsPage() {
  const { isPro, dateRecords, importantRecords, removeDateRecord, removeImportantRecord } =
    useAiRecords();
  const { isFavorite } = useAiFavorites();
  const { openUpgradeModal } = useUserPlan();
  const { navigateTo } = useCoupleRpgNav();
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [sortMode, setSortMode] = useState<AiRecordSortMode>('newest');
  const [viewDate, setViewDate] = useState<SavedDateItineraryAi | null>(null);
  const [viewImportant, setViewImportant] = useState<SavedImportantDateAi | null>(null);
  const [sharePayload, setSharePayload] = useState<AiShareCardPayload | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const favCount = countAiFavorites();

  const sortedDate = useMemo(
    () => sortDateItineraryRecords(dateRecords, sortMode, isFavorite),
    [dateRecords, sortMode, isFavorite]
  );
  const sortedImportant = useMemo(
    () => sortImportantDateRecords(importantRecords, sortMode, isFavorite),
    [importantRecords, sortMode, isFavorite]
  );

  const filteredDate = useMemo(() => {
    if (listFilter !== 'favorites') return sortedDate;
    return sortedDate.filter((r) => isFavorite(dateItineraryRecordId(r)));
  }, [sortedDate, listFilter, isFavorite]);

  const filteredImportant = useMemo(() => {
    if (listFilter !== 'favorites') return sortedImportant;
    return sortedImportant.filter((r) => isFavorite(importantDateRecordId(r)));
  }, [sortedImportant, listFilter, isFavorite]);

  const empty = dateRecords.length === 0 && importantRecords.length === 0;
  const filterEmpty =
    !empty && filteredDate.length === 0 && filteredImportant.length === 0;

  const openShare = (payload: AiShareCardPayload) => {
    if (!isPro) {
      openUpgradeModal('產生 IG 分享卡為 Pro 功能');
      return;
    }
    setSharePayload(payload);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'date') {
      removeDateRecord(pendingDelete.record);
    } else {
      removeImportantRecord(pendingDelete.record);
    }
    setPendingDelete(null);
  };

  return (
    <>
      <p className={`mb-1.5 text-[12px] leading-snug ${lq.textSecondary}`}>
        {isPro ? '本機保存，查看不扣 AI 次數。' : '免費版各保留最近一筆。'}
      </p>
      <p className={`mb-2 text-[10px] leading-snug ${lq.textMuted}`}>{AI_RECORD_RETENTION_HINT}</p>

      {!empty ? (
        <div className={`mb-2 flex gap-1 rounded-xl p-0.5 ${lq.cardSoft}`}>
          <FilterTab active={listFilter === 'all'} onClick={() => setListFilter('all')} label="全部" />
          <FilterTab
            active={listFilter === 'favorites'}
            onClick={() => setListFilter('favorites')}
            label={`收藏${favCount > 0 ? ` ${favCount}` : ''}`}
          />
          <FilterTab active={sortMode === 'newest'} onClick={() => setSortMode('newest')} label="最新" />
          <FilterTab
            active={sortMode === 'favorites_first'}
            onClick={() => setSortMode('favorites_first')}
            label="收藏優先"
          />
        </div>
      ) : null}

      {empty ? (
        <section className={`p-6 text-center ${lq.card}`}>
          <p className="text-3xl" aria-hidden>
            ✨
          </p>
          <p className={`mt-2 text-[15px] font-bold ${lq.text}`}>尚無 AI 紀錄</p>
          <p className={`mt-1 text-[13px] ${lq.textSecondary}`}>
            在約會頁或重要日子提醒使用 AI 後，會自動保存在這裡。
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => navigateTo('dates')} className={lq.btnPrimary}>
              前往約會頁
            </button>
            <button type="button" onClick={() => navigateTo('importantDates')} className={lq.btnSecondary}>
              重要日子提醒
            </button>
          </div>
        </section>
      ) : null}

      {filterEmpty ? (
        <section className={`mb-4 p-5 text-center ${lq.card}`}>
          <p className="text-2xl" aria-hidden>
            ♡
          </p>
          <p className={`mt-2 text-[14px] font-bold ${lq.text}`}>還沒有收藏的 AI 建議</p>
          <p className={`mt-1 text-[12px] ${lq.textSecondary}`}>在紀錄上點 ♡ 收藏喜歡的內容</p>
          <button type="button" onClick={() => setListFilter('all')} className={`mt-3 ${lq.btnSecondary}`}>
            查看全部紀錄
          </button>
        </section>
      ) : null}

      {listFilter === 'favorites' && (filteredDate.length > 0 || filteredImportant.length > 0) ? (
        <AiCollapsibleRecordsSection
          sectionId="ai-favorites"
          title="收藏的 AI 建議"
          emoji="♡"
          items={[
            ...filteredDate.map((r) => ({ kind: 'date' as const, record: r })),
            ...filteredImportant.map((r) => ({ kind: 'important' as const, record: r })),
          ].sort((a, b) => b.record.savedAt.localeCompare(a.record.savedAt))}
          rowKey={(item) =>
            item.kind === 'date'
              ? `fav-date-${item.record.savedAt}`
              : `fav-imp-${item.record.savedAt}`
          }
          headerClassName="border-b border-rose-200/50 bg-gradient-to-r from-rose-100/70 to-pink-50/60"
          renderRow={(item) =>
            item.kind === 'date' ? (
              <AiRecordRowInner
                recordId={dateItineraryRecordId(item.record)}
                emoji={item.record.suggestion.emoji}
                title={item.record.plan.title || item.record.suggestion.title}
                meta={`約會 · ${formatSavedItineraryDate(item.record)}`}
                onView={() => setViewDate(item.record)}
                onShare={() => openShare(buildDateItinerarySharePayload(item.record))}
                onDelete={() => setPendingDelete({ kind: 'date', record: item.record })}
              />
            ) : (
              <AiRecordRowInner
                recordId={importantDateRecordId(item.record)}
                emoji={item.record.event.icon}
                title={item.record.plan.title || item.record.event.displayTitle}
                meta={`重要日子 · ${formatSavedImportantDateLabel(item.record)}`}
                onView={() => setViewImportant(item.record)}
                onShare={() => openShare(buildImportantDateSharePayload(item.record))}
                onDelete={() => setPendingDelete({ kind: 'important', record: item.record })}
              />
            )
          }
        />
      ) : null}

      {listFilter === 'all' && filteredDate.length > 0 ? (
        <AiCollapsibleRecordsSection
          sectionId="ai-date-itinerary"
          title="AI 約會行程"
          emoji="💑"
          items={filteredDate}
          rowKey={(r) => r.savedAt}
          renderRow={(r) => (
            <AiRecordRowInner
              recordId={dateItineraryRecordId(r)}
              emoji={r.suggestion.emoji}
              title={r.plan.title || r.suggestion.title}
              meta={`${formatSavedItineraryDate(r)} · ${r.suggestion.title}`}
              onView={() => setViewDate(r)}
              onShare={() => openShare(buildDateItinerarySharePayload(r))}
              onDelete={() => setPendingDelete({ kind: 'date', record: r })}
            />
          )}
          footer={
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => navigateTo('dates')}
                className="w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2"
              >
                在約會頁繼續規劃 →
              </button>
            </div>
          }
        />
      ) : null}

      {listFilter === 'all' && filteredImportant.length > 0 ? (
        <AiCollapsibleRecordsSection
          sectionId="ai-important-date"
          title="AI 重要日子安排"
          emoji="🔔"
          items={filteredImportant}
          rowKey={(r) => r.savedAt}
          headerClassName="border-b border-violet-100/60 bg-gradient-to-r from-violet-50/70 to-rose-50/50"
          renderRow={(r) => (
            <AiRecordRowInner
              recordId={importantDateRecordId(r)}
              emoji={r.event.icon}
              title={r.plan.title || r.event.displayTitle}
              meta={`${formatSavedImportantDateLabel(r)} · ${r.event.typeLabel}`}
              onView={() => setViewImportant(r)}
              onShare={() => openShare(buildImportantDateSharePayload(r))}
              onDelete={() => setPendingDelete({ kind: 'important', record: r })}
            />
          )}
          footer={
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => navigateTo('importantDates')}
                className="w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2"
              >
                在重要日子頁繼續安排 →
              </button>
            </div>
          }
        />
      ) : null}

      {!isPro ? (
        <button
          type="button"
          onClick={() => openUpgradeModal('解鎖 AI 收藏、分享與多筆歷史')}
          className={`mt-2 w-full ${lq.btnPrimary}`}
        >
          升級 Pro · AI 回憶收藏
        </button>
      ) : null}

      {viewDate ? (
        <DateItineraryAiSheet
          suggestion={savedSuggestionToDateSuggestion(viewDate.suggestion)}
          savedRecord={viewDate}
          onClose={() => setViewDate(null)}
        />
      ) : null}

      {viewImportant ? (
        <ImportantDateAiSheet
          event={savedEventToImportantDateEvent(viewImportant.event)}
          initialPrefs={viewImportant.settings.partnerPrefs}
          savedRecord={viewImportant}
          onClose={() => setViewImportant(null)}
          onSavePrefs={() => {}}
        />
      ) : null}

      {sharePayload ? <AiShareCardModal payload={sharePayload} onClose={() => setSharePayload(null)} /> : null}

      <AiRecordDeleteDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function FilterTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[34px] flex-1 rounded-lg py-1.5 text-[11px] font-bold transition active:scale-[0.98] ${
        active ? lq.hubTabActive : lq.hubTabIdle
      }`}
    >
      {label}
    </button>
  );
}

function AiRecordRowInner({
  recordId,
  emoji,
  title,
  meta,
  onView,
  onShare,
  onDelete,
}: {
  recordId: string;
  emoji: string;
  title: string;
  meta: string;
  onView: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl p-2.5 transition hover:bg-rose-50/30">
      <span className={`h-10 w-10 text-lg ${lq.iconChip}`} aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-bold ${lq.text}`}>{title}</p>
        <p className={`truncate text-[11px] ${lq.textMuted}`}>{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <AiFavoriteButton recordId={recordId} size="sm" />
        <button
          type="button"
          onClick={onShare}
          aria-label="產生分享圖"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-100/80 bg-white/80 text-rose-500 active:scale-95"
        >
          <Image className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="刪除紀錄"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-500 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onView}
          className={`${lq.btnCompact} !h-8 !min-h-8 !px-2 !text-[11px]`}
        >
          查看
        </button>
      </div>
    </div>
  );
}
