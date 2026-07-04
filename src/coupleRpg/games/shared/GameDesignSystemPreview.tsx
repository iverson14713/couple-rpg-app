import { createPortal } from 'react-dom';
import {
  GameHud,
  GameInstructionCard,
  GameMascotBubble,
  GamePageShell,
  GamePageShellContent,
  GameStage,
  GameStoryText,
} from './index';
import { GameStageDemoContent } from './GameStageDemo';

type Props = {
  onClose: () => void;
};

/** Dev-only：LoveQuest Game Design System v0.1 預覽 */
export function GameDesignSystemPreview({ onClose }: Props) {
  const preview = (
    <div className="lq-game-ds-preview" role="dialog" aria-modal="true" aria-label="Game DS Preview">
      <div className="lq-game-ds-preview__backdrop" aria-hidden onClick={onClose} />
      <div className="lq-game-ds-preview__frame">
        <header className="lq-game-ds-preview__toolbar">
          <p className="lq-game-ds-preview__title">Game DS v0.1</p>
          <button type="button" onClick={onClose} className="lq-game-ds-preview__close">
            關閉
          </button>
        </header>

        <GamePageShell immersive>
          <GamePageShellContent>
            <div className="lq-game-ds-preview__play">
              <GameHud
                timerLabel="0:24"
                scoreLabel="修復 2"
                progressPercent={0.8}
                statusText="照順序修復情緒線"
              />

              <GameInstructionCard
                hint="照順序修復：傾聽 → 安慰 → 肯定 → 冷靜"
                lines={2}
                chips={[
                  { id: '1', label: '傾聽', tone: 'done' },
                  { id: '2', label: '安慰', tone: 'active' },
                  { id: '3', label: '肯定', tone: 'default' },
                  { id: '4', label: '冷靜', tone: 'default' },
                ]}
              />

              <GameStoryText>他今天加班很累，你們有點冷戰。</GameStoryText>

              <div className="lq-game-stage-area">
                <GameStage>
                  {({ coord }) => <GameStageDemoContent coord={coord} />}
                </GameStage>
                <GameMascotBubble
                  state="nervous"
                  message="快幫愛心補起來！"
                  placement="bottom-left"
                />
              </div>
            </div>
          </GamePageShellContent>
        </GamePageShell>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return preview;
  return createPortal(preview, document.body);
}
