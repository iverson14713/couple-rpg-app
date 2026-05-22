import { useMemo } from 'react';
import { Check, ChevronLeft, Gift, RefreshCw, Sparkles } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { EmptyState } from '../components/EmptyState';
import { FlirtGamesPanel } from '../components/FlirtGamesPanel';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { PageHero } from '../components/ui';
import { todayKey } from '../lib/dates';
import { pickTaskEncouragement, taskHintForTemplate } from '../lib/taskPageCopy';
import type { LoveTask } from '../storage/types';
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

  const encouragement = useMemo(() => pickTaskEncouragement(today), [today]);
  const completedTasks = useMemo(
    () => tasks.dailyTasks.filter((t) => t.done),
    [tasks.dailyTasks]
  );
  const allDone = total > 0 && done === total;

  return (
    <div className={showTasks && !showGames ? 'flex min-h-0 flex-col gap-4 pb-6' : 'space-y-4'}>
      {embedded ? (
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex min-h-[40px] items-center gap-0.5 text-[12px] font-bold text-stone-600 active:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          返回
        </button>
      ) : null}

      {!embedded ? (
        <>
          <PageHero emoji="💌" title="戀愛任務" subtitle="每日隨機任務 · 完成領 LoveCoin" />
          <RpgMiniStats compact />
        </>
      ) : null}

      {showTasks ? (
        <>
          {/* 今日任務中心 */}
          <section className={`overflow-hidden p-4 ${lq.cardHero}`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={lq.label}>LoveQuest</p>
                <h2 className={`mt-0.5 flex items-center gap-2 ${lq.sectionTitle}`}>
                  <span className={`h-9 w-9 text-xl ${lq.iconChip}`}>💌</span>
                  今日任務中心
                </h2>
              </div>
              <span className={`shrink-0 ${lq.badgeAccent}`}>隨機 {total} 項</span>
            </div>

            <p className={`mb-3 flex items-start gap-2 px-3 py-2.5 text-[14px] font-semibold leading-snug text-rose-800 ${lq.cardSoft}`}>
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
              {encouragement}
            </p>

            <div className={`mb-1 flex justify-between text-[13px] font-semibold ${lq.textSecondary}`}>
              <span>今日完成進度</span>
              <span className={lq.accent}>
                {done}/{total} · {pct}%
              </span>
            </div>
            <div className={`mb-1 h-2 overflow-hidden rounded-full ${lq.progressTrack}`}>
              <div
                className={`h-full rounded-full ${lq.progress} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {allDone ? (
              <p className="text-[12px] font-semibold text-emerald-600">🎉 今日任務全部完成，太棒了！</p>
            ) : (
              <p className={`text-[11px] ${lq.textMuted}`}>完成任務可累積愛心與 LoveCoin</p>
            )}
          </section>

          {/* 任務列表 */}
          <section className={`p-4 ${lq.card}`}>
            <h3 className={`mb-3 flex items-center gap-1.5 ${lq.sectionTitleSm}`}>
              <span aria-hidden>✨</span>
              今日小任務
            </h3>

            {tasks.dailyTasks.length === 0 ? (
              <EmptyState compact emoji="💌" title="任務載入中" hint="稍候片刻" className="border-0 bg-transparent" />
            ) : (
              <ul className="space-y-3">
                {tasks.dailyTasks.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    coinClaimedToday={coinClaimedToday}
                    onToggle={() => toggleDailyTask(item.id)}
                    onReroll={() => rerollLoveTask(item.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* 今日獎勵 */}
          <section className="rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/80 via-white to-rose-50/60 p-4 shadow-sm ring-1 ring-amber-100/60">
            <h3 className="mb-2.5 flex items-center gap-2 text-[15px] font-bold text-stone-900">
              <Gift className="h-4 w-4 text-amber-600" aria-hidden />
              今日獎勵
            </h3>
            <p className="mb-2.5 text-[13px] font-semibold text-stone-700">完成今日戀愛任務可獲得：</p>
            <ul className="grid grid-cols-2 gap-2 text-[13px] font-bold text-stone-800">
              <RewardPill emoji="❤️" label="愛心" value="+2" />
              <RewardPill emoji="🤝" label="默契" value="+1" />
              <RewardPill emoji="✨" label="EXP" value="+12" />
              <RewardPill emoji="🪙" label="LoveCoin" value="+10" />
            </ul>
            {coinClaimedToday ? (
              <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-[12px] font-semibold leading-relaxed text-emerald-700 ring-1 ring-emerald-100">
                ✅ 今日獎勵已領取，仍可以繼續完成任務。
              </p>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                🪙 每日 LoveCoin 獎勵最多領一次 · 換一個任務不會重置領獎
              </p>
            )}
          </section>

          {/* 今日回顧 */}
          <section className={`p-4 ${lq.cardSoft}`}>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
              <span aria-hidden>📔</span>
              今日回顧
            </h3>
            {completedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200/90 bg-white/60 px-3 py-4 text-center">
                <p className="text-[14px] font-semibold text-stone-600">今天還沒有完成任務。</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-stone-500">
                  完成後會幫你們留下今天的小互動。
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {completedTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-3 py-2.5 text-[14px] font-semibold text-stone-800"
                  >
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                    <span className="text-lg" aria-hidden>
                      {t.emoji}
                    </span>
                    <span className="min-w-0 flex-1">{t.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 底部墊高，避免 Tab 遮擋時仍顯得空 */}
          <div className="h-2 shrink-0" aria-hidden />
        </>
      ) : null}

      {showGames ? <FlirtGamesPanel /> : null}
    </div>
  );
}

function TaskCard({
  item,
  coinClaimedToday,
  onToggle,
  onReroll,
}: {
  item: LoveTask;
  coinClaimedToday: boolean;
  onToggle: () => void;
  onReroll: () => void;
}) {
  const hint = taskHintForTemplate(item.templateId, item.label);
  const statusHint = item.done
    ? coinClaimedToday
      ? '獎勵已計入今日'
      : '已完成'
    : coinClaimedToday
      ? '今日獎勵已領，仍可勾選完成'
      : '點擊右側完成';

  return (
    <li
      className={`rounded-2xl border-2 p-3.5 transition-colors ${
        item.done
          ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white'
          : 'border-rose-100/90 bg-gradient-to-br from-rose-50/40 to-white shadow-sm'
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner ${
            item.done ? 'bg-emerald-100/80 ring-1 ring-emerald-100' : 'bg-white ring-1 ring-rose-100'
          }`}
          aria-hidden
        >
          {item.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[16px] font-extrabold leading-snug ${
              item.done ? 'text-stone-500 line-through decoration-stone-300' : 'text-stone-900'
            }`}
          >
            {item.label}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-stone-500">{hint}</p>
          <p className="mt-1.5 text-[11px] font-semibold text-stone-400">{statusHint}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={item.done ? `取消完成：${item.label}` : `完成：${item.label}`}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition active:scale-95 ${
            item.done
              ? 'border-emerald-400 bg-emerald-500 text-white shadow-sm'
              : 'border-stone-200 bg-white text-stone-300 hover:border-rose-200'
          }`}
        >
          {item.done ? <Check className="h-6 w-6" strokeWidth={2.5} /> : <span className="h-5 w-5 rounded-md border-2 border-stone-300" />}
        </button>
      </div>

      <button
        type="button"
        onClick={onReroll}
        className={`mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 px-3 text-[13px] font-bold text-rose-700 active:scale-[0.98] ${lq.btnSecondary}`}
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        換一個
      </button>
    </li>
  );
}

function RewardPill({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <li className={`flex items-center gap-2 px-3 py-2.5 ${lq.cardFeature}`}>
      <span className="text-lg" aria-hidden>
        {emoji}
      </span>
      <span>
        {label} <span className="text-rose-600">{value}</span>
      </span>
    </li>
  );
}
