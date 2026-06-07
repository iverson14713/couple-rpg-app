import type { LoveQuestShowcaseSlide } from '../slides';
import { IPAD_LAYOUT } from '../ipadConstants';

type Props = {
  slide: LoveQuestShowcaseSlide;
};

export function ShowcaseIpadLeftColumn({ slide }: Props) {
  const { brandSize, headlineSize, subtitleSize, pillSize, bulletSize, bulletSubSize, coupleMaxW, coupleMaxH } =
    IPAD_LAYOUT;
  const bullets = slide.ipadBullets ?? [];
  const headlineLines = slide.ipadHeadlineLines ?? [slide.headline];
  const compact = bullets.length >= 4;
  const effectiveHeadline = compact ? Math.round(headlineSize * 0.9) : headlineSize;

  return (
    <div className="lq-ipad-left relative flex h-full min-h-0 flex-col overflow-visible">
      <p
        className="font-semibold tracking-[0.08em] text-rose-400"
        style={{ fontSize: brandSize }}
      >
        LoveQuest
      </p>
      <span className="mt-2 block text-[36px] leading-none" aria-hidden>
        💗
      </span>

      <h1
        className="lq-ipad-headline mt-5 font-extrabold leading-[1.06] tracking-tight text-white"
        style={{
          fontSize: effectiveHeadline,
          textShadow: '0 3px 12px rgba(190,24,93,0.38), 0 1px 4px rgba(0,0,0,0.12)',
        }}
      >
        {headlineLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>

      <p
        className="mt-4 font-bold leading-[1.35] text-rose-900/90"
        style={{ fontSize: subtitleSize, color: '#9f1239' }}
      >
        {slide.subtitle}
      </p>

      {slide.ipadPill ? (
        <span
          className="mt-5 inline-flex w-fit max-w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-bold text-white shadow-[0_8px_24px_-8px_rgba(190,24,93,0.55)]"
          style={{ fontSize: pillSize }}
        >
          {slide.ipadPill}
        </span>
      ) : null}

      {bullets.length > 0 ? (
        <ul className={`${compact ? 'mt-5 space-y-3' : 'mt-8 space-y-5'}`}>
          {bullets.map((b) => (
            <li key={b.title} className="flex items-start gap-4">
              <span
                className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-white/75 text-[30px] shadow-sm ring-1 ring-rose-100/80"
                aria-hidden
              >
                {b.icon}
              </span>
              <span className="min-w-0 pt-1">
                <span className="block font-extrabold leading-snug text-[#3a2e34]" style={{ fontSize: bulletSize }}>
                  {b.title}
                </span>
                <span className="mt-1 block font-semibold leading-snug text-[#8a7a84]" style={{ fontSize: bulletSubSize }}>
                  {b.desc}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`lq-ipad-couple-wrap flex items-end ${compact ? 'mt-4' : 'mt-auto'} pt-2`}>
        <img
          src="/showcase/couple-illustration.png"
          alt=""
          className="lq-ipad-couple-art pointer-events-none max-w-full object-contain object-left-bottom"
          style={{
            maxWidth: compact ? coupleMaxW * 0.88 : coupleMaxW,
            maxHeight: compact ? coupleMaxH * 0.78 : coupleMaxH,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
