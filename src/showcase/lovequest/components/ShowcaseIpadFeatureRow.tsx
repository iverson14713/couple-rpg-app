import { IPAD_LAYOUT } from '../ipadConstants';

const FEATURES = [
  {
    emoji: '📋',
    title: '每日任務',
    desc: '一起完成，讓愛升溫',
    gradient: 'from-rose-100/95 to-pink-50/90',
    ring: 'ring-rose-100/80',
  },
  {
    emoji: '🎮',
    title: '情侶小遊戲',
    desc: '默契挑戰，增進感情',
    gradient: 'from-violet-100/95 to-purple-50/90',
    ring: 'ring-violet-100/80',
    hot: true,
  },
  {
    emoji: '💡',
    title: 'AI 約會靈感',
    desc: '不知道去哪？AI 幫你想',
    gradient: 'from-amber-100/95 to-orange-50/90',
    ring: 'ring-amber-100/80',
  },
  {
    emoji: '🎁',
    title: '紀念日提醒',
    desc: '重要日子不錯過',
    gradient: 'from-sky-100/95 to-blue-50/90',
    ring: 'ring-sky-100/80',
  },
] as const;

export function ShowcaseIpadFeatureRow() {
  const { padX, featureRowGap } = IPAD_LAYOUT;

  return (
    <div
      className="lq-ipad-feature-row relative z-20 grid shrink-0 grid-cols-4"
      style={{
        paddingLeft: padX,
        paddingRight: padX,
        gap: featureRowGap,
      }}
    >
      {FEATURES.map((f) => (
        <article
          key={f.title}
          className={`relative flex flex-col rounded-[32px] bg-gradient-to-b ${f.gradient} p-6 shadow-[0_16px_40px_-16px_rgba(190,24,93,0.22)] ring-1 ${f.ring}`}
        >
          {'hot' in f && f.hot ? (
            <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-2.5 py-0.5 text-[18px] font-extrabold text-white shadow-sm">
              HOT
            </span>
          ) : null}
          <span className="text-[52px] leading-none" aria-hidden>
            {f.emoji}
          </span>
          <h3 className="mt-4 text-[34px] font-extrabold leading-tight text-[#3a2e34]">{f.title}</h3>
          <p className="mt-2 text-[24px] font-semibold leading-snug text-[#8a7a84]">{f.desc}</p>
        </article>
      ))}
    </div>
  );
}
