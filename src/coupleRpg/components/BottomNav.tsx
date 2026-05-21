import type { LucideIcon } from 'lucide-react';
import { Home, ChefHat, ClipboardList, Gift, Heart } from 'lucide-react';
import { bottomNavHighlight, type CoupleNavTabId } from '../context/CoupleRpgNavContext';
import type { CoupleTabId } from '../context/CoupleRpgNavContext';
import { lq } from '../theme';

const TABS: { id: CoupleNavTabId; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: '首頁', Icon: Home },
  { id: 'dinner', label: '晚餐', Icon: ChefHat },
  { id: 'housework', label: '家事', Icon: ClipboardList },
  { id: 'rewards', label: '獎勵', Icon: Gift },
  { id: 'profile', label: '我的', Icon: Heart },
];

type Props = {
  activeTab: CoupleTabId;
  onChange: (tab: CoupleNavTabId) => void;
};

export function BottomNav({ activeTab, onChange }: Props) {
  const highlighted = bottomNavHighlight(activeTab);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 ${lq.nav}`}
      aria-label="主要功能"
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const isActive = tab.id === highlighted;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition active:opacity-80 ${
                isActive ? lq.navActive : lq.navIdle
              }`}
            >
              <TabIcon className="h-[22px] w-[22px] shrink-0" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
              <span
                className={`truncate text-[11px] leading-tight ${isActive ? 'font-semibold text-rose-500' : 'font-medium text-stone-400'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
