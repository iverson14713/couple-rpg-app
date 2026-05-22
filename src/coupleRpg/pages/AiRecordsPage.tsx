import { useMemo, useState, type ReactNode } from 'react';
import { Heart, Image, Sparkles } from 'lucide-react';
import { DateItineraryAiSheet } from '../components/DateItineraryAiSheet';
import { ImportantDateAiSheet } from '../components/ImportantDateAiSheet';
import { AiFavoriteButton } from '../components/AiFavoriteButton';
import { AiShareCardModal } from '../components/AiShareCardModal';
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

export function AiRecordsPage() {
  const { isPro, dateRecords, importantRecords } = useAiRecords();
  const { isFavorite } = useAiFavorites();
  const { openUpgradeModal } = useUserPlan();
  const { navigateTo } = useCoupleRpgNav();
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [viewDate, setViewDate] = useState<SavedDateItineraryAi | null>(null);
  const [viewImportant, setViewImportant] = useState<SavedImportantDateAi | null>(null);
  const [sharePayload, setSharePayload] = useState<AiShareCardPayload | null>(null);

  const favCount = countAiFavorites();

  const filteredDate = useMemo(() => {
    if (listFilter !== 'favorites') return dateRecords;
    return dateRecords.filter((r) => isFavorite(dateItineraryRecordId(r)));
  }, [dateRecords, listFilter, isFavorite]);

  const filteredImportant = useMemo(() => {
    if (listFilter !== 'favorites') return importantRecords;
    return importantRecords.filter((r) => isFavorite(importantDateRecordId(r)));
  }, [importantRecords, listFilter, isFavorite]);

  const empty =
    dateRecords.length === 0 && importantRecords.length === 0;
  const filterEmpty =
    !empty && filteredDate.length === 0 && filteredImportant.length === 0;

  const openShare = (payload: AiShareCardPayload) => {
    if (!isPro) {
      openUpgradeModal('產生 IG 分享卡為 Pro 功能');
      return;
    }
    setSharePayload(payload);
  };

  return (
    <>
      <p className={`mb-3 text-[12px] leading-relaxed ${lq.textSecondary}`}>
        {isPro
          ? '多筆 AI 紀錄已保存在本機。可收藏喜歡的建議、產生分享卡，查看不扣 AI 次數。'
          : '免費版各保留最近一次 AI 結果，查看不扣次數。升級 Pro 可收藏、分享，並保存多筆戀愛 AI 紀錄。'}
      </p>

      <ProAiMemoriesHub
        favCount={favCount}
        onShowFavorites={() => setListFilter('favorites')}
        onShareHint={() => {
          if (!isPro) {
            openUpgradeModal('產生 IG 分享卡為 Pro 功能');
            return;
          }
          const first = dateRecords[0] ?? null;
          const imp = importantRecords[0] ?? null;
          if (first) openShare(buildDateItinerarySharePayload(first));
          else if (imp) openShare(buildImportantDateSharePayload(imp));
          else openUpgradeModal('請先產生一筆 AI 紀錄');
        }}
      />

      {!empty ? (
        <div className={`mb-3 flex gap-1 rounded-2xl p-1 ${lq.cardSoft}`}>
          <FilterTab active={listFilter === 'all'} onClick={() => setListFilter('all')} label="全部" />
          <FilterTab
            active={listFilter === 'favorites'}
            onClick={() => setListFilter('favorites')}
            label={`收藏${favCount > 0 ? ` (${favCount})` : ''}`}
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

      {filteredDate.length > 0 ? (
        <section className={`mb-4 overflow-hidden ${lq.card}`}>
          <div className="border-b border-rose-100/60 bg-gradient-to-r from-rose-50/80 to-pink-50/50 px-3.5 py-2.5">
            <h2 className={lq.sectionTitleSm}>💑 AI 約會行程</h2>
            <p className={`text-[11px] ${lq.textMuted}`}>
              {isPro ? `共 ${filteredDate.length} 筆` : '最近一次'}
            </p>
          </div>
          <ul className="space-y-0 divide-y divide-rose-50/80 p-2">
            {filteredDate.map((r) => (
              <AiRecordRow
                key={r.savedAt}
                recordId={dateItineraryRecordId(r)}
                emoji={r.suggestion.emoji}
                title={r.plan.title || r.suggestion.title}
                meta={`${formatSavedItineraryDate(r)} · ${r.suggestion.title}`}
                onView={() => setViewDate(r)}
                onShare={() => openShare(buildDateItinerarySharePayload(r))}
              />
            ))}
          </ul>
          <div className="border-t border-rose-50/80 px-3 py-2">
            <button
              type="button"
              onClick={() => navigateTo('dates')}
              className="w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2"
            >
              在約會頁繼續規劃 →
            </button>
          </div>
        </section>
      ) : null}

      {filteredImportant.length > 0 ? (
        <section className={`mb-4 overflow-hidden ${lq.card}`}>
          <div className="border-b border-violet-100/60 bg-gradient-to-r from-violet-50/70 to-rose-50/50 px-3.5 py-2.5">
            <h2 className={lq.sectionTitleSm}>🔔 AI 重要日子安排</h2>
            <p className={`text-[11px] ${lq.textMuted}`}>
              {isPro ? `共 ${filteredImportant.length} 筆` : '最近一次'}
            </p>
          </div>
          <ul className="space-y-0 divide-y divide-rose-50/80 p-2">
            {filteredImportant.map((r) => (
              <AiRecordRow
                key={r.savedAt}
                recordId={importantDateRecordId(r)}
                emoji={r.event.icon}
                title={r.plan.title || r.event.displayTitle}
                meta={`${formatSavedImportantDateLabel(r)} · ${r.event.typeLabel}`}
                onView={() => setViewImportant(r)}
                onShare={() => openShare(buildImportantDateSharePayload(r))}
              />
            ))}
          </ul>
          <div className="border-t border-rose-50/80 px-3 py-2">
            <button
              type="button"
              onClick={() => navigateTo('importantDates')}
              className="w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2"
            >
              在重要日子頁繼續安排 →
            </button>
          </div>
        </section>
      ) : null}

      {!isPro ? (
        <button
          type="button"
          onClick={() => openUpgradeModal('解鎖 AI 收藏、分享與多筆歷史')}
          className={`w-full ${lq.btnPrimary}`}
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
    </>
  );
}

function ProAiMemoriesHub({
  favCount,
  onShowFavorites,
  onShareHint,
}: {
  favCount: number;
  onShowFavorites: () => void;
  onShareHint: () => void;
}) {
  return (
    <section className="mb-4">
      <p className={`mb-2 ${lq.sectionTitleSm}`}>Pro AI 回憶收藏</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ProFeatureCard
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          title="收藏 AI 建議"
          description={favCount > 0 ? `已收藏 ${favCount} 筆` : '點 ♡ 留住喜歡的規劃'}
          onClick={onShowFavorites}
        />
        <ProFeatureCard
          icon={<Image className="h-5 w-5 text-rose-500" />}
          title="分享圖片卡"
          description="儲存圖片 · 一鍵分享給另一半"
          onClick={onShareHint}
        />
        <ProFeatureCard
          icon={<Sparkles className="h-5 w-5 text-violet-400" />}
          title="AI 戀愛回憶卡"
          description="規劃中"
          disabled
        />
      </div>
    </section>
  );
}

function ProFeatureCard({
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex min-h-[5.5rem] flex-col items-start rounded-2xl border border-rose-200/45 bg-gradient-to-br from-white/85 via-rose-50/50 to-pink-50/40 p-3 text-left shadow-[0_8px_28px_-14px_rgba(244,114,182,0.22)] backdrop-blur-sm transition active:scale-[0.98] disabled:cursor-default disabled:opacity-55`}
    >
      <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 ring-1 ring-rose-100/60`}>
        {icon}
      </span>
      <span className={`text-[13px] font-bold ${lq.text}`}>{title}</span>
      <span className={`mt-0.5 text-[11px] leading-snug ${lq.textMuted}`}>{description}</span>
    </button>
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
      className={`min-h-[40px] flex-1 rounded-xl py-2 text-[13px] font-bold transition active:scale-[0.98] ${
        active ? lq.hubTabActive : lq.hubTabIdle
      }`}
    >
      {label}
    </button>
  );
}

function AiRecordRow({
  recordId,
  emoji,
  title,
  meta,
  onView,
  onShare,
}: {
  recordId: string;
  emoji: string;
  title: string;
  meta: string;
  onView: () => void;
  onShare: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-xl p-2.5 transition hover:bg-rose-50/30">
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
          aria-label="產生分享卡"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-100/80 bg-white/80 text-rose-500 active:scale-95"
        >
          <Image className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onView}
          className={`${lq.btnCompact} !h-8 !min-h-8 !px-2 !text-[11px]`}
        >
          查看
        </button>
      </div>
    </li>
  );
}
