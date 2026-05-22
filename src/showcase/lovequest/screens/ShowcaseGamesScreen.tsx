import { ShowcaseMockShell } from '../components/ShowcaseMockShell';

const GAMES = [
  { emoji: '🎲', title: '幸運骰子', sub: '今天誰請客？' },
  { emoji: '💬', title: '真心話', sub: '更認識彼此' },
  { emoji: '🤝', title: '默契挑戰', sub: '同步選答案' },
  { emoji: '💕', title: '情話卡', sub: '隨機甜蜜一句' },
];

export function ShowcaseGamesScreen() {
  return (
    <ShowcaseMockShell>
      <div className="lq-showcase-fade-in flex h-full flex-col">
        <div className="lq-showcase-game-hero mb-4 flex flex-col items-center rounded-3xl px-4 py-6 text-center">
          <span className="lq-showcase-float text-[3.5rem] leading-none">🎲</span>
          <p className="mt-2 text-[18px] font-extrabold">今天玩什麼？</p>
          <p className="mt-1 text-[13px] text-[#8a7a84]">每天都有新的互動</p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 content-start overflow-hidden">
          {GAMES.map((g, i) => (
            <div
              key={g.title}
              className="lq-showcase-feature-card flex flex-col items-center justify-center rounded-2xl p-3.5 text-center lq-showcase-fade-in"
              style={{ animationDelay: `${50 + i * 60}ms` }}
            >
              <span className="text-[2rem] leading-none">{g.emoji}</span>
              <p className="mt-2 text-[13px] font-bold leading-tight">{g.title}</p>
              <p className="mt-0.5 text-[11px] text-[#8a7a84]">{g.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </ShowcaseMockShell>
  );
}
