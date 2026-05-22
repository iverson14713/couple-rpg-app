/** LoveQuest couple RPG UI tokens — 柔和粉白、玻璃層次、戀愛 App 質感 */
export const lq = {
  /** 頁面背景（見 index.css `.lq-app-shell`） */
  bg: 'lq-app-shell',
  bgSolid: 'bg-[#fef8fa]/92 backdrop-blur-md',

  /** 字體層級 — 暖灰粉，避免純黑 / 冷灰 */
  text: 'text-[#3a2e34]',
  textSecondary: 'text-[#8a7a84]',
  textMuted: 'text-[#b8abb3]',
  textHint: 'text-[#c9bcc4]',

  pageTitle: 'text-[20px] font-extrabold leading-tight tracking-tight text-[#3a2e34]',
  pageSubtitle: 'text-[13px] leading-snug text-[#8a7a84]',
  pageEmoji: 'text-[1.75rem] leading-none',
  sectionTitle: 'text-[17px] font-bold tracking-tight text-[#3a2e34]',
  sectionTitleSm: 'text-[15px] font-bold text-[#4a3c44]',
  label: 'text-[11px] font-semibold uppercase tracking-wide text-[#9a8a94]',

  mainPadBottom: 'pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))]',

  /** 一般卡片 — 半透明 + blur + 粉光陰影 */
  card:
    'rounded-2xl border border-rose-200/45 bg-white/70 backdrop-blur-md shadow-[0_10px_36px_-14px_rgba(244,114,182,0.24),0_2px_10px_-6px_rgba(168,120,150,0.1)] ring-1 ring-white/55',

  /** 首頁大區塊 / 情侶總覽 */
  cardElevated:
    'rounded-3xl border border-rose-200/50 bg-gradient-to-b from-white/82 via-rose-50/55 to-[#faf5f7]/88 backdrop-blur-md shadow-[0_14px_44px_-16px_rgba(244,114,182,0.3),0_4px_18px_-8px_rgba(216,180,254,0.1)] ring-1 ring-white/50',

  /** 重要日子 Hero — 參考標竿 */
  cardHero:
    'rounded-3xl border border-rose-200/55 bg-gradient-to-br from-rose-50/92 via-white/78 to-pink-50/88 backdrop-blur-md shadow-[0_16px_48px_-16px_rgba(244,114,182,0.32),0_4px_22px_-8px_rgba(216,180,254,0.14)] ring-1 ring-rose-100/45',

  /** 功能小卡 / 網格卡 */
  cardFeature:
    'rounded-2xl border border-rose-100/50 bg-white/68 backdrop-blur-sm shadow-[0_8px_28px_-12px_rgba(244,114,182,0.22),0_2px_8px_-6px_rgba(190,130,160,0.08)] ring-1 ring-white/48',

  cardSoft:
    'rounded-xl border border-rose-100/42 bg-rose-50/38 backdrop-blur-sm shadow-[0_4px_18px_-10px_rgba(244,114,182,0.14)]',

  hubTabActive:
    'bg-white/88 text-rose-700 shadow-[0_4px_18px_-6px_rgba(244,114,182,0.28)] ring-1 ring-rose-100/65 backdrop-blur-sm',
  hubTabIdle: 'text-[#9a8a94]',

  badge:
    'rounded-full bg-rose-50/75 px-2.5 py-1 text-[11px] font-bold text-[#6b5a64] ring-1 ring-rose-100/55 backdrop-blur-sm',
  badgeAccent:
    'rounded-full bg-rose-100/65 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200/45',

  nav:
    'border-t border-rose-200/38 bg-white/78 backdrop-blur-xl shadow-[0_-14px_44px_-14px_rgba(244,114,182,0.22),inset_0_1px_0_0_rgba(255,255,255,0.7)]',

  navActive: 'text-rose-600',
  navIdle: 'text-[#9a8a94]',
  navItemActive:
    'lq-nav-tab-active -translate-y-0.5 bg-white/90 shadow-[0_8px_28px_-8px_rgba(244,114,182,0.42),0_0_0_1px_rgba(251,113,133,0.12)] ring-1 ring-rose-100/75 backdrop-blur-sm',

  btnPrimary:
    'inline-flex h-11 min-h-[44px] items-center justify-center rounded-[14px] bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-4 text-[15px] font-semibold text-white shadow-[0_6px_22px_-6px_rgba(244,114,182,0.45)] active:scale-[0.98] disabled:opacity-50',
  btnSecondary:
    'inline-flex h-11 min-h-[44px] items-center justify-center rounded-[14px] border border-rose-200/55 bg-white/72 px-4 text-[15px] font-semibold text-[#3a2e34] shadow-[0_4px_16px_-10px_rgba(244,114,182,0.15)] backdrop-blur-sm active:scale-[0.98] disabled:opacity-50',
  btnCompact:
    'inline-flex h-9 min-h-[36px] items-center justify-center rounded-[12px] bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-3 text-[13px] font-semibold text-white shadow-[0_4px_18px_-6px_rgba(244,114,182,0.38)] active:scale-[0.98]',

  accent: 'text-rose-600',
  accentBg: 'bg-rose-50/70',
  tag: 'rounded-full bg-rose-50/60 px-2 py-0.5 text-[11px] font-semibold text-[#7a6a74] ring-1 ring-rose-100/50',
  progress: 'bg-gradient-to-r from-rose-300 via-pink-400 to-rose-400',
  progressTrack: 'bg-rose-100/55',
  strip:
    'rounded-2xl border border-rose-200/40 bg-white/62 backdrop-blur-md shadow-[0_6px_24px_-12px_rgba(244,114,182,0.18)] ring-1 ring-white/50',

  /** 標題旁 emoji / 圖示底 */
  iconChip:
    'flex shrink-0 items-center justify-center rounded-2xl bg-white/72 shadow-[0_4px_16px_-8px_rgba(244,114,182,0.2)] ring-1 ring-rose-100/60 backdrop-blur-sm',

  input:
    'rounded-xl border border-rose-200/45 bg-white/72 px-3 py-2.5 text-[15px] text-[#3a2e34] placeholder:text-[#c9bcc4] outline-none backdrop-blur-sm focus:border-rose-300/70 focus:ring-1 focus:ring-rose-200/55',

  hubChipActive:
    'scale-[1.02] border-rose-300/70 bg-rose-50/85 shadow-[0_4px_18px_-8px_rgba(244,114,182,0.28)] ring-1 ring-rose-100/55 backdrop-blur-sm',
  hubChipIdle:
    'border-rose-100/45 bg-white/62 shadow-[0_2px_10px_-8px_rgba(244,114,182,0.1)] ring-1 ring-white/40 backdrop-blur-sm',

  themeColor: '#f9a8d4',
} as const;

export const APP_NAME = 'LoveQuest 情侶生活';
export const APP_NAME_EN = 'LoveQuest';
