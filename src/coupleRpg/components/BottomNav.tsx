import type { LucideIcon } from 'lucide-react';
import {
  CalendarHeart,
  ChefHat,
  Home,
  ListChecks,
  Sparkles,
  Images,
  Settings,
} from 'lucide-react';
import { lq } from '../theme';

export type CoupleTabId = 'today' | 'dinner' | 'housework' | 'tasks' | 'rpg' | 'memories' | 'settings';

const TABS: { id: CoupleTabId; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: '今日', Icon: CalendarHeart },
  { id: 'dinner', label: '晚餐', Icon: ChefHat },
  { id: 'housework', label: '家事', Icon: Home },
  { id: 'tasks', label: '任務', Icon: ListChecks },
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
      <div className="mx-auto flex max-w-md justify-between gap-0.5">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 transition active:scale-95 ${
                isActive ? lq.navActive : 'text-stone-600'
              }`}
            >
              <TabIcon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span className={`max-w-full truncate text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
