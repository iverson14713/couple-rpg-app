import { Sparkles } from 'lucide-react';
import { DateItineraryAiSheet } from '../components/DateItineraryAiSheet';
import { ImportantDateAiSheet } from '../components/ImportantDateAiSheet';
import { useAiRecords } from '../hooks/useAiRecords';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useUserPlan } from '../context/UserPlanContext';
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
import { useState } from 'react';
import { lq } from '../theme';

export function AiRecordsPage() {
  const { isPro, dateRecords, importantRecords } = useAiRecords();
  const { openUpgradeModal } = useUserPlan();
  const { navigateTo } = useCoupleRpgNav();
  const [viewDate, setViewDate] = useState<SavedDateItineraryAi | null>(null);
  const [viewImportant, setViewImportant] = useState<SavedImportantDateAi | null>(null);

  const empty = dateRecords.length === 0 && importantRecords.length === 0;

  return (
    <>
      {!isPro ? (
        <p className={`mb-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold leading-snug ${lq.cardSoft} ${lq.textSecondary}`}>
          免費版各保留最近一次 AI 結果，查看不扣 AI 次數。升級 Pro 可收藏、分享，並保存多筆戀愛 AI 紀錄。
        </p>
      ) : (
        <p className={`mb-3 text-[12px] ${lq.textMuted}`}>
          已為你們保存多筆 AI 紀錄（本機）。收藏與分享卡等功能陸續推出。
        </p>
      )}

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
            <button
              type="button"
              onClick={() => navigateTo('importantDates')}
              className={lq.btnSecondary}
            >
              重要日子提醒
            </button>
          </div>
        </section>
      ) : null}

      {dateRecords.length > 0 ? (
        <section className={`mb-4 p-3.5 ${lq.card}`}>
          <h2 className={lq.sectionTitleSm}>AI 約會行程</h2>
          <p className={`mt-0.5 mb-2.5 text-[12px] ${lq.textMuted}`}>
            {isPro ? `共 ${dateRecords.length} 筆` : '最近一次'}
          </p>
          <ul className="space-y-2">
            {dateRecords.map((r) => (
              <AiRecordRow
                key={r.savedAt}
                emoji={r.suggestion.emoji}
                title={r.plan.title || r.suggestion.title}
                meta={`${formatSavedItineraryDate(r)} · ${r.suggestion.title}`}
                onView={() => setViewDate(r)}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigateTo('dates')}
            className={`mt-3 w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2`}
          >
            在約會頁繼續規劃 →
          </button>
        </section>
      ) : null}

      {importantRecords.length > 0 ? (
        <section className={`mb-4 p-3.5 ${lq.card}`}>
          <h2 className={lq.sectionTitleSm}>AI 重要日子安排</h2>
          <p className={`mt-0.5 mb-2.5 text-[12px] ${lq.textMuted}`}>
            {isPro ? `共 ${importantRecords.length} 筆` : '最近一次'}
          </p>
          <ul className="space-y-2">
            {importantRecords.map((r) => (
              <AiRecordRow
                key={r.savedAt}
                emoji={r.event.icon}
                title={r.plan.title || r.event.displayTitle}
                meta={`${formatSavedImportantDateLabel(r)} · ${r.event.typeLabel}`}
                onView={() => setViewImportant(r)}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigateTo('importantDates')}
            className={`mt-3 w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2`}
          >
            在重要日子頁繼續安排 →
          </button>
        </section>
      ) : null}

      {isPro ? (
        <section className={`p-3.5 ${lq.cardSoft}`}>
          <p className={`text-[13px] font-bold ${lq.text}`}>Pro AI 回憶收藏</p>
          <p className={`mt-0.5 text-[11px] ${lq.textMuted}`}>收藏、分享與回憶，留住你們的甜蜜規劃</p>
          <ul className={`mt-2 space-y-1 text-[12px] ${lq.textSecondary}`}>
            <li>· 多筆 AI 歷史紀錄（已開啟）</li>
            <li>· 收藏喜歡的 AI 建議（即將推出）</li>
            <li>· 產生 IG / 分享卡圖片（即將推出）</li>
            <li>· AI 戀愛回憶卡（規劃中）</li>
          </ul>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => openUpgradeModal('解鎖 AI 收藏、分享與多筆歷史')}
          className={`mb-2 w-full ${lq.btnSecondary}`}
        >
          升級 Pro · AI 回憶收藏
        </button>
      )}

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
    </>
  );
}

function AiRecordRow({
  emoji,
  title,
  meta,
  onView,
}: {
  emoji: string;
  title: string;
  meta: string;
  onView: () => void;
}) {
  return (
    <li className={`flex items-center gap-2.5 rounded-xl p-2.5 ${lq.cardFeature}`}>
      <span className={`h-10 w-10 text-lg ${lq.iconChip}`} aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-bold ${lq.text}`}>{title}</p>
        <p className={`truncate text-[11px] ${lq.textMuted}`}>{meta}</p>
      </div>
      <button
        type="button"
        onClick={onView}
        className={`shrink-0 ${lq.btnCompact} !h-9 !min-h-9 !px-2.5 !text-[11px]`}
      >
        <Sparkles className="mr-0.5 inline h-3 w-3" aria-hidden />
        查看
      </button>
    </li>
  );
}
