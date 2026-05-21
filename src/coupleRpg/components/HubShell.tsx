import type { ReactNode } from 'react';
import { PageHero } from './ui';
import { lq } from '../theme';

export type HubTab = { id: string; label: string; emoji?: string };

type Props = {
  emoji: string;
  title: string;
  subtitle: string;
  tabs: HubTab[];
  active: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
};

export function HubShell({ emoji, title, subtitle, tabs, active, onTabChange, children }: Props) {
  return (
    <>
      <PageHero emoji={emoji} title={title} subtitle={subtitle} />
      <div className={`mb-3 flex gap-1 rounded-2xl p-1 ring-1 ring-rose-100 ${lq.cardSoft}`}>
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-[12px] font-bold transition active:scale-[0.98] ${
                on ? lq.hubTabActive : lq.hubTabIdle
              }`}
            >
              {tab.emoji ? <span className="text-sm">{tab.emoji}</span> : null}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {children}
    </>
  );
}
