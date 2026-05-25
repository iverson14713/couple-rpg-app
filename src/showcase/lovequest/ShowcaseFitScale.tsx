import { useEffect, useState, type ReactNode } from 'react';
import { APP_STORE_SCREEN } from './constants';

type Props = {
  children: ReactNode;
};

/** 將 1284×2778 等比例縮放至視窗內，無 scrollbar */
export function ShowcaseFitScale({ children }: Props) {
  const { w, h } = APP_STORE_SCREEN;
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const update = () => {
      const pad = 16;
      const sx = (window.innerWidth - pad) / w;
      const sy = (window.innerHeight - pad) / h;
      setScale(Math.min(sx, sy, 1));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [w, h]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}
    >
      <div
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
