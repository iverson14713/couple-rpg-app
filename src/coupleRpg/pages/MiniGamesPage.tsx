import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import {
  MiniGamePlayCard,
  type MiniGameCardPhase,
  type MiniGamePlayCardDisplay,
} from '../components/MiniGamePlayCard';
import { COUPLE_GAME_MODES, type CoupleGameModeId } from '../data/coupleGamePrompts';
import {
  countPromptsByMode,
  formatPromptLine,
  getCoupleGameLibraryStatus,
  getModeDef,
  pickGamePrompt,
} from '../lib/coupleGamePromptsLib';
import { lq } from '../theme';

const DRAWING_BTN: Record<CoupleGameModeId, string> = {
  coupleDice: '擲骰中...',
  truth: '抽題中...',
  syncQuiz: '抽題中...',
  sweetTalk: '產生中...',
  coupleChallenge: '抽挑戰中...',
  dateIcebreaker: '抽約會中...',
  surpriseTask: '抽驚喜中...',
};

function shuffleMs(): number {
  return 1200 + Math.floor(Math.random() * 300);
}

function buildDisplay(
  phase: MiniGameCardPhase,
  modeDef: ReturnType<typeof getModeDef>,
  prompt: ReturnType<typeof pickGamePrompt>,
  line: string | null,
  poolHint: string,
  lastGrantOk: boolean | null
): MiniGamePlayCardDisplay {
  const def = modeDef!;

  if (phase === 'idle') {
    return {
      displayEmoji: def.emoji,
      displayTitle: '準備好了嗎？',
      displaySubtitle: poolHint,
      displayContent: null,
    };
  }

  if (phase === 'drawing') {
    return {
      displayEmoji: def.emoji,
      displayTitle: '正在抽一個小驚喜...',
      displaySubtitle: '',
      displayContent: null,
    };
  }

  if (phase === 'completed') {
    const rewardLine =
      lastGrantOk === true
        ? '🪙 +2 ❤️ +3 🤝 +1 ✨ +5'
        : lastGrantOk === false
          ? '今日獎勵已達上限，仍可繼續玩'
          : '';
    return {
      displayEmoji: '✨',
      displayTitle: '✨ 完成！',
      displaySubtitle: rewardLine,
      displayContent: line,
    };
  }

  // revealed
  return {
    displayEmoji: prompt?.emoji ?? def.emoji,
    displayTitle: '',
    displaySubtitle: prompt?.category ?? '',
    displayContent: line,
  };
}

export function MiniGamesPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { rpgView, claimMiniGameReward } = useLoveQuest();
  const { isPro, openUpgradeModal } = useUserPlan();

  const [mode, setMode] = useState<CoupleGameModeId>('coupleDice');
  const [phase, setPhase] = useState<MiniGameCardPhase>('idle');
  const [prompt, setPrompt] = useState<ReturnType<typeof pickGamePrompt>>(null);
  const [roundRewarded, setRoundRewarded] = useState(false);
  const [lastGrantOk, setLastGrantOk] = useState<boolean | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);

  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modeDef = useMemo(() => getModeDef(mode)!, [mode]);
  const library = useMemo(() => getCoupleGameLibraryStatus(isPro), [isPro]);
  const poolSize = useMemo(() => countPromptsByMode(mode, isPro), [mode, isPro]);
  const line = prompt ? formatPromptLine(prompt) : null;

  const count = rpgView.miniGamesRewardsToday;
  const cap = rpgView.miniGamesRewardCap;
  const atCap = count >= cap;

  const poolHint = poolSize > 0 ? '點下方按鈕抽一個小驚喜' : '此模式需 Pro 解鎖';

  const display = useMemo(
    () => buildDisplay(phase, modeDef, prompt, line, poolHint, lastGrantOk),
    [phase, modeDef, prompt, line, poolHint, lastGrantOk]
  );

  const clearTimers = useCallback(() => {
    if (drawTimerRef.current) {
      clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    if (sparkleTimerRef.current) {
      clearTimeout(sparkleTimerRef.current);
      sparkleTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const selectMode = useCallback(
    (next: CoupleGameModeId) => {
      const def = getModeDef(next);
      if (def?.proOnly && !isPro) {
        openUpgradeModal('升級 Pro 解鎖更多情侶互動題庫');
        return;
      }
      clearTimers();
      setShowSparkles(false);
      setMode(next);
      setPrompt(null);
      setPhase('idle');
      setRoundRewarded(false);
      setLastGrantOk(null);
    },
    [isPro, openUpgradeModal, clearTimers]
  );

  const draw = useCallback(() => {
    if (poolSize === 0 || phase === 'drawing') return;
    clearTimers();
    setShowSparkles(false);
    setPhase('drawing');
    setRoundRewarded(false);
    setLastGrantOk(null);

    drawTimerRef.current = setTimeout(() => {
      const next = pickGamePrompt(mode, isPro, prompt?.id);
      setPrompt(next);
      setPhase('revealed');
      setShowSparkles(true);
      sparkleTimerRef.current = setTimeout(() => setShowSparkles(false), 900);
      drawTimerRef.current = null;
    }, shuffleMs());
  }, [poolSize, phase, mode, isPro, prompt?.id, clearTimers]);

  const onComplete = useCallback(() => {
    if (!line || roundRewarded || phase !== 'revealed') return;
    setRoundRewarded(true);
    const granted = claimMiniGameReward(line);
    setLastGrantOk(granted);
    setPhase('completed');
    setShowSparkles(false);
  }, [line, roundRewarded, phase, claimMiniGameReward]);

  const primaryLabel =
    phase === 'drawing'
      ? DRAWING_BTN[mode]
      : phase === 'revealed' || phase === 'completed'
        ? '換一個'
        : modeDef.actionLabel;

  const showDualActions = phase === 'revealed' || phase === 'completed';
  const drawDisabled = poolSize === 0 || phase === 'drawing';

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        返回
      </button>

      <div className={`mb-3 px-3 py-2.5 ${lq.card}`}>
        <p className="text-[12px] font-bold text-stone-600">🎲 情侶小遊戲</p>
        <p className="mt-2 text-[11px] font-bold text-violet-800">題庫狀態</p>
        <p className="text-[13px] font-extrabold text-stone-900">{library.headline}</p>
        <p className="mt-0.5 text-[11px] text-stone-500">{library.subline}</p>
        {!isPro ? (
          <button
            type="button"
            onClick={() => openUpgradeModal('升級 Pro 解鎖更多情侶互動題庫')}
            className="mt-2 text-[11px] font-bold text-rose-600 underline-offset-2 active:opacity-70"
          >
            升級 Pro 解鎖更多題目 →
          </button>
        ) : null}
      </div>

      <div className={`mb-3 px-3 py-2.5 ${lq.card}`}>
        <p className="text-[10px] font-bold text-stone-500">今日小遊戲獎勵</p>
        <p className="text-sm font-extrabold text-rose-700">
          {count}/{cap}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
          {atCap
            ? '今日獎勵已滿，仍可繼續玩'
            : `完成一次 🪙+2 ❤️+3 🤝+1 ✨+5（${isPro ? 'Pro' : 'Free'} 每日 ${cap} 次）`}
        </p>
      </div>

      <div className="mb-2">
        <p className="mb-1.5 px-0.5 text-[11px] font-semibold tracking-wide text-stone-400">模式選擇</p>
        <div className="grid grid-cols-2 gap-1.5">
          {COUPLE_GAME_MODES.map((m) => {
            const selected = mode === m.id;
            const locked = Boolean(m.proOnly && !isPro);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMode(m.id)}
                className={`relative flex min-h-0 items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left transition duration-200 active:scale-[0.98] ${
                  selected
                    ? lq.hubChipActive
                    : locked
                      ? 'border-violet-100/80 bg-violet-50/30'
                      : lq.hubChipIdle
                }`}
              >
                {m.proOnly ? (
                  <span className="absolute right-1 top-1 rounded bg-violet-100/90 px-1 py-px text-[8px] font-bold leading-none text-violet-700">
                    Pro
                  </span>
                ) : null}
                <span className="shrink-0 text-base leading-none" aria-hidden>
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1 pr-4">
                  <span
                    className={`block truncate font-extrabold leading-tight tracking-tight text-stone-900 ${
                      selected ? 'text-[17px]' : 'text-[16px]'
                    }`}
                  >
                    {m.title}
                  </span>
                  <span className="mt-px block truncate text-[10px] font-medium text-stone-400/90">
                    {m.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className={`p-4 ${lq.cardElevated}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className={lq.sectionTitle}>
            <span className="mr-1">{modeDef.emoji}</span>
            {modeDef.title}
          </h2>
          <span className="text-[10px] font-semibold text-stone-400">題庫 {poolSize} 題</span>
        </div>

        <MiniGamePlayCard phase={phase} showSparkles={showSparkles} {...display} />

        {showDualActions ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onComplete}
              disabled={phase === 'completed' || roundRewarded}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
                phase === 'completed' || roundRewarded
                  ? 'bg-stone-100 text-stone-400'
                  : 'bg-emerald-600 text-white shadow-sm active:scale-[0.99]'
              }`}
            >
              {phase === 'completed' ? '已記錄' : '完成'}
            </button>
            <button
              type="button"
              onClick={draw}
              disabled={drawDisabled}
              className={`flex-1 py-2.5 text-sm font-bold active:scale-[0.99] disabled:opacity-40 ${lq.btnSecondary}`}
            >
              {primaryLabel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={draw}
            disabled={drawDisabled}
            className={`w-full rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${
              phase === 'idle' ? `game-card-cta-pulse ${lq.btnPrimary}` : lq.btnPrimary
            }`}
          >
            {phase === 'idle' ? `${modeDef.emoji} ${primaryLabel}` : primaryLabel}
          </button>
        )}
      </section>
    </div>
  );
}
