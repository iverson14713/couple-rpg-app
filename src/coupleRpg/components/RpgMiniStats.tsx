import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

export function RpgMiniStats({ compact }: { compact?: boolean }) {
  const { rpgView } = useLoveQuest();

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <MiniPill emoji="💖" value={`${rpgView.heartPoints}`} />
        <MiniPill emoji="🤝" value={`${rpgView.compatibility}%`} />
        <MiniPill emoji="✨" value={`Lv.${rpgView.level}`} />
      </div>
    );
  }

  return (
    <section className={`mb-4 p-3 ${lq.card}`}>
      <div className="grid grid-cols-4 gap-2 text-center">
        <StatCell label="愛心" value={String(rpgView.heartPoints)} sub={`/${rpgView.heartMax}`} />
        <StatCell label="默契" value={`${rpgView.compatibility}%`} />
        <StatCell label="家事分" value={String(rpgView.houseworkPoints)} />
        <StatCell label="等級" value={`Lv.${rpgView.level}`} />
      </div>
      <div className="mt-2">
        <div className="mb-0.5 flex justify-between text-[10px] text-stone-500">
          <span>EXP（本等級）</span>
          <span>
            {rpgView.levelSegmentXp}/{rpgView.xpNext}
          </span>
        </div>
        <div className={`h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
          <div className={`h-full rounded-full ${lq.progress} transition-all`} style={{ width: `${rpgView.xpPct}%` }} />
        </div>
      </div>
    </section>
  );
}

function MiniPill({ emoji, value }: { emoji: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-800 ring-1 ring-rose-100">
      <span>{emoji}</span>
      {value}
    </span>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={`rounded-xl py-1.5 ${lq.cardSoft}`}>
      <p className="text-[10px] font-bold text-stone-500">{label}</p>
      <p className={`text-sm font-extrabold ${lq.accent}`}>
        {value}
        {sub ? <span className="text-[10px] font-medium text-stone-400">{sub}</span> : null}
      </p>
    </div>
  );
}
