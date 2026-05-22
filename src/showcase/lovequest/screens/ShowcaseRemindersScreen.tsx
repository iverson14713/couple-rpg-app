import { ShowcaseMockShell } from '../components/ShowcaseMockShell';

const REMINDERS = [
  { emoji: '💑', title: '交往紀念日', days: 14, date: '2026/06/04' },
  { emoji: '🎂', title: '小柔生日', days: 30, date: '2026/06/20' },
];

export function ShowcaseRemindersScreen() {
  return (
    <ShowcaseMockShell>
      <div className="lq-showcase-fade-in flex h-full flex-col">
        <div className="lq-showcase-reminder-hero mb-4 rounded-3xl p-5">
          <p className="text-[11px] font-bold text-rose-600">今日提醒</p>
          <p className="mt-2 text-[22px] font-extrabold leading-tight">紀念日還有 14 天</p>
          <p className="mt-1 text-[13px] text-[#8a7a84]">提前準備驚喜與安排</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-[48px] font-black leading-none tabular-nums text-rose-500">14</span>
            <span className="pb-2 text-[15px] font-bold text-[#8a7a84]">天</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
          {REMINDERS.map((r, i) => (
            <div
              key={r.title}
              className="lq-showcase-feature-card rounded-2xl p-4 lq-showcase-fade-in"
              style={{ animationDelay: `${80 + i * 90}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <p className="text-[15px] font-bold">{r.title}</p>
                    <p className="text-[12px] text-[#8a7a84]">{r.date}</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[12px] font-extrabold text-rose-700">
                  {r.days} 天
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="lq-showcase-cta-secondary mt-3 w-full rounded-2xl border border-rose-200/60 bg-white/85 py-3 text-[14px] font-bold text-rose-700 backdrop-blur-sm"
          tabIndex={-1}
        >
          ✨ AI 幫我安排紀念日
        </button>
      </div>
    </ShowcaseMockShell>
  );
}
