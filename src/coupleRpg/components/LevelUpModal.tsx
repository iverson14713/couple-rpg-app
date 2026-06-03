import { useEffect } from 'react';
import { levelTitle, levelUnlockLine } from '../lib/coupleLevel';
import { lq } from '../theme';

function triggerLevelUpHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([12, 40, 12]);
    }
  } catch {
    /* ignore */
  }
}

export function LevelUpModal({
  level,
  onDismiss,
}: {
  level: number;
  onDismiss: () => void;
}) {
  const title = levelTitle(level);
  const unlock = levelUnlockLine(level);

  useEffect(() => {
    triggerLevelUpHaptic();
  }, [level]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <div className="level-up-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-rose-200/90 bg-gradient-to-br from-white via-rose-50/95 to-violet-50/90 p-6 shadow-2xl ring-2 ring-rose-200/60">
        <span className="level-up-sparkle pointer-events-none absolute left-3 top-3 text-2xl opacity-70" aria-hidden>
          ✨
        </span>
        <span className="level-up-sparkle pointer-events-none absolute right-4 top-8 text-xl opacity-60" aria-hidden>
          💗
        </span>
        <span className="level-up-sparkle pointer-events-none absolute bottom-10 left-6 text-lg opacity-50" aria-hidden>
          💕
        </span>

        <p className="text-center text-[13px] font-bold text-rose-600">🎉 你們升級了！</p>
        <h2 id="level-up-title" className={`mt-2 text-center text-[22px] font-extrabold ${lq.text}`}>
          Lv.{level} {title}
        </h2>

        {unlock ? (
          <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-rose-100">
            <p className="text-[12px] font-bold text-stone-600">已解鎖：</p>
            <p className="mt-1 text-[15px] font-extrabold text-violet-800">・{unlock}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          className={`mt-5 min-h-[48px] w-full ${lq.btnPrimary}`}
        >
          太棒了
        </button>
      </div>

      <style>{`
        @keyframes level-up-pop-in {
          0% { opacity: 0; transform: scale(0.88) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes level-up-sparkle {
          0%, 100% { opacity: 0.35; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-4px) scale(1.1); }
        }
        .level-up-pop {
          animation: level-up-pop-in 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }
        .level-up-sparkle {
          animation: level-up-sparkle 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
