import { ShowcaseMockShell } from '../components/ShowcaseMockShell';

const TASKS = [
  { emoji: '💌', label: '今日戀愛任務', pts: '+20' },
  { emoji: '🧹', label: '完成家事', pts: '+15' },
  { emoji: '💑', label: '週末約會', pts: '+40' },
];

export function ShowcaseRpgScreen() {
  return (
    <ShowcaseMockShell>
      <div className="lq-showcase-fade-in relative flex h-full flex-col overflow-hidden">
        <span className="lq-showcase-heart-particle lq-showcase-heart-particle--1" aria-hidden>
          ❤️
        </span>
        <span className="lq-showcase-heart-particle lq-showcase-heart-particle--2" aria-hidden>
          ✨
        </span>

        <div className="lq-showcase-rpg-hero mb-4 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-200/95">情侶等級</p>
              <p className="text-[32px] font-black leading-none text-white">Lv.12</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-rose-100">默契</p>
              <p className="text-[24px] font-extrabold text-white">86%</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/25">
            <div className="lq-showcase-progress h-full w-[72%] rounded-full" />
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-rose-50/90">EXP 2,160 / 3,000</p>
        </div>

        <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-rose-100/50">
          <span className="text-[14px] font-bold">🪙 LoveCoin</span>
          <span className="text-[20px] font-extrabold tabular-nums text-rose-600">1,280</span>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
          {TASKS.map((t, i) => (
            <div
              key={t.label}
              className="lq-showcase-feature-card flex items-center justify-between rounded-2xl px-3.5 py-3 lq-showcase-fade-in"
              style={{ animationDelay: `${60 + i * 70}ms` }}
            >
              <span className="flex items-center gap-2 text-[14px] font-bold">
                <span>{t.emoji}</span>
                {t.label}
              </span>
              <span className="text-[13px] font-extrabold text-rose-600">{t.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </ShowcaseMockShell>
  );
}
