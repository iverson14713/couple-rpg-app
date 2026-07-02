import { lq } from '../../theme';

type Props = {
  canClear: boolean;
  canConfirm: boolean;
  onClear: () => void;
  onConfirm: () => void;
};

export function HeartCircleActionBar({ canClear, canConfirm, onClear, onConfirm }: Props) {
  return (
    <div className="lq-heart-game-action-bar" role="toolbar" aria-label="遊戲操作">
      <div className="lq-heart-game-action-bar__inner">
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className={`flex-1 rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-35 ${lq.btnSecondary}`}
        >
          重新選取
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`lq-heart-confirm-btn flex-1 rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-35 ${lq.btnPrimary}`}
        >
          確認圈起
        </button>
      </div>
    </div>
  );
}
