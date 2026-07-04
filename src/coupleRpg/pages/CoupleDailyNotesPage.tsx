import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyMemoryDetail } from '../components/DailyMemoryDetail';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useDailyNotes } from '../context/DailyNotesContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatNoteDateLabel } from '../lib/dailyNoteDates';
import {
  filterDailyNotesByMonth,
  groupDailyNotesByYearMonth,
  monthTitle,
} from '../lib/dailyNotesGrouping';
import type { CoupleDailyNote } from '../storage/dailyNotesTypes';
import { lq } from '../theme';

type MonthSelection = { year: number; month: number };

export function CoupleDailyNotesPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { notes, loading, canUseDailyNotes, todayNoteDate } = useDailyNotes();
  const { couple, coupleExtended } = useLoveQuest();
  const [selectedMonth, setSelectedMonth] = useState<MonthSelection | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const shelves = useMemo(() => groupDailyNotesByYearMonth(notes), [notes]);
  const monthNotes = useMemo(() => {
    if (!selectedMonth) return [];
    return filterDailyNotesByMonth(notes, selectedMonth.year, selectedMonth.month);
  }, [notes, selectedMonth]);

  const selectedNote = useMemo(
    () => (selectedNoteId ? notes.find((n) => n.id === selectedNoteId) ?? null : null),
    [notes, selectedNoteId]
  );

  if (!canUseDailyNotes) {
    return (
      <div className="px-1 py-4">
        <BackHeader label="返回我的" onBack={() => navigateTo('profile')} />
        <div className={`mt-4 rounded-2xl p-4 ${lq.card}`}>
          <p className="text-[14px] font-semibold text-stone-700">
            請先登入並建立情侶空間，才能使用今日小回憶。
          </p>
        </div>
      </div>
    );
  }

  if (selectedNote) {
    return (
      <DailyMemoryDetail
        note={selectedNote}
        nameA={couple.nameA || '我'}
        nameB={couple.nameB || '另一半'}
        relationshipStart={coupleExtended.relationshipStart ?? ''}
        onBack={() => setSelectedNoteId(null)}
      />
    );
  }

  return (
    <div className="px-1 pb-6">
      <BackHeader
        label={selectedMonth ? '返回月份列表' : '返回我的'}
        onBack={() => {
          if (selectedMonth) setSelectedMonth(null);
          else navigateTo('profile');
        }}
      />

      <header className="mb-4 px-1">
        <h1 className={`text-[20px] font-extrabold ${lq.text}`}>❤️ 今日小回憶</h1>
        <p className="mt-1 text-[13px] font-semibold text-stone-500">
          {selectedMonth
            ? monthTitle(selectedMonth.year, selectedMonth.month)
            : '每天一句話或一張照片，慢慢變成你們的故事。'}
        </p>
      </header>

      {loading && notes.length === 0 ? (
        <p className="px-1 text-[13px] text-stone-500">載入中…</p>
      ) : notes.length === 0 ? (
        <EmptyState onGoTasks={() => navigateTo('tasks')} />
      ) : selectedMonth ? (
        <MonthNotesList
          notes={monthNotes}
          todayNoteDate={todayNoteDate}
          onSelect={(note) => setSelectedNoteId(note.id)}
        />
      ) : (
        <YearMonthShelf shelves={shelves} onSelectMonth={setSelectedMonth} />
      )}
    </div>
  );
}

function YearMonthShelf({
  shelves,
  onSelectMonth,
}: {
  shelves: ReturnType<typeof groupDailyNotesByYearMonth>;
  onSelectMonth: (selection: MonthSelection) => void;
}) {
  return (
    <div className="space-y-4">
      {shelves.map((shelf) => (
        <section key={shelf.year} className={`rounded-2xl p-4 ${lq.card}`}>
          <h2 className="text-[16px] font-extrabold text-stone-900">{shelf.year} 年</h2>
          <ul className="mt-2 divide-y divide-rose-50/80">
            {shelf.months.map((bucket) => (
              <li key={`${bucket.year}-${bucket.month}`}>
                <button
                  type="button"
                  onClick={() => onSelectMonth({ year: bucket.year, month: bucket.month })}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left active:opacity-80"
                >
                  <span className="text-[15px] font-bold text-stone-800">
                    {bucket.month} 月
                    <span className="ml-1.5 text-[13px] font-semibold text-stone-400">
                      （{bucket.count}）
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MonthNotesList({
  notes,
  todayNoteDate,
  onSelect,
}: {
  notes: CoupleDailyNote[];
  todayNoteDate: string;
  onSelect: (note: CoupleDailyNote) => void;
}) {
  if (notes.length === 0) {
    return (
      <div className={`rounded-2xl p-4 ${lq.card}`}>
        <p className="text-[13px] font-semibold text-stone-600">這個月還沒有小回憶。</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const hasText = Boolean(note.content?.trim());
        return (
          <li key={note.id}>
            <button
              type="button"
              onClick={() => onSelect(note)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left active:scale-[0.99] ${lq.card}`}
            >
              {note.photoUrl ? (
                <img
                  src={note.photoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-rose-100"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-rose-600">
                  {formatNoteDateLabel(note.noteDate, todayNoteDate)}
                </p>
                {hasText ? (
                  <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-relaxed text-stone-800">
                    「{note.content}」
                  </p>
                ) : (
                  <p className="mt-1.5 text-[14px] font-semibold text-stone-600">留下了一張照片 ❤️</p>
                )}
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-300" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BackHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 flex items-center gap-0.5 text-[12px] font-bold text-stone-600 active:opacity-70"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

function EmptyState({ onGoTasks }: { onGoTasks: () => void }) {
  return (
    <div className={`rounded-2xl p-5 text-center ${lq.card}`}>
      <p className="text-[14px] font-semibold leading-relaxed text-stone-700">
        你們還沒有留下任何小回憶。
        <br />
        完成今日任務後，可以順手留一句話或一張照片給未來的彼此。
      </p>
      <button
        type="button"
        onClick={onGoTasks}
        className={`mt-4 rounded-2xl px-5 py-2.5 text-[14px] font-extrabold text-white ${lq.btnPrimary}`}
      >
        去完成今日任務
      </button>
    </div>
  );
}
