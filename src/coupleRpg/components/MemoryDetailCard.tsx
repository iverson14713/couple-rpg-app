import { useMemo } from 'react';
import {
  dailyMemorySourceLabel,
  formatMemoryCreatedDate,
  formatMemoryDisplayDate,
} from '../lib/dailyMemoryLabels';
import { getTogetherDaysInfo } from '../lib/relationshipDays';
import type { CoupleDailyNote } from '../storage/dailyNotesTypes';
import { lq } from '../theme';

type Props = {
  note: CoupleDailyNote;
  nameA: string;
  nameB: string;
  relationshipStart: string;
};

/**
 * App 內回憶詳情卡：完整內容、不限字數、可隨頁面捲動。
 * 與 MemoryShareCard（分享專用）分離，不共用版面。
 */
export function MemoryDetailCard({ note, nameA, nameB, relationshipStart }: Props) {
  const together = useMemo(() => {
    const [y, m, d] = note.noteDate.split('-').map(Number);
    if (!y || !m || !d) return getTogetherDaysInfo(relationshipStart);
    return getTogetherDaysInfo(relationshipStart, new Date(y, m - 1, d, 12, 0, 0, 0));
  }, [note.noteDate, relationshipStart]);

  const sourceLabel = dailyMemorySourceLabel(note.sourceType, note.sourceMeta);
  const hasText = Boolean(note.content?.trim());
  const hasPhoto = Boolean(note.photoUrl);

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_40px_-18px_rgba(190,24,93,0.28)] ring-1 ring-rose-100/80">
      <header className="px-5 pb-1 pt-5 text-center">
        <p className="text-[11px] font-bold tracking-[0.18em] text-rose-400">LOVEQUEST</p>
        <h2 className={`mt-1 text-[20px] font-extrabold ${lq.text}`}>❤️ 今日小回憶</h2>
        <p className="mt-2 text-[15px] font-bold tracking-wide text-stone-500">
          {formatMemoryDisplayDate(note.noteDate)}
        </p>
      </header>

      {hasPhoto ? (
        <div className="mt-4 overflow-hidden bg-rose-50">
          <div className="aspect-[4/5] w-full">
            <img src={note.photoUrl!} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 flex aspect-[4/5] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-rose-50 via-pink-50/80 to-violet-50/60 px-6">
          <span className="text-5xl" aria-hidden>
            💕
          </span>
          <p className="mt-3 text-center text-[13px] font-semibold text-rose-400/90">
            這一天留下了文字回憶
          </p>
        </div>
      )}

      <div className="px-5 pb-6 pt-6">
        {hasText ? (
          <p className="whitespace-pre-wrap text-center text-[18px] font-bold leading-[1.7] text-stone-800">
            {note.content}
          </p>
        ) : (
          <p className="text-center text-[16px] font-bold leading-relaxed text-stone-500">
            今天留下了一張照片 ❤️
          </p>
        )}

        <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-rose-50/90 via-white to-violet-50/70 px-4 py-3.5 ring-1 ring-rose-100/70">
          <p className="text-center text-[14px] font-extrabold text-stone-800">
            💕 {nameA} ❤️ {nameB}
          </p>
          {together.kind === 'active' ? (
            <p className="mt-1.5 text-center text-[13px] font-bold text-rose-600">
              交往第 {together.days} 天
            </p>
          ) : null}
          <p className="mt-2 text-center text-[12px] font-semibold text-stone-500">
            建立日期：{formatMemoryCreatedDate(note.noteDate)}
          </p>
          {sourceLabel ? (
            <p className="mt-2 text-center text-[12px] font-bold text-stone-600">{sourceLabel}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
