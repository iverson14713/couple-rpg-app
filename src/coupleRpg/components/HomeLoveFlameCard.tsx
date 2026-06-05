import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

export function HomeLoveFlameCard() {
  const { loveFlameView } = useLoveQuest();
  const { title, headline, subline, todayRecorded, currentStreak, streakBroken } = loveFlameView;

  return (
    <section className={`relative overflow-hidden p-4 ${lq.cardElevated}`}>
      <span className="absolute -right-2 -top-2 text-5xl opacity-[0.07]" aria-hidden>
        🔥
      </span>
      <div className="relative">
        <p className={lq.label}>{title}</p>
        <h3 className={`mt-0.5 text-[18px] font-extrabold leading-snug ${lq.text}`}>{headline}</h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              todayRecorded
                ? 'bg-emerald-100/90 text-emerald-800 ring-1 ring-emerald-200/80'
                : 'bg-amber-100/90 text-amber-900 ring-1 ring-amber-200/80'
            }`}
          >
            {todayRecorded ? '今日：已延續' : '今日：尚未延續'}
          </span>
          <span className={`text-[13px] font-extrabold ${lq.text}`}>
            {streakBroken ? '連續互動已中斷' : `連續互動 ${currentStreak} 天`}
          </span>
        </div>

        <p className={`mt-2 text-[13px] leading-snug ${lq.textSecondary}`}>{subline}</p>
      </div>
    </section>
  );
}
