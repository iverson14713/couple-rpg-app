import calendarIcon from '../../assets/home-icons/calendar.png';
import choresIcon from '../../assets/home-icons/chores.png';
import dateIcon from '../../assets/home-icons/date.png';
import dinnerIcon from '../../assets/home-icons/dinner.png';
import diceIcon from '../../assets/home-icons/dice.png';
import loveTaskIcon from '../../assets/home-icons/love-task.png';
import loveTaskHeroIcon from '../../assets/home-icons/love-task-hero.png';

/** 首頁附件 3D icon 資產（由使用者提供圖集裁切） */
export type HomeQuestIconId = 'dinner' | 'chores' | 'love-task' | 'date' | 'calendar' | 'dice';

/** Hero 專用高解析愛心火焰主視覺 */
export const HOME_QUEST_HERO_ILLUSTRATION = loveTaskHeroIcon;

export const HOME_QUEST_ICONS: Record<HomeQuestIconId, string> = {
  dinner: dinnerIcon,
  chores: choresIcon,
  'love-task': loveTaskIcon,
  date: dateIcon,
  calendar: calendarIcon,
  dice: diceIcon,
};
