import { lq } from '../../theme';
import { LoveCrisisXiaoiCompanion } from './LoveCrisisXiaoiCompanion';

type Props = {
  onStart: () => void;
  onTutorial: () => void;
};

export function LoveCrisisIntro({ onStart, onTutorial }: Props) {
  return (
    <div className="lq-love-crisis-intro">
      <div className="lq-love-crisis-intro__hero">
        <div className="lq-love-crisis-intro__heart" aria-hidden>
          <span className="lq-love-crisis-intro__heart-icon">💔</span>
          <span className="lq-love-crisis-intro__heart-glow" />
        </div>

        <LoveCrisisXiaoiCompanion mood="sad" size="intro" />
      </div>

      <span className="lq-love-crisis-pro-pill">Pro 專屬</span>
      <h1 className="lq-love-crisis-intro__title">愛情危機</h1>
      <p className="lq-love-crisis-intro__subtitle">30 秒一起修復愛心</p>
      <p className="lq-love-crisis-intro__copy">
        每段關係都會有小裂痕。你們要做的，是在愛心碎掉前，用對的方式接住彼此。
      </p>

      <div className="lq-love-crisis-intro__actions">
        <button type="button" onClick={onStart} className={lq.btnPrimary}>
          開始修復
        </button>
        <button type="button" onClick={onTutorial} className={lq.btnSecondary}>
          玩法說明
        </button>
      </div>
    </div>
  );
}
