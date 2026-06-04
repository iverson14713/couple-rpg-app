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
      className={`fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2 ${lq.nav}`}
      aria-label="主要功能"
    >
      <div className="mx-auto flex max-w-md gap-1 rounded-[22px] bg-white/50 p-1 backdrop-blur-xl">
        {TABS.map((tab) => {
          const isActive = tab.id === highlighted;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-1.5 transition duration-200 active:scale-[0.96] ${
                isActive
                  ? 'lq-nav-tab-active bg-gradient-to-b from-rose-50/95 to-white/90 shadow-[0_6px_20px_-6px_rgba(244,114,182,0.45)] ring-1 ring-rose-200/50'
                  : 'bg-transparent active:bg-rose-50/40'
              }`}
            >
              <TabIcon
                className={`h-[24px] w-[24px] shrink-0 transition-colors ${
                  isActive ? 'fill-rose-100 text-rose-600' : 'text-[#9a8a94]'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden
              />
              <span
                className={`truncate text-[13px] leading-tight ${
                  isActive ? 'font-extrabold text-rose-600' : 'font-semibold text-[#9a8a94]'
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
