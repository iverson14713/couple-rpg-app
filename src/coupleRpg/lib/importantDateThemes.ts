import type { ImportantDateKind } from './importantDateEvents';

export type ImportantDateTheme = {
  card: string;
  iconBg: string;
  accent: string;
  muted: string;
  chip: string;
};

const THEMES = {
  pink: {
    card: 'bg-gradient-to-br from-rose-50/95 via-pink-50/80 to-white ring-1 ring-rose-100/80',
    iconBg: 'bg-rose-100/90',
    accent: 'text-rose-700',
    muted: 'text-rose-500/80',
    chip: 'bg-rose-100/70 text-rose-800',
  },
  cream: {
    card: 'bg-gradient-to-br from-amber-50/95 via-yellow-50/70 to-white ring-1 ring-amber-100/80',
    iconBg: 'bg-amber-100/90',
    accent: 'text-amber-800',
    muted: 'text-amber-700/70',
    chip: 'bg-amber-100/80 text-amber-900',
  },
  gold: {
    card: 'bg-gradient-to-br from-amber-50/90 via-[#faf6ef] to-white ring-1 ring-amber-200/50',
    iconBg: 'bg-[#f5e6c8]',
    accent: 'text-amber-900',
    muted: 'text-amber-800/70',
    chip: 'bg-[#f5e6c8] text-amber-950',
  },
  sky: {
    card: 'bg-gradient-to-br from-sky-50/95 via-blue-50/70 to-white ring-1 ring-sky-100/80',
    iconBg: 'bg-sky-100/90',
    accent: 'text-sky-800',
    muted: 'text-sky-600/80',
    chip: 'bg-sky-100/80 text-sky-900',
  },
  green: {
    card: 'bg-gradient-to-br from-emerald-50/95 via-green-50/70 to-white ring-1 ring-emerald-100/80',
    iconBg: 'bg-emerald-100/90',
    accent: 'text-emerald-800',
    muted: 'text-emerald-600/80',
    chip: 'bg-emerald-100/80 text-emerald-900',
  },
  soft: {
    card: 'bg-gradient-to-br from-violet-50/90 via-rose-50/50 to-white ring-1 ring-violet-100/70',
    iconBg: 'bg-violet-100/80',
    accent: 'text-violet-800',
    muted: 'text-violet-600/75',
    chip: 'bg-violet-100/70 text-violet-900',
  },
} as const satisfies Record<string, ImportantDateTheme>;

export function importantDateTheme(kind: ImportantDateKind, name: string): ImportantDateTheme {
  const n = name.trim();
  if (/聖誕|節日|跨年|春節|中秋|端午/.test(n)) return THEMES.green;
  if (/旅行|旅遊|出國|度假/.test(n)) return THEMES.sky;
  if (/求婚/.test(n)) return THEMES.gold;

  switch (kind) {
    case 'together':
      return THEMES.pink;
    case 'partner_birthday':
      return THEMES.cream;
    case 'wedding':
      return THEMES.gold;
    case 'first_date':
      return THEMES.sky;
    default:
      return THEMES.soft;
  }
}
