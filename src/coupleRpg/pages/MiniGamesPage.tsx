import { useCallback, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import { EmptyState } from '../components/EmptyState';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { COUPLE_GAME_MODES, type CoupleGameModeId } from '../data/coupleGamePrompts';
import {
  countPromptsByMode,
  formatPromptLine,
  getCoupleGameLibraryStatus,
  getModeDef,
  pickGamePrompt,
} from '../lib/coupleGamePromptsLib';
import { lq } from '../theme';

export function MiniGamesPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { rpgView, claimMiniGameReward } = useLoveQuest();
  const { isPro, openUpgradeModal } = useUserPlan();

  const [mode, setMode] = useState<CoupleGameModeId>('coupleDice');
  const [prompt, setPrompt] = useState<ReturnType<typeof pickGamePrompt>>(null);
  const [roundRewarded, setRoundRewarded] = useState(false);
  const [lastGrantOk, setLastGrantOk] = useState<boolean | null>(null);

  const modeDef = useMemo(() => getModeDef(mode)!, [mode]);
  const library = useMemo(() => getCoupleGameLibraryStatus(isPro), [isPro]);
  const poolSize = useMemo(() => countPromptsByMode(mode, isPro), [mode, isPro]);
  const line = prompt ? formatPromptLine(prompt) : null;

  const count = rpgView.miniGamesRewardsToday;
  const cap = rpgView.miniGamesRewardCap;
  const atCap = count >= cap;

  const selectMode = useCallback(
    (next: CoupleGameModeId) => {
      const def = getModeDef(next);
      if (def?.proOnly && !isPro) {
        openUpgradeModal('升級 Pro 解鎖更多情侶互動題庫');
        return;
      }
      setMode(next);
      setPrompt(null);
      setRoundRewarded(false);
      setLastGrantOk(null);
    },
    [isPro, openUpgradeModal]
  );

  const draw = useCallback(() => {
    const next = pickGamePrompt(mode, isPro, prompt?.id);
    setPrompt(next);
    setRoundRewarded(false);
    setLastGrantOk(null);
  }, [mode, isPro, prompt?.id]);

  const onComplete = useCallback(() => {
    if (!line || roundRewarded) return;
    setRoundRewarded(true);
    const granted = claimMiniGameReward(line);
    setLastGrantOk(granted);
  }, [line, roundRewarded, claimMiniGameReward]);

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

      <div className={`mb-3 rounded-2xl border border-rose-100/90 bg-white/95 px-3 py-2.5 ${lq.card}`}>
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

      <div className={`mb-3 rounded-2xl border border-rose-100/90 bg-white/95 px-3 py-2.5 ${lq.card}`}>
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

      <div className="mb-3 grid grid-cols-2 gap-2">
        {COUPLE_GAME_MODES.map((m) => {
          const locked = Boolean(m.proOnly && !isPro);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMode(m.id)}
              className={`relative rounded-2xl border px-2 py-2.5 text-left transition active:scale-[0.98] ${
                mode === m.id
                  ? 'border-rose-300 bg-rose-50/90 ring-1 ring-rose-200'
                  : locked
                    ? 'border-violet-100 bg-violet-50/40'
                    : 'border-stone-100 bg-white/90'
              }`}
            >
              {m.proOnly ? (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">
                  ✨ Pro
                </span>
              ) : null}
              <span className="text-xl">{m.emoji}</span>
              <p className="mt-0.5 text-[12px] font-bold text-stone-900">{m.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-stone-500">{m.description}</p>
            </button>
          );
        })}
      </div>

      <section className={`rounded-2xl border border-rose-100/80 p-3.5 ${lq.card}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-stone-900">
            {modeDef.emoji} {modeDef.title}
          </h2>
          <span className="text-[10px] font-semibold text-stone-400">題庫 {poolSize} 題</span>
        </div>

        {!line ? (
          <div className="py-4">
            <EmptyState
              compact
              emoji={modeDef.emoji}
              title="準備好了嗎？"
              hint={poolSize > 0 ? '點下方按鈕抽一個小驚喜' : '此模式需 Pro 解鎖'}
              className="mb-3 border-0 bg-transparent"
            />
            <button
              type="button"
              onClick={draw}
              disabled={poolSize === 0}
              className={`w-full rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${lq.btnPrimary}`}
            >
              🎲 {modeDef.actionLabel}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {prompt ? (
              <p className="text-center text-[11px] font-semibold text-stone-400">
                {prompt.emoji} {prompt.category}
              </p>
            ) : null}
            <p className="min-h-[4.5rem] rounded-xl bg-rose-50/70 px-3 py-4 text-center text-[17px] font-bold leading-snug text-stone-800">
              {line}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onComplete}
                disabled={roundRewarded}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${
                  roundRewarded ? 'bg-stone-100 text-stone-400' : 'bg-emerald-600 text-white shadow-sm active:scale-[0.99]'
                }`}
              >
                {roundRewarded ? '✅ 已記錄' : '✅ 完成'}
              </button>
              <button
                type="button"
                onClick={draw}
                className="flex-1 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-bold text-stone-700 active:scale-[0.99]"
              >
                🔄 換一個
              </button>
            </div>
            {roundRewarded && lastGrantOk !== null ? (
              <p className="text-center text-[11px] leading-snug text-stone-500">
                {lastGrantOk ? '🎉 已發放 🪙+2 ❤️+3 🤝+1 ✨+5' : '今日獎勵已滿，謝謝你們的陪伴 💕'}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
