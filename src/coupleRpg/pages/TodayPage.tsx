import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { StatsCard } from '../components/StatsCard';
import { useLoveQuest } from '../context/LoveQuestContext';
import { todayKey } from '../lib/dates';
import { lq } from '../theme';

export function TodayPage() {
  const {
    todayDinner,
    draftPick,
    housework,
    tasks,
    taskProgress,
    rpgView,
    datePlanner,
    rpg,
    upcomingAnniversaries,
    activeAnniversaryReminders,
    dismissAnniversaryReminder,
  } = useLoveQuest();
  const upcomingTop3 = upcomingAnniversaries.slice(0, 3);
  const dinnerLabel = todayDinner?.label ?? draftPick;
  const pendingHw = housework.pendingSpin;
  const { done, total } = taskProgress;

  return (
    <>
      <AppHeader dateLabel={todayKey()} />
      <StatsCard />

      {(activeAnniversaryReminders.length > 0 || upcomingTop3.length > 0) && (
        <TodayCard emoji="🎀" title="紀念日提醒" accent={`${upcomingTop3.length} 項`}>
          {activeAnniversaryReminders.length > 0 ? (
            <ul className="mb-2 space-y-1.5">
              {activeAnniversaryReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-amber-50/80 px-2.5 py-2 text-[12px]"
                >
                  <span className="font-semibold text-amber-950">
                    {r.emoji} {r.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => dismissAnniversaryReminder(r.id)}
                    className="shrink-0 text-[10px] font-bold text-amber-700"
                  >
                    知道了
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="space-y-1">
            {upcomingTop3.map((u) => (
              <li key={u.event.id} className="flex justify-between text-[13px] text-stone-700">
                <span>
                  {u.emoji} {u.event.name}
                </span>
                <span className="font-bold text-rose-600">
                  {u.daysUntil === 0 ? '今天' : `${u.daysUntil} 天`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-stone-400">到「紀念」分頁管理 · 7 / 3 / 0 天前提醒</p>
        </TodayCard>
      )}

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

      <TodayCard
        emoji="💑"
        title="約會提案"
        accent={datePlanner.current?.completed ? '已完成' : datePlanner.current ? '待出發' : '未產生'}
      >
        {datePlanner.current ? (
          <p className="text-sm text-stone-700">
            {datePlanner.current.emoji} {datePlanner.current.title}
          </p>
        ) : (
          <p className="text-sm text-stone-500">到「約會」分頁隨機產生假日行程</p>
        )}
        <p className="mt-1 text-[11px] text-stone-400">約會成就 {rpg.dateAchievements} 次</p>
      </TodayCard>

      <TodayCard emoji="💌" title="今日戀愛任務" accent={`${done}/${total}`}>
        <ul className="space-y-1">
          {tasks.dailyTasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-[13px]">
              <span>{t.done ? '✅' : '⬜'}</span>
              <span className={t.done ? 'text-stone-400 line-through' : 'text-stone-700'}>
                {t.emoji} {t.label}
              </span>
            </li>
          ))}
        </ul>
        {total === 0 ? <p className="mt-1 text-[12px] text-stone-500">到「任務」查看今日隨機任務</p> : null}
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
