import { Sparkles } from 'lucide-react';
import { AiFavoriteButton } from './AiFavoriteButton';
import { importantDateRecordId } from '../lib/aiRecordIds';
import { useLastImportantDateAi } from '../hooks/useLastImportantDateAi';
import { formatSavedImportantDateLabel, type SavedImportantDateAi } from '../storage/importantDateAiCache';
import { lq } from '../theme';

type Props = {
  onView: (record: SavedImportantDateAi) => void;
  className?: string;
};

/** 重要日子頁：最近一次 AI 安排（查看不扣次） */
export function RecentImportantDateAiCard({ onView, className = '' }: Props) {
  const record = useLastImportantDateAi();
  if (!record) return null;

  const displayTitle = record.plan.title || record.event.displayTitle;

  return (
    <section className={`p-3.5 ${lq.cardFeature} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`h-11 w-11 text-xl ${lq.iconChip}`} aria-hidden>
          {record.event.icon || '✨'}
        </span>
        <div className="min-w-0 flex-1">
          <p className={lq.label}>最近 AI 重要日子安排</p>
          <p className={`mt-0.5 truncate text-[15px] font-bold ${lq.text}`}>{displayTitle}</p>
          <p className={`mt-0.5 text-[12px] ${lq.textMuted}`}>
            {formatSavedImportantDateLabel(record)} · {record.event.typeLabel}
          </p>
        </div>
        <AiFavoriteButton recordId={importantDateRecordId(record)} size="sm" />
        <button
          type="button"
          onClick={() => onView(record)}
          className={`shrink-0 ${lq.btnCompact} !h-9 !min-h-9 !px-3 !text-[12px]`}
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          查看
        </button>
      </div>
    </section>
  );
}
