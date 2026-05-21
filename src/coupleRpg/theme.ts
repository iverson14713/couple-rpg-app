/** LoveQuest couple RPG UI tokens (Tailwind class helpers). */
export const lq = {
  bg: 'bg-gradient-to-b from-rose-50/50 via-white to-stone-50/90',
  bgSolid: 'bg-white',
  /** 主文字 #2B2B2B */
  text: 'text-[#2B2B2B]',
  textSecondary: 'text-stone-500',
  textMuted: 'text-stone-400',
  /** 頁面標題（Tab / Hero 統一） */
  pageTitle: 'text-[20px] font-extrabold leading-tight tracking-tight text-[#2B2B2B]',
  pageSubtitle: 'text-[13px] leading-snug text-stone-500',
  pageEmoji: 'text-[1.75rem] leading-none',
  sectionTitle: 'text-[17px] font-bold tracking-tight text-[#2B2B2B]',
  sectionTitleSm: 'text-[15px] font-bold text-stone-900',
  /** 主內容底部留白（避開固定 Tab + safe area） */
  mainPadBottom: 'pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))]',
  card: 'rounded-2xl border border-stone-200/70 bg-white shadow-[0_8px_28px_-10px_rgba(15,23,42,0.08)]',
  cardSoft: 'rounded-xl border border-stone-200/55 bg-stone-50/90',
  hubTabActive: 'bg-white text-rose-700 shadow-sm ring-1 ring-rose-100',
  hubTabIdle: 'text-stone-500',
  badge: 'rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600 ring-1 ring-stone-200/80',
  badgeAccent: 'rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100',
  nav: 'border-t border-stone-200/80 bg-white/95 backdrop-blur-md shadow-[0_-1px_0_0_rgba(0,0,0,0.04)]',
  /** 底部 Tab：active / inactive 文字與 icon 色 */
  navActive: 'text-rose-500',
  navIdle: 'text-stone-500',
  btnPrimary:
    'inline-flex h-11 min-h-[44px] items-center justify-center rounded-[14px] bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-4 text-[15px] font-semibold text-white shadow-sm shadow-rose-300/35 active:scale-[0.98] disabled:opacity-50',
  btnSecondary:
    'inline-flex h-11 min-h-[44px] items-center justify-center rounded-[14px] border border-stone-200 bg-white px-4 text-[15px] font-semibold text-[#2B2B2B] active:scale-[0.98] disabled:opacity-50',
  btnCompact:
    'inline-flex h-9 min-h-[36px] items-center justify-center rounded-[12px] bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-3 text-[13px] font-semibold text-white shadow-sm shadow-rose-300/30 active:scale-[0.98]',
  accent: 'text-rose-500',
  accentBg: 'bg-rose-50',
  tag: 'rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 ring-1 ring-stone-200/80',
  progress: 'bg-gradient-to-r from-rose-300 via-pink-400 to-rose-400',
  progressTrack: 'bg-stone-100',
  strip: 'border-stone-200/70 bg-stone-50/90',
  themeColor: '#f9a8d4',
} as const;

export const APP_NAME = 'LoveQuest 情侶生活';
export const APP_NAME_EN = 'LoveQuest';
