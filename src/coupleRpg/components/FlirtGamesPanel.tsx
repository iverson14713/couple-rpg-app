import type { ReactNode } from 'react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { PrimaryButton } from './ui';
import { ProBadgeIfNeeded } from './ProBadge';
import { useProFeature } from '../hooks/useProFeature';
import { lq } from '../theme';

export function FlirtGamesPanel() {
  const gamesPro = useProFeature('flirt_games_premium');
  const {
    flirtGameDefs,
    flirtGames,
    startFlirtGame,
    rerollFlirtPrompt,
    completeFlirtGame,
    cancelFlirtGame,
    isFlirtGameDoneToday,
  } = useLoveQuest();

  const session = flirtGames.activeSession;

  return (
    <section className={`mb-3 p-4 ${lq.card}`}>
      <h2 className={`mb-1 flex flex-wrap items-center gap-1.5 ${lq.sectionTitleSm}`}>
        <span aria-hidden>💕</span> 曖昧小遊戲
        <ProBadgeIfNeeded show={gamesPro.showProBadge} feature="flirt_games_premium" />
      </h2>
      <p className="mb-3 text-[11px] text-stone-500">每日每款可領一次獎勵</p>

      <div className="grid grid-cols-2 gap-2">
        {flirtGameDefs.map((g) => {
          const done = isFlirtGameDoneToday(g.id);
          const active = session?.gameId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => startFlirtGame(g.id)}
              className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                active
                  ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-200'
                  : done
                    ? 'border-emerald-100 bg-emerald-50/60'
                    : 'border-rose-50 bg-white/80'
              }`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <p className="mt-1 text-[13px] font-bold text-stone-800">{g.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-stone-500">{g.description}</p>
              {done ? (
                <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-600">今日已完成 ✓</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {session?.gameId ? (
        <ActiveSessionBlock
          prompt={session.prompt}
          gameId={session.gameId}
          doneToday={isFlirtGameDoneToday(session.gameId)}
          onReroll={rerollFlirtPrompt}
          onComplete={completeFlirtGame}
          onCancel={cancelFlirtGame}
        />
      ) : null}

      <p className="mt-3 text-[10px] text-stone-400">完成：愛心 +3 · 默契 +2 · EXP +15（每款每日一次）</p>
    </section>
  );
}

function ActiveSessionBlock({
  prompt,
  gameId,
  doneToday,
  onReroll,
  onComplete,
  onCancel,
}: {
  prompt: string;
  gameId: string;
  doneToday: boolean;
  onReroll: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const showReroll = gameId === 'dice' || gameId === 'truth' || gameId === 'coquettish';

  return (
    <SessionCard>
      <p className="mb-2 text-[11px] font-bold text-rose-500">進行中</p>
      <p className="text-[14px] font-semibold leading-relaxed text-stone-800">{prompt}</p>
      <div className="mt-3 flex flex-col gap-2">
        {showReroll ? (
          <button type="button" onClick={onReroll} className={`rounded-xl px-3 py-2 text-xs font-bold ${lq.btnSecondary}`}>
            換一個
          </button>
        ) : null}
        <PrimaryButton onClick={onComplete} className="!py-2.5 text-xs">
          {doneToday ? '再玩一次（無額外獎勵）' : '完成挑戰 ✓'}
        </PrimaryButton>
        <button type="button" onClick={onCancel} className="text-center text-[11px] text-stone-400 underline">
          取消
        </button>
      </div>
    </SessionCard>
  );
}

function SessionCard({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/80 p-3">
      {children}
    </div>
  );
}
