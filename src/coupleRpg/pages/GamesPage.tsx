import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useToast } from '../../context/ToastContext';
import { GameCard } from '../games/components/GameCard';
import { lq } from '../theme';

const COMING_SOON = ['心有靈犀', '真心話挑戰', '默契大考驗', '幸運轉盤'] as const;

export function GamesPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { showToast } = useToast();

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        返回首頁
      </button>

      <GameCard
        title="愛心圈圈戰"
        description="兩人輪流擲骰，圈起相連愛心，不能圈的人輸。"
        tags={['2人遊玩', '約3分鐘', '同手機輪流']}
        cta="開始遊戲"
        onAction={() => navigateTo('heartCircle')}
      />

      <section className={`mt-4 p-4 ${lq.card}`} aria-label="更多遊戲準備中">
        <h2 className="text-[14px] font-bold text-[#8a7a84]">更多遊戲準備中</h2>
        <ul className="mt-3 space-y-2">
          {COMING_SOON.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => showToast('這款遊戲準備中，敬請期待 ✨', 'info', { position: 'top' })}
                className="flex w-full items-center justify-between rounded-xl border border-rose-100/60 bg-white/50 px-3 py-2.5 text-left active:opacity-80"
              >
                <span className="text-[14px] font-semibold text-[#9a8a94]">{name}</span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#d4869f]">
                  Coming Soon
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
