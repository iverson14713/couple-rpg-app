import type { XiaoiMood } from '../loveCrisis/loveCrisisTypes';
import { LoveCrisisXiaoiCompanion } from './LoveCrisisXiaoiCompanion';

type Props = {
  mood: XiaoiMood;
  jump?: boolean;
  text: string;
};

export function LoveCrisisXiaoiFloat({ mood, jump = false, text }: Props) {
  return (
    <div className="lq-love-crisis-xiaoi-float" aria-live="polite">
      <p className="lq-love-crisis-xiaoi-float__bubble">{text}</p>
      <LoveCrisisXiaoiCompanion mood={mood} jump={jump} size="float" />
    </div>
  );
}
