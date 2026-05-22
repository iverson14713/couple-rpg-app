import type { ReactNode } from 'react';

/** 裁切為 mock 手機可視高度，禁止捲動（截圖用） */
export function ShowcaseScrollClip({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none h-full overflow-hidden [&_button]:pointer-events-none">
      <div className="-mt-0.5">{children}</div>
    </div>
  );
}
