import { Sparkles } from 'lucide-react';
import { AiFavoriteButton } from './AiFavoriteButton';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { dateItineraryRecordId } from '../lib/aiRecordIds';
import { formatSavedItineraryDate } from '../storage/dateItineraryAiCache';
import type { SavedDateItineraryAi } from '../storage/dateItineraryAiCache';
import { useLastDateItineraryAi } from '../hooks/useLastDateItineraryAi';
import { lq } from '../theme';

type Props = {
  onView: (record: SavedDateItineraryAi) => void;
  className?: string;
};

/** 免費版：顯示最近一次 AI 約會行程，可再次查看（不扣次） */
export function RecentDateItineraryAiCard({ onView, className = '' }: Props) {
  const { navigateTo } = useCoupleRpgNav();
  const record = useLastDateItineraryAi();
  if (!record) return null;

  const displayTitle = record.plan.title || record.suggestion.title;
  const dateLabel = formatSavedItineraryDate(record);

  return (
    <section className={`p-3.5 ${lq.cardFeature} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`h-11 w-11 text-xl ${lq.iconChip}`} aria-hidden>
          {record.suggestion.emoji || '✨'}
        </span>
        <div className="min-w-0 flex-1">
          <p className={lq.label}>最近 AI 約會行程</p>
          <p className={`mt-0.5 truncate text-[15px] font-bold ${lq.text}`}>{displayTitle}</p>
          <p className={`mt-0.5 text-[12px] ${lq.textMuted}`}>
            {dateLabel} · {record.suggestion.title}
          </p>
        </div>
        <AiFavoriteButton recordId={dateItineraryRecordId(record)} size="sm" />
        <button
          type="button"
          onClick={() => onView(record)}
          className={`shrink-0 ${lq.btnCompact} !h-9 !min-h-9 !px-3 !text-[12px]`}
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          查看
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigateTo('profile', { profileSection: 'aiRecords' })}
        className={`mt-2.5 w-full text-center text-[11px] font-bold text-rose-600 underline-offset-2`}
      >
        查看全部 AI 紀錄 →
      </button>
    </section>
  );
}
