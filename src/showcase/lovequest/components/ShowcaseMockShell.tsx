import type { ReactNode } from 'react';
import { DEVICE_LOGICAL_W, LQ_SHOWCASE_FONT } from '../constants';

type Props = {
  children: ReactNode;
};

/** 上架截圖用 App 內容區：無 Tab、無 debug、固定高度、不捲動 */
export function ShowcaseMockShell({ children }: Props) {
  return (
    <section
      className="lq-showcase-mock-app flex h-full flex-col overflow-hidden bg-[#fef9fb] text-[#3a2e34]"
      style={{ width: DEVICE_LOGICAL_W, fontFamily: LQ_SHOWCASE_FONT }}
    >
      <header className="flex shrink-0 items-center justify-between px-5 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <span className="text-[11px] font-semibold tabular-nums text-[#3a2e34]/90">9:41</span>
        <span className="text-[10px] font-bold tracking-wide text-rose-400">LoveQuest</span>
        <span className="text-[10px] font-semibold text-[#9a8a94]" aria-hidden>
          ●●●
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">{children}</div>
    </section>
  );
}
