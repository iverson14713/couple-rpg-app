import type { LucideIcon } from 'lucide-react';
import { Brush, Gift, Home, User, UtensilsCrossed } from 'lucide-react';
import { bottomNavHighlight, type CoupleNavTabId } from '../context/CoupleRpgNavContext';
import type { CoupleTabId } from '../context/CoupleRpgNavContext';
import { lq } from '../theme';

const TABS: { id: CoupleNavTabId; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: '首頁', Icon: Home },
  { id: 'dinner', label: '晚餐', Icon: UtensilsCrossed },
  { id: 'housework', label: '家事', Icon: Brush },
  { id: 'rewards', label: '獎勵', Icon: Gift },
  { id: 'profile', label: '我的', Icon: User },
];

type Props = {
  activeTab: CoupleTabId;
  onChange: (tab: CoupleNavTabId) => void;
};

export function BottomNav({ activeTab, onChange }: Props) {
  const highlighted = bottomNavHighlight(activeTab);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 ${lq.nav}`}
      aria-label="主要功能"
    >
      <div className="mx-auto flex max-w-md gap-0.5">
        {TABS.map((tab) => {
          const isActive = tab.id === highlighted;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition duration-200 active:scale-[0.97] ${
                isActive ? lq.navItemActive : 'bg-transparent active:bg-rose-50/50'
              }`}
            >
              <TabIcon
                className={`h-[26px] w-[26px] shrink-0 transition-colors ${
                  isActive ? lq.navActive : lq.navIdle
                }`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden
              />
              <span
                className={`truncate text-[12px] leading-tight ${
                  isActive ? `font-bold ${lq.navActive}` : `font-medium ${lq.navIdle}`
                }`}
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
