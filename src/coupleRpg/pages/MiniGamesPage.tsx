import { useCallback, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { EmptyState } from '../components/EmptyState';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { useProFeature } from '../hooks/useProFeature';
import { MINI_GAME_MODES, pickFromPool, type MiniGameModeId } from '../data/coupleMiniGames';
import { lq } from '../theme';

const MAX_DAILY_REWARDS = 3;

export function MiniGamesPage() {
  const { navigateTo } = useCoupleRpgNav();
  const { rpgView, claimMiniGameReward } = useLoveQuest();
  const gamesPro = useProFeature('flirt_games_premium');
  const [mode, setMode] = useState<MiniGameModeId>('coupleDice');
  const [line, setLine] = useState<string | null>(null);
  const [roundRewarded, setRoundRewarded] = useState(false);
  const [lastGrantOk, setLastGrantOk] = useState<boolean | null>(null);

  const modeDef = useMemo(() => MINI_GAME_MODES.find((m) => m.id === mode)!, [mode]);
  const count = rpgView.miniGamesRewardsToday;
  const atCap = count >= MAX_DAILY_REWARDS;

  const draw = useCallback(() => {
    const next = pickFromPool(modeDef.pool, line);
    setLine(next);
    setRoundRewarded(false);
    setLastGrantOk(null);
  }, [modeDef.pool, line]);

  const onComplete = useCallback(() => {
    if (!line || roundRewarded) return;
    const granted = claimMiniGameReward(line);
    setRoundRewarded(true);
    setLastGrantOk(granted);
  }, [line, roundRewarded, claimMiniGameReward]);

  const onReroll = useCallback(() => {
    draw();
  }, [draw]);

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
        <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-stone-600">
          🎲 情侶小遊戲
          <ProBadgeIfNeeded show={gamesPro.showProBadge} feature="flirt_games_premium" />
        </p>
        <p className="mt-1 text-[10px] font-bold text-stone-500">今日小遊戲獎勵</p>
        <p className="text-sm font-extrabold text-rose-700">
          {count}/{MAX_DAILY_REWARDS}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
          {atCap ? '今日獎勵已滿，仍可繼續玩' : `完成一次 🪙+2 ❤️+3 🤝+1 ✨+5（每日 ${MAX_DAILY_REWARDS} 次）`}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {MINI_GAME_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setLine(null);
              setRoundRewarded(false);
              setLastGrantOk(null);
            }}
            className={`rounded-2xl border px-2 py-2.5 text-left transition active:scale-[0.98] ${
              mode === m.id
                ? 'border-rose-300 bg-rose-50/90 ring-1 ring-rose-200'
                : 'border-stone-100 bg-white/90'
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            <p className="mt-0.5 text-[12px] font-bold text-stone-900">{m.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-stone-500">{m.description}</p>
          </button>
        ))}
      </div>

      <section className={`rounded-2xl border border-rose-100/80 p-3.5 ${lq.card}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-stone-900">
            {modeDef.emoji} {modeDef.title}
          </h2>
        </div>

        {!line ? (
          <div className="py-4">
            <EmptyState compact emoji={modeDef.emoji} title="準備好了嗎？" hint="點下方按鈕抽一個小驚喜" className="mb-3 border-0 bg-transparent" />
            <button type="button" onClick={draw} className={`w-full rounded-xl px-5 py-2.5 text-sm font-bold ${lq.btnPrimary}`}>
              🎲 {modeDef.actionLabel}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
                onClick={onReroll}
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
