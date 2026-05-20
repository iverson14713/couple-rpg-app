import type { LucideIcon } from 'lucide-react';
import {
  CalendarHeart,
  ChefHat,
  Home,
  ListChecks,
  MapPin,
  Cake,
  Sparkles,
  Images,
  Settings,
} from 'lucide-react';
import { lq } from '../theme';

export type CoupleTabId =
  | 'today'
  | 'dinner'
  | 'housework'
  | 'tasks'
  | 'dates'
  | 'anniversaries'
  | 'rpg'
  | 'memories'
  | 'settings';

const TABS: { id: CoupleTabId; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: '今日', Icon: CalendarHeart },
  { id: 'dinner', label: '晚餐', Icon: ChefHat },
  { id: 'housework', label: '家事', Icon: Home },
  { id: 'tasks', label: '任務', Icon: ListChecks },
  { id: 'dates', label: '約會', Icon: MapPin },
  { id: 'anniversaries', label: '紀念', Icon: Cake },
  { id: 'rpg', label: 'RPG', Icon: Sparkles },
  { id: 'memories', label: '回憶', Icon: Images },
  { id: 'settings', label: '設定', Icon: Settings },
];

type Props = {
  active: CoupleTabId;
  onChange: (tab: CoupleTabId) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 ${lq.nav}`}
      aria-label="主要功能"
    >
      <div className="mx-auto flex max-w-md gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-[3.25rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 transition active:scale-95 ${
                isActive ? lq.navActive : 'text-stone-600'
              }`}
            >
              <TabIcon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span className={`max-w-full truncate text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
