import { Info } from 'lucide-react';
import { useState } from 'react';

const RULES =
  '骰到幾，就圈起幾顆上下左右相連的愛心。沒有地方可圈的人就輸。';

type Props = {
  /** inline：嵌在 HUD 右上角，不佔額外行高 */
  variant?: 'inline' | 'standalone';
};

export function GameRulesHint({ variant = 'standalone' }: Props) {
  const [open, setOpen] = useState(false);
  const isInline = variant === 'inline';

  return (
    <div
      className={`lq-heart-rules ${isInline ? 'lq-heart-rules--inline' : 'lq-heart-rules--compact'}`}
    >
      <button
        type="button"
        className={`lq-heart-rules__toggle ${isInline ? 'lq-heart-rules__toggle--icon' : ''}`}
        aria-label="遊戲規則說明"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {!isInline ? <span>遊戲規則</span> : null}
      </button>
      {open ? (
        <div className="lq-heart-rules__popover" role="tooltip">
          <p>{RULES}</p>
          <p className="mt-1 text-[10px] text-[#b8abb3]">
            手指按住愛心後滑過相鄰格子即可圈選；想重選請按「重新選取」。
          </p>
        </div>
      ) : null}
    </div>
  );
}
