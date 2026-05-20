import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

export function StatsCard() {
  const { rpgView, rpg, todayCoinEarned } = useLoveQuest();
  const heartPct = Math.round((rpgView.heartPoints / rpgView.heartMax) * 100);

  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <h2 className="mb-3 text-base font-bold text-stone-900">今日戀愛指數</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatBlock
          emoji="💖"
          label="愛心值"
          value={`${rpgView.heartPoints}`}
          sub={`/ ${rpgView.heartMax}`}
          pct={heartPct}
          barClass={lq.progress}
        />
        <StatBlock
          emoji="🤝"
          label="默契度"
          value={`${rpgView.compatibility}%`}
          sub={`Lv.${rpgView.level} ${rpgView.title}`}
          pct={rpgView.compatibility}
          barClass="bg-gradient-to-r from-amber-200 via-pink-300 to-rose-400"
        />
      </div>
      <p className="mt-3 text-center text-[11px] font-semibold text-amber-800">
        🪙 愛心幣 {rpg.loveCoins}
        <span className="text-stone-400"> · 今日 +{todayCoinEarned}</span>
      </p>
    </section>
  );
}

function StatBlock({
  emoji,
  label,
  value,
  sub,
  pct,
  barClass,
}: {
  emoji: string;
  label: string;
  value: string;
  sub: string;
  pct: number;
  barClass: string;
}) {
  return (
    <div className={`rounded-2xl p-3 ${lq.cardSoft}`}>
      <span className="text-2xl">{emoji}</span>
      <p className="mt-1 text-[11px] font-bold text-stone-500">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${lq.accent}`}>{value}</p>
      <p className="truncate text-[10px] text-stone-400">{sub}</p>
      <ProgressTrack pct={pct} barClass={barClass} />
    </div>
  );
}

function ProgressTrack({ pct, barClass }: { pct: number; barClass: string }) {
  return (
    <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
      <div className={`h-full rounded-full ${barClass} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
