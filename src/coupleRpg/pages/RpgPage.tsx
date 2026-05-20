import { useLoveQuest } from '../context/LoveQuestContext';
import { PageHero } from '../components/ui';
import { lq } from '../theme';

export function RpgPage() {
  const { rpgView, activity } = useLoveQuest();

  const perks = [
    rpgView.level >= 4 ? '週末約會 EXP +10%' : null,
    rpgView.houseworkPoints >= 30 ? '家事達人：完成家事額外獎勵' : null,
    rpgView.compatibility >= 80 ? '心有靈犀：默契度 80+' : null,
    '完成戀愛任務可累積 EXP',
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHero emoji="✨" title="情侶 RPG" subtitle="愛心、默契、等級一起成長" />

      <section className={`mb-3 overflow-hidden p-5 ${lq.card}`}>
        <LevelBlock level={rpgView.level} title={rpgView.title} />
        <XpBar xp={rpgView.levelSegmentXp} xpNext={rpgView.xpNext} pct={rpgView.xpPct} />
      </section>

      <section className="mb-3 grid grid-cols-2 gap-2">
        <BigStat emoji="💖" label="愛心值" value={`${rpgView.heartPoints}`} sub={`/ ${rpgView.heartMax}`} />
        <BigStat emoji="🤝" label="默契度" value={`${rpgView.compatibility}%`} />
        <BigStat emoji="🏠" label="家事積分" value={String(rpgView.houseworkPoints)} />
        <BigStat emoji="⭐" label="情侶等級" value={`Lv.${rpgView.level}`} sub={rpgView.title} />
        <BigStat emoji="💑" label="約會成就" value={String(rpgView.dateAchievements)} sub="次" />
        <BigStat emoji="🎀" label="紀念成就" value={String(rpgView.anniversaryAchievements)} sub="次" />
        <BigStat emoji="🪙" label="愛心幣" value={String(rpgView.loveCoins)} sub="可兌換卡券" />
        <BigStat emoji="🔥" label="連續登入" value={`${rpgView.loginStreak} 天`} />
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">Buff & 提示</h2>
        <ul className="space-y-1.5">
          {perks.map((perk) => (
            <li
              key={perk}
              className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 text-[13px] font-medium text-stone-700"
            >
              <span aria-hidden>🌟</span>
              {perk}
            </li>
          ))}
        </ul>
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">最近動態</h2>
        {activity.length === 0 ? (
          <p className="text-[13px] text-stone-500">完成家事或任務後會顯示在這裡</p>
        ) : (
          <ul className="max-h-48 space-y-1.5 overflow-y-auto">
            {activity.slice(0, 12).map((a) => (
              <li key={a.id} className="text-[12px] leading-snug text-stone-600">
                <span className="text-stone-400">
                  {a.date} {a.time}
                </span>
                <span className="text-stone-800"> · {a.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function LevelBlock({ level, title }: { level: number; title: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Lv.{level}</p>
        <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
      </div>
      <span className="text-4xl" aria-hidden>
        💕
      </span>
    </div>
  );
}

function XpBar({ xp, xpNext, pct }: { xp: number; xpNext: number; pct: number }) {
  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-[11px] font-medium text-stone-500">
        <span>經驗值</span>
        <span className={lq.accent}>
          {xp} / {xpNext}
        </span>
      </div>
      <div className={`h-2.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
        <div className={`h-full rounded-full ${lq.progress} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BigStat({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`p-3 ${lq.card}`}>
      <span className="text-xl">{emoji}</span>
      <p className="mt-0.5 text-[10px] font-bold text-stone-500">{label}</p>
      <p className={`text-lg font-extrabold ${lq.accent}`}>{value}</p>
      {sub ? <p className="truncate text-[10px] text-stone-400">{sub}</p> : null}
    </div>
  );
}
