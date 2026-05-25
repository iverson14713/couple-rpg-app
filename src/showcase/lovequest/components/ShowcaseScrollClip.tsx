import type { ReactNode } from 'react';
import { ShowcasePhoneContentFit } from './ShowcasePhoneContentFit';

/** 上架截圖：內容自動縮放進手機螢幕，禁止捲動 */
export function ShowcaseScrollClip({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none h-full overflow-hidden [&_button]:pointer-events-none">
      <ShowcasePhoneContentFit>{children}</ShowcasePhoneContentFit>
    </div>
  );
}
