import { ShowcaseMockShell } from '../components/ShowcaseMockShell';

const SEGMENTS = [
  { period: '上午', place: '華山文創園區', activity: '手作市集 · 拍照打卡' },
  { period: '下午', place: '大安森林公園', activity: '野餐 · 散步聊天' },
  { period: '晚餐', place: '信義區景觀餐廳', activity: '燭光晚餐 · 紀念日驚喜' },
];

export function ShowcaseAiDateScreen() {
  return (
    <ShowcaseMockShell>
      <div className="lq-showcase-fade-in flex h-full flex-col">
        <div className="lq-showcase-ai-hero mb-4 rounded-2xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">AI 約會規劃</p>
          <p className="mt-1 text-[20px] font-extrabold leading-snug">週末浪漫一日遊</p>
          <p className="mt-1 text-[13px] text-[#8a7a84]">不知道去哪？交給 AI 安排</p>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden pl-3">
          <span
            className="absolute bottom-2 left-[7px] top-3 w-0.5 rounded-full bg-gradient-to-b from-rose-300 via-pink-300 to-rose-200"
            aria-hidden
          />
          <div className="space-y-3">
            {SEGMENTS.map((seg, i) => (
              <article
                key={seg.period}
                className="lq-showcase-feature-card relative ml-4 rounded-2xl p-3.5 lq-showcase-fade-in"
                style={{ animationDelay: `${100 + i * 100}ms` }}
              >
                <span
                  className="absolute -left-[1.15rem] top-4 flex h-3 w-3 rounded-full bg-rose-400 ring-4 ring-rose-100"
                  aria-hidden
                />
                <span className="inline-block rounded-full bg-rose-100/90 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {seg.period}
                </span>
                <p className="mt-2 text-[15px] font-bold">{seg.place}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#8a7a84]">{seg.activity}</p>
              </article>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="lq-showcase-cta mt-3 w-full rounded-2xl py-3.5 text-[15px] font-bold text-white"
          tabIndex={-1}
        >
          一鍵產生浪漫行程
        </button>
      </div>
    </ShowcaseMockShell>
  );
}
