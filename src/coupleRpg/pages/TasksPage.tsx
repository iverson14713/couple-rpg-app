import { ChevronLeft } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { FlirtGamesPanel } from '../components/FlirtGamesPanel';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { PageHero } from '../components/ui';
import { todayKey } from '../lib/dates';
import { lq } from '../theme';

export function TasksPage({
  embedded,
  section = 'all',
}: {
  embedded?: boolean;
  section?: 'tasks' | 'games' | 'all';
} = {}) {
  const { navigateTo } = useCoupleRpgNav();
  const { tasks, taskProgress, toggleDailyTask, rerollLoveTask } = useLoveQuest();
  const { done, total, pct } = taskProgress;
  const showTasks = section === 'all' || section === 'tasks';
  const showGames = section === 'all' || section === 'games';
  const today = todayKey();
  const coinClaimedToday = tasks.dailyRewardClaimedDate === today;

  return (
    <>
      {embedded ? (
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          返回
        </button>
      ) : null}

      {!embedded ? (
        <>
          <PageHero emoji="💕" title="戀愛任務" subtitle="每日隨機任務 + 曖昧小遊戲" />
          <RpgMiniStats compact />
        </>
      ) : null}

      {showTasks ? (
        <section className={`mb-3 p-4 ${lq.card}`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900">今日戀愛任務</h2>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-100">
              隨機 {total} 項
            </span>
          </div>
          <div className="mb-2 flex justify-between text-[11px] font-medium text-stone-500">
            <span>今日完成進度</span>
            <span className={lq.accent}>
              {done}/{total} · {pct}%
            </span>
          </div>
          <div className={`mb-2 h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
            <div className={`h-full rounded-full ${lq.progress} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mb-2 text-[10px] text-stone-400">
            每日戀愛任務獎勵（含 LoveCoin）每天最多領一次；「換一個」不會重置領獎狀態。今日已領過後再完成任務不會再次發放戀愛任務獎勵。
          </p>

          {tasks.dailyTasks.length === 0 ? (
            <p className="text-sm text-stone-500">今日任務載入中…</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {tasks.dailyTasks.map((item) => {
                const statusLine = (() => {
                  if (item.done) {
                    return coinClaimedToday ? '獎勵已領' : '已完成';
                  }
                  return coinClaimedToday ? '今日獎勵已領' : '完成任務';
                })();
                return (
                  <div
                    key={item.id}
                    className={`flex gap-1.5 rounded-2xl border p-2.5 ${
                      item.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-50 bg-rose-50/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDailyTask(item.id)}
                      className="flex min-h-[48px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-1 text-left transition active:scale-[0.99]"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{item.emoji}</span>
                          <span
                            className={`text-sm font-bold ${item.done ? 'text-stone-400 line-through' : 'text-stone-700'}`}
                          >
                            {item.label}
                          </span>
                        </span>
                        <span className="pl-8 text-[10px] font-semibold text-stone-500">{statusLine}</span>
                      </span>
                      <span className="shrink-0 text-lg">{item.done ? '✅' : '⬜'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rerollLoveTask(item.id)}
                      className="flex w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-stone-200/80 bg-white px-1 py-1 text-[10px] font-bold leading-tight text-rose-700 shadow-sm active:scale-95"
                    >
                      換一個
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-[11px] text-stone-500">每完成一項：愛心 +2 · 默契 +1 · EXP +12 · 愛心幣 +10</p>
        </section>
      ) : null}

      {showGames ? <FlirtGamesPanel /> : null}
    </>
  );
}
