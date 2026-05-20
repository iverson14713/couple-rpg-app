import { APP_STORE_FONT_FAMILY } from './appStore/constants';
import { APP_NAME } from '../coupleRpg/theme';

const SPLASH_ICON_SRC = '/icon-512.png';

type SplashScreenProps = {
  active?: boolean;
  statusText?: string;
};

export function SplashScreen({ active = true, statusText }: SplashScreenProps) {
  return (
    <div
      className="splash-screen fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-rose-50 via-pink-50/90 to-amber-50/80"
      style={{
        fontFamily: APP_STORE_FONT_FAMILY,
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="LoveQuest 載入中"
    >
      <div
        className={`splash-screen__content flex flex-col items-center px-8 text-center ${active ? 'splash-screen__content--enter' : ''}`}
      >
        <SplashIcon />
        <h1 className="text-[32px] font-bold tracking-tight text-stone-900" style={{ letterSpacing: '-0.02em' }}>
          {APP_NAME}
        </h1>
        <p className="mt-2 text-[17px] font-medium text-rose-400/90">一起升級戀愛等級</p>
        {statusText ? (
          <p className="splash-screen__status mt-6 text-[13px] font-medium text-stone-400">{statusText}</p>
        ) : null}
      </div>
    </div>
  );
}

function SplashIcon() {
  return (
    <img
      src={SPLASH_ICON_SRC}
      alt=""
      width={108}
      height={108}
      className="splash-screen__icon-wrap mb-8 h-[108px] w-[108px] rounded-[24px] object-cover shadow-[0_20px_50px_-12px_rgba(244,114,182,0.45)]"
      decoding="async"
      fetchPriority="high"
    />
  );
}
