import { XiaoiAnimatedPet } from '../../components/xiaoi/XiaoiAnimatedPet';
import type { XiaoiState } from '../../xiaoi/types';
import type { GameMascotBubbleProps } from './gameLayoutTypes';

const MASCOT_STATE: Record<GameMascotBubbleProps['state'], XiaoiState> = {
  happy: 'happy',
  sad: 'sad',
  nervous: 'sad',
  celebrate: 'happy',
  sleepy: 'sleepy',
};

const MASCOT_TITLE: Record<GameMascotBubbleProps['state'], string> = {
  happy: '小愛開心',
  sad: '小愛有點難過',
  nervous: '小愛擔心中',
  celebrate: '小愛好開心',
  sleepy: '小愛好慌張',
};

export function GameMascotBubble({
  state,
  message,
  placement = 'bottom-left',
  bubbleLayout = 'beside',
  jump = false,
}: GameMascotBubbleProps) {
  const xiaoiState = MASCOT_STATE[state];
  const aboveRight = placement === 'bottom-left' && bubbleLayout === 'above-right';

  return (
    <div
      className={`lq-game-mascot lq-game-mascot--${placement} ${
        aboveRight ? 'lq-game-mascot--bubble-above-right' : ''
      } ${jump ? 'lq-game-mascot--jump' : ''}`}
      aria-live="polite"
    >
      {placement === 'bottom-right' ? (
        <>
          <p className="lq-game-mascot__bubble">{message}</p>
          <div className="lq-game-mascot__pet">
            <XiaoiAnimatedPet
              state={xiaoiState}
              title={MASCOT_TITLE[state]}
              className="lq-game-mascot__img"
            />
          </div>
        </>
      ) : aboveRight ? (
        <>
          <p className="lq-game-mascot__bubble">{message}</p>
          <div className="lq-game-mascot__pet">
            <XiaoiAnimatedPet
              state={xiaoiState}
              title={MASCOT_TITLE[state]}
              className="lq-game-mascot__img"
            />
          </div>
        </>
      ) : (
        <>
          <div className="lq-game-mascot__pet">
            <XiaoiAnimatedPet
              state={xiaoiState}
              title={MASCOT_TITLE[state]}
              className="lq-game-mascot__img"
            />
          </div>
          <p className="lq-game-mascot__bubble">{message}</p>
        </>
      )}
    </div>
  );
}
