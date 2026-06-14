import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import { CustomQuestionBankPage } from '../components/CustomQuestionBankPage';
import { DailyRewardsLoginHint } from '../components/DailyRewardsLoginHint';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { DAILY_REWARDS_LOGIN_HINT } from '../lib/dailyRewardsCopy';
import {
  MiniGamePlayCard,
  type MiniGameCardPhase,
  type MiniGameCarouselPreview,
  type MiniGamePlayCardDisplay,
} from '../components/MiniGamePlayCard';
import { MiniGameRewardFloat } from '../components/MiniGameRewardFloat';
import { COUPLE_GAME_MODES, type CoupleGameModeId } from '../data/coupleGamePrompts';
import {
  formatModePoolLabel,
  getAvailablePromptPool,
  getCoupleGameLibraryStatus,
  getModeDef,
  getModePoolCounts,
  getPromptDisplayText,
  pickGamePrompt,
} from '../lib/coupleGamePromptsLib';
import {
  formatRarityTaskLabel,
  rarityBadgeClass,
  rollMiniGameRarity,
  type MiniGameRarity,
} from '../lib/miniGameRarity';
import { REWARDS } from '../storage/rpgLogic';
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

const MODE_SWITCH_MS = 180;

function drawDurationMs(): number {
  return 1200 + Math.floor(Math.random() * 300);
}

function carouselIntervalMs(): number {
  return 100 + Math.floor(Math.random() * 51);
}

function buildDisplay(
  phase: MiniGameCardPhase,
  modeDef: ReturnType<typeof getModeDef>,
  prompt: ReturnType<typeof pickGamePrompt>,
  line: string | null,
  poolHint: string,
  lastGrantOk: boolean | null,
  canEarnDailyRewards: boolean,
  atCap: boolean
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
      displayTitle: '',
      displaySubtitle: '',
      displayContent: null,
    };
  }

  if (phase === 'completed') {
    const rewardLine =
      lastGrantOk === true
        ? `🪙 +${REWARDS.miniGameComplete.loveCoins} ✨ +${REWARDS.miniGameComplete.xp}`
        : lastGrantOk === false
          ? !canEarnDailyRewards
            ? DAILY_REWARDS_LOGIN_HINT
            : atCap
              ? '今日小遊戲獎勵已領完，明天再來玩吧'
              : '本次未發放獎勵，仍可繼續玩'
          : '';
    return {
      displayEmoji: '✨',
      displayTitle: '✨ 完成！',
      displaySubtitle: rewardLine,
      displayContent: line,
    };
  }

  return {
    displayEmoji: prompt?.emoji ?? def.emoji,
    displayTitle: '',
    displaySubtitle: prompt?.category ?? '',
    displayContent: line,
  };
}

export function MiniGamesPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { rpgView, claimMiniGameReward, canEarnDailyRewards } = useLoveQuest();
  const { isPro, openUpgradeModal } = useUserPlan();

  const [mode, setMode] = useState<CoupleGameModeId>('coupleDice');
  const [phase, setPhase] = useState<MiniGameCardPhase>('idle');
  const [prompt, setPrompt] = useState<ReturnType<typeof pickGamePrompt>>(null);
  const [roundRewarded, setRoundRewarded] = useState(false);
  const [lastGrantOk, setLastGrantOk] = useState<boolean | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const [customBankOpen, setCustomBankOpen] = useState(false);
  const [carouselPreview, setCarouselPreview] = useState<MiniGameCarouselPreview | null>(null);
  const [rarity, setRarity] = useState<MiniGameRarity | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [rewardFloatVisible, setRewardFloatVisible] = useState(false);
  const [playPanelClass, setPlayPanelClass] = useState('');

  const drawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modeDef = useMemo(() => getModeDef(mode)!, [mode]);
  const library = useMemo(() => getCoupleGameLibraryStatus(isPro), [isPro]);
  const poolLabel = useMemo(() => formatModePoolLabel(mode, isPro), [mode, isPro]);
  const poolSize = useMemo(() => getModePoolCounts(mode, isPro).total, [mode, isPro]);
  const line = prompt ? getPromptDisplayText(prompt) : null;

  const count = rpgView.miniGamesRewardsToday;
  const cap = rpgView.miniGamesRewardCap;
  const atCap = count >= cap;

  const poolHint = poolSize > 0 ? '點下方按鈕抽一個小驚喜' : '此模式需 Pro 解鎖';

  const display = useMemo(
    () => buildDisplay(phase, modeDef, prompt, line, poolHint, lastGrantOk, canEarnDailyRewards, atCap),
    [phase, modeDef, prompt, line, poolHint, lastGrantOk, canEarnDailyRewards, atCap]
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
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }
    if (modeSwitchTimerRef.current) {
      clearTimeout(modeSwitchTimerRef.current);
      modeSwitchTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const resetRound = useCallback(() => {
    setPrompt(null);
    setPhase('idle');
    setRoundRewarded(false);
    setLastGrantOk(null);
    setCarouselPreview(null);
    setRarity(null);
    setShowSparkles(false);
  }, []);

  const selectMode = useCallback(
    (next: CoupleGameModeId) => {
      const def = getModeDef(next);
      if (def?.proOnly && !isPro) {
        openUpgradeModal('解鎖約會破冰、驚喜任務與更多進階互動題庫，讓每天都有新的話題與任務。');
        return;
      }
      if (next === mode) return;

      clearTimers();
      setPlayPanelClass('mini-game-play-panel--exit');

      modeSwitchTimerRef.current = window.setTimeout(() => {
        setMode(next);
        resetRound();
        setPlayPanelClass('mini-game-play-panel--enter');
        modeSwitchTimerRef.current = window.setTimeout(() => {
          setPlayPanelClass('');
          modeSwitchTimerRef.current = null;
        }, MODE_SWITCH_MS);
      }, MODE_SWITCH_MS);
    },
    [isPro, openUpgradeModal, clearTimers, mode, resetRound]
  );

  const openCustomBank = useCallback(() => {
    if (!isPro) {
      openUpgradeModal('Pro 可建立專屬題庫，只抽你自己新增的情侶互動題目，不混入官方題庫。');
      return;
    }
    setCustomBankOpen(true);
  }, [isPro, openUpgradeModal]);

  const sampleCarousel = useCallback(
    (pool: ReturnType<typeof getAvailablePromptPool>) => {
      if (pool.length === 0) return;
      const sample = pool[Math.floor(Math.random() * pool.length)]!;
      setCarouselPreview({
        emoji: sample.emoji,
        text: getPromptDisplayText(sample),
      });
    },
    []
  );

  const draw = useCallback(() => {
    if (poolSize === 0 || phase === 'drawing') return;

    const pool = getAvailablePromptPool(mode, isPro);
    const final = pickGamePrompt(mode, isPro, prompt?.id);
    if (!final) return;

    clearTimers();
    setShowSparkles(false);
    setCarouselPreview(null);
    setRarity(null);
    setPhase('drawing');
    setRoundRewarded(false);
    setLastGrantOk(null);

    sampleCarousel(pool);
    carouselIntervalRef.current = window.setInterval(() => sampleCarousel(pool), carouselIntervalMs());

    drawTimerRef.current = window.setTimeout(() => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
        carouselIntervalRef.current = null;
      }
      setCarouselPreview(null);
      setPrompt(final);
      setRarity(rollMiniGameRarity());
      setRevealKey((k) => k + 1);
      setPhase('revealed');
      setShowSparkles(true);
      sparkleTimerRef.current = window.setTimeout(() => setShowSparkles(false), 900);
      drawTimerRef.current = null;
    }, drawDurationMs());
  }, [poolSize, phase, mode, isPro, prompt?.id, clearTimers, sampleCarousel]);

  const onComplete = useCallback(() => {
    if (!line || roundRewarded || phase !== 'revealed') return;
    setRoundRewarded(true);
    const granted = claimMiniGameReward(line);
    setLastGrantOk(granted);
    setPhase('completed');
    setShowSparkles(false);
    if (granted) setRewardFloatVisible(true);
  }, [line, roundRewarded, phase, claimMiniGameReward]);

  const primaryLabel =
    phase === 'drawing'
      ? DRAWING_BTN[mode]
      : phase === 'revealed' || phase === 'completed'
        ? '換一個'
        : modeDef.actionLabel;

  const showDualActions = phase === 'revealed' || phase === 'completed';
  const drawDisabled = poolSize === 0 || phase === 'drawing';

  if (customBankOpen) {
    return <CustomQuestionBankPage onBack={() => setCustomBankOpen(false)} />;
  }

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
            onClick={() =>
              openUpgradeModal(
                '解鎖約會破冰、驚喜任務與更多進階互動題庫，讓每天都有新的話題與任務。'
              )
            }
            className="mt-2 text-[11px] font-bold text-rose-600 underline-offset-2 active:opacity-70"
          >
            查看 Pro 題庫 →
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
            ? '今日小遊戲獎勵已領完，明天再來玩吧'
            : `完成一次 🪙+${REWARDS.miniGameComplete.loveCoins} ✨+${REWARDS.miniGameComplete.xp}（${isPro ? 'Pro' : 'Free'} 每日 ${cap} 次）`}
        </p>
        <DailyRewardsLoginHint className="mt-2" />
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
          <button
            type="button"
            onClick={openCustomBank}
            className={`relative flex min-h-0 items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left transition duration-200 active:scale-[0.98] ${
              !isPro ? 'border-violet-100/80 bg-violet-50/30' : lq.hubChipIdle
            }`}
          >
            <span className="absolute right-1 top-1 rounded bg-violet-100/90 px-1 py-px text-[8px] font-bold leading-none text-violet-700">
              Pro
            </span>
            <span className="shrink-0 text-base leading-none" aria-hidden>
              📝
            </span>
            <span className="min-w-0 flex-1 pr-4">
              <span className="block truncate text-[16px] font-extrabold leading-tight tracking-tight text-stone-900">
                我的題庫
              </span>
              <span className="mt-px block truncate text-[10px] font-medium text-stone-400/90">
                只玩自己新增的
              </span>
            </span>
          </button>
        </div>
      </div>

      <section className={`relative p-4 ${lq.cardElevated}`}>
        <div className={`mini-game-play-panel ${playPanelClass}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className={lq.sectionTitle}>
              <span className="mr-1">{modeDef.emoji}</span>
              {modeDef.title}
            </h2>
            <span className="text-[10px] font-semibold text-stone-400">{poolLabel}</span>
          </div>

          <MiniGamePlayCard
            phase={phase}
            showSparkles={showSparkles}
            carouselPreview={carouselPreview}
            rarityLabel={rarity ? formatRarityTaskLabel(rarity) : null}
            rarityClass={rarity ? rarityBadgeClass(rarity) : ''}
            isDiceMode={mode === 'coupleDice'}
            revealKey={revealKey}
            {...display}
          />

          {showDualActions ? (
            <div className="mt-3 flex flex-wrap gap-2">
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
                {phase === 'completed' ? '已記錄' : '💕 完成任務'}
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
              className={`mt-3 w-full rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${
                phase === 'idle' ? `game-card-cta-pulse ${lq.btnPrimary}` : lq.btnPrimary
              }`}
            >
              {phase === 'idle' ? `${modeDef.emoji} ${primaryLabel}` : primaryLabel}
            </button>
          )}
        </div>

        <MiniGameRewardFloat
          visible={rewardFloatVisible}
          loveCoins={REWARDS.miniGameComplete.loveCoins}
          xp={REWARDS.miniGameComplete.xp}
          onDone={() => setRewardFloatVisible(false)}
        />
      </section>
    </div>
  );
}
