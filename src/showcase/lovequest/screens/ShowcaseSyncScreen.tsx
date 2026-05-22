import { ShowcaseMockShell } from '../components/ShowcaseMockShell';

const SYNC_ITEMS = [
  { emoji: '🍽️', label: '晚餐同步', value: '今晚：義式小館', ok: true },
  { emoji: '🧹', label: '家事同步', value: '本週 4/6 完成', ok: true },
  { emoji: '✨', label: 'AI 行程', value: '週末約會已排好', ok: true },
  { emoji: '🪙', label: 'LoveCoin', value: '+128 今日', ok: false },
];

export function ShowcaseSyncScreen() {
  return (
    <ShowcaseMockShell>
      <div className="lq-showcase-fade-in flex h-full flex-col">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex -space-x-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl ring-2 ring-white">
              💗
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-2xl ring-2 ring-white">
              💙
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold leading-tight">阿明 & 小柔</p>
            <p className="text-[12px] font-medium text-[#8a7a84]">一起經營戀愛生活</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <div className="lq-showcase-stat-card lq-showcase-float-delay-1 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-rose-500">LoveCoin</p>
            <p className="mt-1 text-[22px] font-extrabold tabular-nums text-[#3a2e34]">1,280</p>
          </div>
          <div className="lq-showcase-stat-card lq-showcase-float-delay-2 rounded-2xl p-3.5">
            <p className="text-[11px] font-bold text-rose-500">默契值</p>
            <p className="mt-1 text-[22px] font-extrabold tabular-nums text-[#3a2e34]">86%</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden">
          {SYNC_ITEMS.map((item, i) => (
            <div
              key={item.label}
              className={`lq-showcase-feature-card flex items-center gap-3 rounded-2xl px-3.5 py-3 lq-showcase-fade-in`}
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 text-xl shadow-sm">
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{item.label}</p>
                <p className="text-[12px] text-[#8a7a84]">{item.value}</p>
              </div>
              {item.ok ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  已同步
                </span>
              ) : (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                  即時
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </ShowcaseMockShell>
  );
}
