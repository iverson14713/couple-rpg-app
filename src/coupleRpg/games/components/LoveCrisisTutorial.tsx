import { useState } from 'react';
import { lq } from '../../theme';
import { EMOTION_META } from '../loveCrisis/loveCrisisEmotions';
import { markLoveCrisisTutorialSeen } from '../loveCrisis/loveCrisisLogic';

type Props = {
  onComplete: () => void;
  onSkip: () => void;
};

const STEPS = [
  {
    title: '看見裂痕',
    body: '愛心上有情緒線，越來越淡代表快碎了。不是懲罰，是提醒你們該靠近了。',
    emoji: '💔',
  },
  {
    title: '讀懂任務順序',
    body: '上方會顯示修復任務，例如：先深呼吸 → 聽完再說 → 抱抱對方。',
    chips: ['calm', 'listen', 'comfort'] as const,
    useTask: true,
  },
  {
    title: '三種情緒線',
    body: '有些線照順序點；有些要長按 0.6 秒慢慢安撫；有些要連點兩次，考驗默契。',
    badges: ['點擊', '長按', '雙點'],
  },
  {
    title: '一起修復',
    body: '剪對就修復一點；剪錯這顆會碎掉，但時間還在，繼續下一顆。小愛會陪你們一起努力！',
    emoji: '❤️',
  },
] as const;

export function LoveCrisisTutorial({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;

  const finish = () => {
    markLoveCrisisTutorialSeen();
    onComplete();
  };

  const skip = () => {
    markLoveCrisisTutorialSeen();
    onSkip();
  };

  return (
    <div className="lq-love-crisis-tutorial">
      <div className="lq-love-crisis-tutorial__card">
        <p className="lq-love-crisis-tutorial__step">
          {step + 1} / {STEPS.length}
        </p>
        <h2 className="lq-love-crisis-tutorial__title">{current.title}</h2>
        <p className="lq-love-crisis-tutorial__body">{current.body}</p>

        {'emoji' in current && current.emoji ? (
          <p className="lq-love-crisis-tutorial__emoji" aria-hidden>
            {current.emoji}
          </p>
        ) : null}

        {'chips' in current && current.chips ? (
          <div className="lq-love-crisis-hint-chips lq-love-crisis-hint-chips--center">
            {current.chips.map((type, i) => (
              <span key={type} className="lq-love-crisis-hint-chips__item">
                {i > 0 ? <span className="lq-love-crisis-hint-chips__arrow">→</span> : null}
                <span className={`lq-love-crisis-chip ${EMOTION_META[type].chipClass}`}>
                  {'useTask' in current && current.useTask
                    ? EMOTION_META[type].task
                    : EMOTION_META[type].label}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        {'badges' in current && current.badges ? (
          <div className="lq-love-crisis-tutorial__badges">
            {current.badges.map((badge) => (
              <span key={badge} className="lq-love-crisis-tutorial__badge">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lq-love-crisis-tutorial__actions">
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className={lq.btnPrimary}>
            下一步
          </button>
        ) : (
          <button type="button" onClick={finish} className={lq.btnPrimary}>
            懂了，開始！
          </button>
        )}
        <button type="button" onClick={skip} className={lq.btnSecondary}>
          跳過
        </button>
      </div>
    </div>
  );
}
