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
                    ? 'scale-[1.02] border-rose-300 bg-rose-50/95 shadow-sm shadow-rose-200/50'
                    : locked
                      ? 'border-violet-100/80 bg-violet-50/30'
                      : 'border-stone-200/60 bg-white'
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

      <section className={`rounded-2xl border border-rose-100/80 p-4 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.08)] ${lq.card}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[18px] font-extrabold leading-tight text-stone-900">
            <span className="mr-1">{modeDef.emoji}</span>
            {modeDef.title}
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
