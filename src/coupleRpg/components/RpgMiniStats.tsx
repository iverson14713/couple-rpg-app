import type { ReactNode } from 'react';
import { Coins, Heart, Sparkles, Users } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

export function RpgMiniStats({ compact }: { compact?: boolean }) {
  const { rpgView } = useLoveQuest();

  if (compact) {
    return (
      <div className="mb-2 flex flex-wrap gap-1.5">
        <MiniHud emoji={<Heart className="h-3 w-3 text-rose-400" />} value={`${rpgView.heartPoints}`} />
        <MiniHud emoji={<Users className="h-3 w-3 text-violet-400" />} value={`${rpgView.compatibility}%`} />
        <MiniHud emoji={<Sparkles className="h-3 w-3 text-amber-500" />} value={`Lv.${rpgView.level}`} />
      </div>
    );
  }

  return (
    <section className={`mb-3 p-3 ${lq.card}`}>
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <StatCell icon={<Heart className="mx-auto h-3.5 w-3.5 text-rose-400" />} label="愛心" value={String(rpgView.heartPoints)} sub={`/${rpgView.heartMax}`} />
        <StatCell icon={<Users className="mx-auto h-3.5 w-3.5 text-violet-400" />} label="默契" value={`${rpgView.compatibility}%`} />
        <StatCell icon={<Coins className="mx-auto h-3.5 w-3.5 text-amber-600" />} label="家事分" value={String(rpgView.houseworkPoints)} />
        <StatCell icon={<Sparkles className="mx-auto h-3.5 w-3.5 text-amber-500" />} label="等級" value={`Lv.${rpgView.level}`} />
      </div>
      <div className="mt-2">
        <div className={`mb-0.5 flex justify-between text-[11px] ${lq.textSecondary}`}>
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

function MiniHud({ emoji, value }: { emoji: ReactNode; value: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${lq.tag}`}>
      {emoji}
      <span className={lq.text}>{value}</span>
    </span>
  );
}

function StatCell({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-xl py-1.5 ${lq.cardSoft}`}>
      <div className="mb-0.5">{icon}</div>
      <p className={`text-[10px] font-semibold ${lq.textSecondary}`}>{label}</p>
      <p className={`text-sm font-bold ${lq.text}`}>
        {value}
        {sub ? <span className={`text-[10px] font-medium ${lq.textMuted}`}>{sub}</span> : null}
      </p>
    </div>
  );
}
