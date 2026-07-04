import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import { LoveCrisisCountdown } from '../games/components/LoveCrisisCountdown';
import { LoveCrisisIntro } from '../games/components/LoveCrisisIntro';
import { LoveCrisisPlayView } from '../games/components/LoveCrisisPlayView';
import { LoveCrisisResultModal } from '../games/components/LoveCrisisResultModal';
import { LoveCrisisTutorial } from '../games/components/LoveCrisisTutorial';
import { hasSeenLoveCrisisTutorial, LOVE_CRISIS_UPGRADE_HINT } from '../games/loveCrisis/loveCrisisLogic';
import { useLoveCrisisGame } from '../games/loveCrisis/useLoveCrisisGame';

export function LoveCrisisGamePage() {
  const { navigateTo } = useCoupleRpgNav();
  const { displayNames } = useLoveQuest();
  const { isPro, openUpgradeModal } = useUserPlan();
  const game = useLoveCrisisGame();

  useEffect(() => {
    if (!isPro) {
      openUpgradeModal(LOVE_CRISIS_UPGRADE_HINT);
      navigateTo('games');
    }
  }, [isPro, navigateTo, openUpgradeModal]);

  const playing = game.screen === 'playing';
  const countdown = game.screen === 'countdown';
  const immersive = playing || countdown;

  useEffect(() => {
    document.documentElement.classList.toggle('lq-game-immersive', immersive);
    document.documentElement.classList.toggle('lq-love-crisis-playing', playing);
    return () => {
      document.documentElement.classList.remove('lq-game-immersive');
      document.documentElement.classList.remove('lq-love-crisis-playing');
    };
  }, [immersive, playing]);

  const playerAName = displayNames.me || '玩家 A';
  const playerBName = displayNames.partner || '玩家 B';

  const handleIntroStart = () => {
    if (hasSeenLoveCrisisTutorial()) {
      game.startCountdown();
    } else {
      game.goToTutorial();
    }
  };

  if (!isPro) return null;

  if (playing && game.puzzle) {
    return (
      <LoveCrisisPlayView
        onBack={() => navigateTo('games')}
        puzzle={game.puzzle}
        cutIndex={game.cutIndex}
        heartState={game.heartState}
        repairProgress={game.repairProgress}
        timeLeftMs={game.timeLeftMs}
        timerProgress={game.timerProgress}
        successCount={game.successCount}
        currentStreak={game.currentStreak}
        urgent={game.urgent}
        flashMessage={game.flashMessage}
        feedbackKind={game.feedbackKind}
        xiaoiMood={game.xiaoiMood}
        xiaoiJump={game.xiaoiJump}
        reactionText={game.reactionText}
        holdLineId={game.holdLineId}
        holdProgress={game.holdProgress}
        doubleHintLineId={game.doubleHintLineId}
        doubleTapStep={game.doubleTapStep}
        onLineTap={game.onLineTap}
        onLineHoldStart={game.onLineHoldStart}
        onLineHoldEnd={game.onLineHoldEnd}
      />
    );
  }

  return (
    <div className="lq-love-crisis-game-page">
      <button
        type="button"
        onClick={() => navigateTo('games')}
        className="lq-love-crisis-game-back flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        回遊戲列表
      </button>

      {game.screen === 'intro' ? (
        <LoveCrisisIntro onStart={handleIntroStart} onTutorial={game.goToTutorial} />
      ) : null}

      {game.screen === 'tutorial' ? (
        <LoveCrisisTutorial
          onComplete={game.startCountdown}
          onSkip={game.skipTutorialAndStart}
        />
      ) : null}

      {countdown ? <LoveCrisisCountdown value={game.countdown} /> : null}

      {game.result ? (
        <LoveCrisisResultModal
          open={game.screen === 'ended'}
          result={game.result}
          playerAName={playerAName}
          playerBName={playerBName}
          onPlayAgain={game.resetGame}
          onBackToList={() => navigateTo('games')}
        />
      ) : null}
    </div>
  );
}
