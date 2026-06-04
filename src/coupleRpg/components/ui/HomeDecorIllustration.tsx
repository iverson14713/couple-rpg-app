import type { HomeQuestIconId } from './homeQuestIcons';
import { HOME_QUEST_HERO_ILLUSTRATION, HOME_QUEST_ICONS } from './homeQuestIcons';

export type HomeDecorRole =
  | 'hero'
  | 'banner'
  | 'card'
  | 'cardQuiet'
  | 'anniversary'
  | 'inset';

type Props = {
  id: HomeQuestIconId | 'love-task-hero';
  role: HomeDecorRole;
  className?: string;
};

/** 裝飾層：僅用於推薦卡 / 紀念日（Hero・Banner 改用獨立 img） */
const WRAPPER: Record<HomeDecorRole, string> = {
  hero: 'hidden',
  banner: 'hidden',
  card: 'lq-home-decor-layer pointer-events-none absolute inset-x-0 top-[3.75rem] bottom-[3.5rem] z-0 overflow-visible',
  cardQuiet:
    'lq-home-decor-layer pointer-events-none absolute inset-x-0 top-[3.75rem] bottom-[3.5rem] z-0 overflow-visible',
  anniversary:
    'lq-home-decor-layer pointer-events-none relative z-0 h-16 w-16 shrink-0',
  inset:
    'lq-home-decor-layer pointer-events-none relative z-0 h-11 w-11 shrink-0',
};

const IMG: Record<HomeDecorRole, string> = {
  hero: 'lq-home-decor-img lq-home-decor-img--hero',
  banner: 'lq-home-decor-img lq-home-decor-img--banner',
  card: 'lq-home-decor-img lq-home-decor-img--card',
  cardQuiet: 'lq-home-decor-img lq-home-decor-img--card-quiet',
  anniversary: 'lq-home-decor-img lq-home-decor-img--anniversary',
  inset: 'lq-home-decor-img lq-home-decor-img--inset',
};

/** 首頁背景裝飾插畫 */
export function HomeDecorIllustration({ id, role, className = '' }: Props) {
  const src = id === 'love-task-hero' ? HOME_QUEST_HERO_ILLUSTRATION : HOME_QUEST_ICONS[id];

  return (
    <div className={`${WRAPPER[role]} ${className}`.trim()} aria-hidden>
      <img src={src} alt="" decoding="async" draggable={false} className={IMG[role]} />
    </div>
  );
}

export const HomeQuestIllustration = HomeDecorIllustration;
export type HomeIllustrationRole = HomeDecorRole;
