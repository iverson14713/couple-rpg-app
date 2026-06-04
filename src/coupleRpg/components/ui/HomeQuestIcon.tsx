import type { HomeQuestIconId } from './homeQuestIcons';
import { HOME_QUEST_ICONS } from './homeQuestIcons';

const SIZE_CLASS = {
  rec: 'h-[2.65rem] w-[2.65rem]',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  hero: 'h-16 w-16',
  deco: 'h-20 w-20',
} as const;

type Size = keyof typeof SIZE_CLASS;

type Props = {
  id: HomeQuestIconId;
  size?: Size;
  className?: string;
  alt?: string;
};

/** 首頁統一 3D 圖示（PNG 資產，取代 CSS/Lucide 推薦卡 icon） */
export function HomeQuestIcon({ id, size = 'rec', className = '', alt = '' }: Props) {
  return (
    <img
      src={HOME_QUEST_ICONS[id]}
      alt={alt}
      width={256}
      height={256}
      draggable={false}
      className={`shrink-0 object-contain drop-shadow-[0_4px_10px_rgba(168,120,150,0.18)] ${SIZE_CLASS[size]} ${className}`.trim()}
    />
  );
}
