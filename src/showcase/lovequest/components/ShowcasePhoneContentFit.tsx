import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** 將 mock 螢幕內容等比縮放至可視高度，避免 overflow:hidden 裁掉時間軸等區塊 */
export function ShowcasePhoneContentFit({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const fit = () => {
      const available = container.clientHeight;
      const needed = content.scrollHeight;
      if (available > 0 && needed > available) {
        setScale(Math.max(0.72, (available / needed) * 0.98));
      } else {
        setScale(1);
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <div
        ref={contentRef}
        className="lq-showcase-phone-fit origin-top-left"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          width: scale < 1 ? `${100 / scale}%` : '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}
