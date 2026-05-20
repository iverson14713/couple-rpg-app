import { useLoveQuest } from '../context/LoveQuestContext';
import { FlirtGamesPanel } from '../components/FlirtGamesPanel';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { PageHero } from '../components/ui';
import { lq } from '../theme';

export function TasksPage() {
  const { tasks, taskProgress, toggleDailyTask } = useLoveQuest();
  const { done, total, pct } = taskProgress;

  return (
    <>
      <PageHero emoji="💕" title="戀愛任務" subtitle="每日隨機任務 + 曖昧小遊戲" />
      <RpgMiniStats compact />

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
        <div className={`mb-3 h-1.5 overflow-hidden rounded-full ${lq.progressTrack}`}>
          <div className={`h-full rounded-full ${lq.progress} transition-all`} style={{ width: `${pct}%` }} />
        </div>

        {tasks.dailyTasks.length === 0 ? (
          <p className="text-sm text-stone-500">今日任務載入中…</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {tasks.dailyTasks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleDailyTask(item.id)}
                className={`flex min-h-[52px] items-center justify-between rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                  item.done ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-50 bg-rose-50/30'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-sm font-bold ${item.done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                    {item.label}
                  </span>
                </span>
                <span className="ml-2 shrink-0 text-lg">{item.done ? '✅' : '⬜'}</span>
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-[11px] text-stone-500">每完成一項：愛心 +2 · 默契 +1 · EXP +12</p>
      </section>

      <FlirtGamesPanel />
    </>
  );
}
