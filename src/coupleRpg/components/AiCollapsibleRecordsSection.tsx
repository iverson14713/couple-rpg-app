import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AI_RECORD_COLLAPSED_PREVIEW } from '../lib/aiRecordsConfig';
import { lq } from '../theme';

type Props<T> = {
  sectionId: string;
  title: string;
  emoji: string;
  items: T[];
  rowKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  headerClassName?: string;
  footer?: ReactNode;
  previewLimit?: number;
};

export function AiCollapsibleRecordsSection<T>({
  sectionId,
  title,
  emoji,
  items,
  rowKey,
  renderRow,
  headerClassName = 'border-b border-rose-100/60 bg-gradient-to-r from-rose-50/80 to-pink-50/50',
  footer,
  previewLimit = AI_RECORD_COLLAPSED_PREVIEW,
}: Props<T>) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [listExpanded, setListExpanded] = useState(false);
  const count = items.length;
  const showExpandControl = count > previewLimit;
  const visible =
    showExpandControl && !listExpanded ? items.slice(0, previewLimit) : items;

  return (
    <section className={`mb-4 overflow-hidden ${lq.card}`}>
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition active:bg-rose-50/40 ${headerClassName}`}
        aria-expanded={sectionOpen}
        aria-controls={`${sectionId}-panel`}
      >
        {sectionOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <h2 className={lq.sectionTitleSm}>
            {emoji} {title}（{count}）
          </h2>
        </div>
      </button>

      {sectionOpen ? (
        <div id={`${sectionId}-panel`}>
          <ul className="space-y-0 divide-y divide-rose-50/80 p-2">
            {visible.map((item) => (
              <li key={rowKey(item)}>{renderRow(item)}</li>
            ))}
          </ul>

          {showExpandControl ? (
            <div className="border-t border-rose-50/80 px-3 py-2">
              <button
                type="button"
                onClick={() => setListExpanded((v) => !v)}
                className="w-full text-center text-[12px] font-bold text-rose-600 underline-offset-2 active:opacity-80"
              >
                {listExpanded
                  ? '收合列表'
                  : `查看更多（還有 ${count - previewLimit} 筆）`}
              </button>
            </div>
          ) : null}

          {footer ? <div className="border-t border-rose-50/80">{footer}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
