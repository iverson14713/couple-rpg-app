import { lq } from '../../theme';

type Props = {
  open: boolean;
  winnerName: string;
  loserName: string;
  onPlayAgain: () => void;
  onBackToList: () => void;
};

export function GameResultModal({
  open,
  winnerName,
  loserName,
  onPlayAgain,
  onBackToList,
}: Props) {
  if (!open) return null;

  return (
    <div className="lq-game-result-overlay" role="dialog" aria-modal="true" aria-labelledby="game-result-title">
      <div className="lq-game-result-card">
        <p className="text-3xl" aria-hidden>
          🎉
        </p>
        <h2 id="game-result-title" className="mt-2 text-[20px] font-extrabold text-[#3d3539]">
          {winnerName} 贏了！
        </h2>
        <p className="mt-2 text-[14px] font-medium text-[#8a7a84]">
          {loserName}：這次沒地方可以圈了
        </p>
        <p className="mt-1 text-[13px] font-semibold text-[#d4869f]">感情升溫 +1</p>

        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={onPlayAgain} className={`w-full ${lq.btnPrimary}`}>
            再玩一次
          </button>
          <button
            type="button"
            onClick={onBackToList}
            className={`w-full ${lq.btnSecondary}`}
          >
            回遊戲列表
          </button>
        </div>
      </div>
    </div>
  );
}
