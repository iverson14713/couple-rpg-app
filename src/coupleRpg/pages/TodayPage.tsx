import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { StatsCard } from '../components/StatsCard';
import { useLoveQuest } from '../context/LoveQuestContext';
import { todayKey } from '../lib/dates';
import { lq } from '../theme';

export function TodayPage() {
  const { todayDinner, draftPick, housework, tasks, rpgView } = useLoveQuest();
  const dinnerLabel = todayDinner?.label ?? draftPick;
  const doneTasks = tasks.loveTasks.filter((t) => t.done).length;
  const pendingHw = housework.pendingSpin;

  return (
    <>
      <AppHeader dateLabel={todayKey()} />
      <StatsCard />

      <TodayCard emoji="🍽️" title="今日晚餐" accent={dinnerLabel ? '已決定' : '待決定'}>
        {dinnerLabel ? (
          <p className="text-lg font-bold text-rose-700">{dinnerLabel}</p>
        ) : (
          <p className="text-sm text-stone-500">到「晚餐」分頁抽籤決定今晚菜色</p>
        )}
      </TodayCard>

      <TodayCard emoji="🏠" title="今日家事" accent={`本週 ${rpgView.houseworkPoints} 分`}>
        {pendingHw ? (
          <p className="text-sm text-stone-700">
            {pendingHw.emoji} {pendingHw.taskLabel} → 待完成
          </p>
        ) : (
          <p className="text-sm text-stone-500">到「家事」分頁轉盤分配</p>
        )}
      </TodayCard>

      <TodayCard emoji="💌" title="今日戀愛任務" accent={`${doneTasks}/${tasks.loveTasks.length}`}>
        <ul className="space-y-1">
          {tasks.loveTasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-[13px]">
              <span>{t.done ? '✅' : '⬜'}</span>
              <span className={t.done ? 'text-stone-400 line-through' : 'text-stone-700'}>
                {t.emoji} {t.label}
              </span>
            </li>
          ))}
        </ul>
      </TodayCard>
    </>
  );
}

function TodayCard({
  emoji,
  title,
  accent,
  children,
}: {
  emoji: string;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className={`mb-3 p-4 ${lq.card}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-stone-900">
          {emoji} {title}
        </h2>
        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-100">
          {accent}
        </span>
      </div>
      {children}
    </section>
  );
}
