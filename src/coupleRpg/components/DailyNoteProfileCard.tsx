import { ChevronRight } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useDailyNotes } from '../context/DailyNotesContext';
import { lq } from '../theme';

export function DailyNoteProfileCard() {
  const { navigateTo } = useCoupleRpgNav();
  const { todayNote, canUseDailyNotes } = useDailyNotes();

  if (!canUseDailyNotes) return null;

  const hasText = Boolean(todayNote?.content?.trim());
  const hasPhoto = Boolean(todayNote?.photoPath || todayNote?.photoUrl);

  return (
    <button
      type="button"
      onClick={() => navigateTo('dailyNotes')}
      className={`mb-3 w-full rounded-2xl p-4 text-left active:scale-[0.99] ${lq.card}`}
    >
      <div className="flex items-start gap-3">
        {hasPhoto && todayNote?.photoUrl ? (
          <img
            src={todayNote.photoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-rose-100"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-stone-900">❤️ 今日小回憶</p>
          {todayNote ? (
            hasText ? (
              <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-relaxed text-stone-700">
                「{todayNote.content}」
              </p>
            ) : (
              <p className="mt-1.5 text-[13px] font-semibold text-stone-600">
                今天留下了一張照片 ❤️
              </p>
            )
          ) : (
            <p className="mt-1.5 text-[12px] leading-relaxed text-stone-500">
              今天還沒有小回憶
              <br />
              完成今日任務後，留一句話或一張照片給未來的你們。
            </p>
          )}
        </div>
        <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" aria-hidden />
      </div>
    </button>
  );
}
