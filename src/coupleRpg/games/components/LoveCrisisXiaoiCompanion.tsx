import { XiaoiAnimatedPet } from '../../components/xiaoi/XiaoiAnimatedPet';
import type { XiaoiState } from '../../xiaoi/types';
import type { XiaoiMood } from '../loveCrisis/loveCrisisTypes';

type Props = {
  mood: XiaoiMood;
  jump?: boolean;
  size?: 'intro' | 'play' | 'result' | 'float';
  holdingHeart?: boolean;
};

const MOOD_STATE: Record<XiaoiMood, XiaoiState> = {
  nervous: 'sad',
  happy: 'happy',
  sad: 'sad',
  panic: 'sleepy',
  celebrate: 'happy',
  holding: 'happy',
};

const MOOD_TITLE: Record<XiaoiMood, string> = {
  nervous: '小愛擔心中',
  happy: '小愛開心',
  sad: '小愛有點難過',
  panic: '小愛好慌張',
  celebrate: '小愛好開心',
  holding: '小愛抱著愛心',
};

export function LoveCrisisXiaoiCompanion({
  mood,
  jump = false,
  size = 'play',
  holdingHeart = false,
}: Props) {
  const state = MOOD_STATE[mood];
  const showHeart = holdingHeart || mood === 'holding' || mood === 'celebrate';

  return (
    <div
      className={`lq-love-crisis-xiaoi lq-love-crisis-xiaoi--${size} lq-love-crisis-xiaoi--${mood} ${
        jump ? 'lq-love-crisis-xiaoi--jump' : ''
      }`}
    >
      {showHeart ? (
        <span className="lq-love-crisis-xiaoi__heart" aria-hidden>
          ❤️
        </span>
      ) : null}
      <div className="lq-love-crisis-xiaoi__pet">
        <XiaoiAnimatedPet
          state={state}
          title={MOOD_TITLE[mood]}
          className="lq-love-crisis-xiaoi__img"
        />
      </div>
    </div>
  );
}
