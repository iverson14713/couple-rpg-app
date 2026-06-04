import type { ReactNode } from 'react';
import {
  Brush,
  CalendarHeart,
  Dices,
  Flame,
  Heart,
  Mail,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react';

/** LoveQuest 首頁統一 3D 擬物 icon（CSS + Lucide，無外部圖片） */
export type SoftIconVariant =
  | 'heroHeart'
  | 'flame'
  | 'calendar'
  | 'dinner'
  | 'chores'
  | 'date'
  | 'dice'
  | 'loveTask';

const SIZE = {
  xs: { box: 'h-6 w-6 rounded-[10px]', glyph: 'h-[42%] w-[42%]' },
  sm: { box: 'h-9 w-9 rounded-[14px]', glyph: 'h-[48%] w-[48%]' },
  /** 今日推薦卡：比 feature 略小約 12% */
  rec: { box: 'h-[2.65rem] w-[2.65rem] rounded-[15px]', glyph: 'h-[50%] w-[50%]' },
  feature: { box: 'h-12 w-12 rounded-[16px]', glyph: 'h-[50%] w-[50%]' },
  md: { box: 'h-11 w-11 rounded-[18px]', glyph: 'h-[50%] w-[50%]' },
  lg: { box: 'h-14 w-14 rounded-[20px]', glyph: 'h-[52%] w-[52%]' },
} as const;

type Size = keyof typeof SIZE;

type VariantStyle = {
  surface: string;
  glow: string;
  ring: string;
  rim: string;
  accent?: string;
};

const VARIANT: Record<SoftIconVariant, VariantStyle> = {
  heroHeart: {
    surface:
      'bg-[radial-gradient(circle_at_28%_18%,#fff5f8_0%,#fecdd3_32%,#fb7185_58%,#e11d48_92%)]',
    glow: 'shadow-[0_12px_26px_-8px_rgba(225,29,72,0.55)]',
    ring: 'ring-1 ring-white/50',
    rim: 'from-rose-200/80 to-rose-600/40',
  },
  flame: {
    surface:
      'bg-[radial-gradient(circle_at_30%_16%,#fffbeb_0%,#fde68a_38%,#fb923c_65%,#ea580c_100%)]',
    glow: 'shadow-[0_8px_18px_-6px_rgba(234,88,12,0.48)]',
    ring: 'ring-1 ring-amber-50/80',
    rim: 'from-amber-100/90 to-orange-500/35',
  },
  calendar: {
    surface:
      'bg-[radial-gradient(circle_at_26%_14%,#ffffff_0%,#fff1f2_38%,#fda4af_85%,#f43f5e_100%)]',
    glow: 'shadow-[0_10px_22px_-8px_rgba(244,114,182,0.42)]',
    ring: 'ring-1 ring-rose-100/70',
    rim: 'from-white to-rose-300/50',
    accent: 'bg-rose-400',
  },
  dinner: {
    surface:
      'bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#fff7ed_40%,#fdba74_82%,#f97316_100%)]',
    glow: 'shadow-[0_10px_20px_-8px_rgba(249,115,22,0.38)]',
    ring: 'ring-1 ring-orange-100/75',
    rim: 'from-white to-orange-300/45',
  },
  chores: {
    surface:
      'bg-[radial-gradient(circle_at_28%_18%,#fff5f8_0%,#f9a8d4_42%,#ec4899_78%,#db2777_100%)]',
    glow: 'shadow-[0_10px_20px_-8px_rgba(236,72,153,0.4)]',
    ring: 'ring-1 ring-pink-100/65',
    rim: 'from-pink-50 to-pink-500/40',
  },
  date: {
    surface:
      'bg-[radial-gradient(circle_at_26%_16%,#ffffff_0%,#e0f2fe_42%,#7dd3fc_88%,#38bdf8_100%)]',
    glow: 'shadow-[0_10px_20px_-8px_rgba(56,189,248,0.36)]',
    ring: 'ring-1 ring-sky-100/70',
    rim: 'from-white to-sky-300/45',
  },
  dice: {
    surface:
      'bg-[radial-gradient(circle_at_26%_14%,#ffffff_0%,#fae8ff_42%,#e9d5ff_80%,#c084fc_100%)]',
    glow: 'shadow-[0_12px_24px_-8px_rgba(167,139,250,0.48)]',
    ring: 'ring-1 ring-violet-100/70',
    rim: 'from-white to-violet-400/40',
  },
  loveTask: {
    surface:
      'bg-[radial-gradient(circle_at_28%_18%,#fff5f8_0%,#fecdd3_40%,#fb7185_78%,#f43f5e_100%)]',
    glow: 'shadow-[0_10px_20px_-8px_rgba(244,114,182,0.4)]',
    ring: 'ring-1 ring-rose-100/65',
    rim: 'from-rose-50 to-rose-500/38',
  },
};

function DefaultGlyph({ variant, className }: { variant: SoftIconVariant; className: string }) {
  const stroke = 2.35;
  switch (variant) {
    case 'heroHeart':
      return <Heart className={`${className} fill-white text-rose-50`} strokeWidth={stroke} />;
    case 'flame':
      return <Flame className={`${className} text-amber-50`} strokeWidth={stroke} />;
    case 'calendar':
      return <CalendarHeart className={`${className} text-rose-600`} strokeWidth={stroke} />;
    case 'dinner':
      return <UtensilsCrossed className={`${className} text-orange-700`} strokeWidth={stroke} />;
    case 'chores':
      return <Brush className={`${className} text-pink-700`} strokeWidth={stroke} />;
    case 'date':
      return <MapPin className={`${className} fill-rose-400 text-rose-500`} strokeWidth={stroke} />;
    case 'dice':
      return <Dices className={`${className} text-violet-700`} strokeWidth={stroke} />;
    case 'loveTask':
      return <Mail className={`${className} text-rose-600`} strokeWidth={stroke} />;
    default:
      return <Heart className={className} strokeWidth={stroke} />;
  }
}

const LEGACY_TONE: Record<string, SoftIconVariant> = {
  rose: 'loveTask',
  hero: 'heroHeart',
  white: 'dice',
  violet: 'date',
  amber: 'dinner',
  sky: 'chores',
};

type Props = {
  /** @deprecated 請用 variant 內建 Lucide 圖示 */
  emoji?: string;
  icon?: ReactNode;
  variant?: SoftIconVariant;
  tone?: keyof typeof LEGACY_TONE;
  size?: Size;
  className?: string;
  ariaHidden?: boolean;
};

/**
 * 統一 3D 粉紅擬物容器：外圈光暈 + 內凹高光 + Lucide 主圖（非裸 emoji）
 */
export function SoftIconBadge({
  emoji,
  icon,
  variant,
  tone,
  size = 'md',
  className = '',
  ariaHidden = true,
}: Props) {
  const v = variant ?? (tone ? LEGACY_TONE[tone] : undefined) ?? 'loveTask';
  const style = VARIANT[v];
  const dim = SIZE[size];
  const glyph = icon ?? (emoji ? (
    <span className="select-none text-[1em] leading-none opacity-90 saturate-[1.15]">{emoji}</span>
  ) : (
    <DefaultGlyph variant={v} className={dim.glyph} />
  ));

  return (
    <span
      className={`lq-soft-badge relative inline-flex shrink-0 items-center justify-center ${dim.box} ${style.glow} ${className}`}
      aria-hidden={ariaHidden}
    >
      <span
        className="pointer-events-none absolute inset-x-[8%] bottom-[-22%] h-[42%] rounded-full bg-rose-400/30 blur-[6px]"
        aria-hidden
      />
      <span
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${dim.box} bg-gradient-to-br ${style.rim} p-[2px] ${style.ring}`}
      >
        <span
          className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit] ${style.surface} shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1),inset_0_3px_8px_rgba(255,255,255,0.72)]`}
        >
          {style.accent ? (
            <span
              className={`pointer-events-none absolute inset-x-[14%] top-[10%] h-[18%] rounded-sm ${style.accent} opacity-90 shadow-sm`}
              aria-hidden
            />
          ) : null}
          <span
            className="pointer-events-none absolute left-[8%] top-[6%] h-[42%] w-[48%] rounded-full bg-white/75 blur-[1.5px]"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-[10%] right-[10%] h-[20%] w-[30%] rounded-full bg-white/20"
            aria-hidden
          />
          <span className="relative z-[1] flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
            {glyph}
          </span>
        </span>
      </span>
    </span>
  );
}
