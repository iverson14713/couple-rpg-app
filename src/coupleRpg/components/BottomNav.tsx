import type { LucideIcon } from 'lucide-react';
import { CalendarHeart, UtensilsCrossed, Dices, Images, Heart } from 'lucide-react';
import { lq } from '../theme';

export type CoupleTabId = 'today' | 'life' | 'play' | 'memories' | 'profile';

const TABS: { id: CoupleTabId; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: '今日', Icon: CalendarHeart },
  { id: 'life', label: '生活', Icon: UtensilsCrossed },
  { id: 'play', label: '互動', Icon: Dices },
  { id: 'memories', label: '回憶', Icon: Images },
  { id: 'profile', label: '我的', Icon: Heart },
];

type Props = {
  active: CoupleTabId;
  onChange: (tab: CoupleTabId) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 ${lq.nav}`}
      aria-label="主要功能"
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition active:scale-95 ${
                isActive ? lq.navActive : 'text-stone-600'
              }`}
            >
              <TabIcon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span className={`truncate text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
