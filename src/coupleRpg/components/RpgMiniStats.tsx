import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

const STAT_HINTS = {
  heart: '愛心值：近期甜蜜程度（0～100）',
  compat: '默契度：長期配合度（0～100）',
  level: 'EXP 累積可提升情侶等級',
  housework: '家事積分',
  coins: 'LoveCoin：獎勵商城兌換',
} as const;

export function RpgMiniStats({ compact }: { compact?: boolean }) {
  const { rpgView, todayCoinEarned } = useLoveQuest();

  if (compact) {
    return (
      <div className="mb-2 flex flex-wrap gap-1.5">
        <MiniHud emoji="❤️" value={String(rpgView.heartPoints)} hint={STAT_HINTS.heart} />
        <MiniHud emoji="🤝" value={`${rpgView.compatibility}%`} hint={STAT_HINTS.compat} />
        <MiniHud emoji="✨" value={`Lv.${rpgView.level}`} hint={STAT_HINTS.level} />
      </div>
    );
  }

  return (
    <section className={`mb-3 p-3 ${lq.card}`}>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <StatCell emoji="❤️" label="愛心" value={String(rpgView.heartPoints)} hint={STAT_HINTS.heart} sub={`/${rpgView.heartMax}`} />
        <StatCell emoji="🤝" label="默契" value={`${rpgView.compatibility}%`} hint={STAT_HINTS.compat} />
        <StatCell emoji="🏠" label="家事" value={String(rpgView.houseworkPoints)} hint={STAT_HINTS.housework} />
        <StatCell emoji="✨" label="等級" value={`Lv.${rpgView.level}`} hint={STAT_HINTS.level} />
      </div>
      <div className="mt-2">
        <div className={`mb-0.5 flex justify-between text-[11px] ${lq.textSecondary}`}>
          <span>✨ EXP</span>
          <span>
            {rpgView.levelSegmentXp}/{rpgView.xpNext}
          </span>
        </div>
        <div className={`h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
          <div className={`h-full rounded-full ${lq.progress} transition-all`} style={{ width: `${rpgView.xpPct}%` }} />
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-stone-500" title={STAT_HINTS.coins}>
        🪙 今日 +{todayCoinEarned}
      </p>
    </section>
  );
}

function MiniHud({ emoji, value, hint }: { emoji: string; value: string; hint: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${lq.tag}`} title={hint}>
      <span aria-hidden>{emoji}</span>
      <span className={lq.text}>{value}</span>
    </span>
  );
}

function StatCell({
  emoji,
  label,
  value,
  hint,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  hint: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-xl py-1.5 ${lq.cardSoft}`} title={hint}>
      <p className="text-lg leading-none" aria-hidden>
        {emoji}
      </p>
      <p className={`mt-0.5 text-[15px] font-bold leading-none ${lq.text}`}>
        {value}
        {sub ? <span className={`text-[10px] font-medium ${lq.textMuted}`}>{sub}</span> : null}
      </p>
      <p className={`text-[9px] font-medium ${lq.textSecondary}`}>{label}</p>
    </div>
  );
}
