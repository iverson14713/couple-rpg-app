import { MOCK_RPG, MOCK_STATS } from '../mockData';
import { lq } from '../theme';

export function RpgPage() {
  const xpPct = Math.round((MOCK_RPG.xp / MOCK_RPG.xpNext) * 100);

  return (
    <>
      <section className={`mb-4 overflow-hidden p-5 ${lq.card}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Lv.{MOCK_RPG.level}</p>
            <h1 className="text-2xl font-bold text-stone-900">{MOCK_RPG.title}</h1>
            <p className="mt-1 text-sm text-stone-500">你們的冒險進行中（示範資料）</p>
          </div>
          <span className="text-4xl" aria-hidden>
            ✨
          </span>
        </div>
        <div className="mt-4">
          <XpBar xpPct={xpPct} />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-3">
        <RpgStat label="愛心值" value={String(MOCK_STATS.heartPoints)} />
        <RpgStat label="默契度" value={`${MOCK_STATS.compatibility}%`} />
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-2 text-base font-bold text-stone-900">已解鎖 Buff</h2>
        <ul className="space-y-2">
          {MOCK_RPG.perks.map((perk) => (
            <li
              key={perk}
              className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm font-medium text-stone-700"
            >
              <span aria-hidden>🌟</span>
              {perk}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function XpBar({ xpPct }: { xpPct: number }) {
  return (
    <>
      <div className="mb-1 flex justify-between text-[11px] font-medium text-stone-500">
        <span>經驗值</span>
        <span className={lq.accent}>
          {MOCK_RPG.xp} / {MOCK_RPG.xpNext}
        </span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${lq.progressTrack}`}>
        <div className={`h-full rounded-full ${lq.progress} transition-all`} style={{ width: `${xpPct}%` }} />
      </div>
    </>
  );
}

function RpgStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`p-3 ${lq.cardSoft}`}>
      <p className="text-[11px] font-bold text-stone-500">{label}</p>
      <p className={`text-xl font-bold ${lq.accent}`}>{value}</p>
    </div>
  );
}
