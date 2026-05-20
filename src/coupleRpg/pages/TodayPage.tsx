import type { ReactNode } from 'react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { todayKey } from '../lib/dates';
import { lq } from '../theme';

export function TodayPage() {
  const {
    couple,
    todayDinner,
    draftPick,
    housework,
    tasks,
    taskProgress,
    rpgView,
    rpg,
    datePlanner,
    upcomingAnniversaries,
    activeAnniversaryReminders,
    dismissAnniversaryReminder,
    todayCoinEarned,
    nextAnniversary,
  } = useLoveQuest();

  const upcomingTop3 = upcomingAnniversaries.slice(0, 3);
  const dinnerLabel = todayDinner?.label ?? draftPick;
  const pendingHw = housework.pendingSpin;
  const { done, total, pct } = taskProgress;

  return (
    <>
      <header className={`mb-3 overflow-hidden p-4 ${lq.card}`}>
        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">{todayKey()}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-stone-900">今日 ❤️</h1>
            <p className="text-[13px] text-stone-500">
              {couple.emojiA} {couple.nameA} · {couple.emojiB} {couple.nameB}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-stone-400">Lv.{rpgView.level}</p>
            <p className="text-sm font-extrabold text-rose-600">{rpgView.title}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          <MiniStat label="愛心" value={String(rpgView.heartPoints)} />
          <MiniStat label="默契" value={`${rpgView.compatibility}%`} />
          <MiniStat label="愛心幣" value={String(rpg.loveCoins)} />
          <MiniStat label="今日+" value={`+${todayCoinEarned}`} />
        </div>
      </header>

      {activeAnniversaryReminders.length > 0 ? (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <h2 className="mb-2 text-xs font-bold text-amber-800">🔔 紀念日提醒</h2>
          <ul className="space-y-1.5">
            {activeAnniversaryReminders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-amber-50/90 px-2.5 py-2 text-[11px]"
              >
                <span className="font-semibold text-amber-950">
                  {r.emoji} {r.message}
                </span>
                <button
                  type="button"
                  onClick={() => dismissAnniversaryReminder(r.id)}
                  className="shrink-0 font-bold text-amber-700"
                >
                  OK
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <DashTile
          emoji="💌"
          title="戀愛任務"
          value={`${done}/${total}`}
          hint={pct >= 100 ? '太棒了！' : '到「互動」完成'}
          accent={pct >= 100 ? 'done' : 'pending'}
        />
        <DashTile
          emoji="🏠"
          title="家事"
          value={pendingHw ? '待完成' : '—'}
          hint={pendingHw ? `${pendingHw.emoji} ${pendingHw.taskLabel}` : '到「生活」轉盤'}
          accent={pendingHw ? 'warn' : 'idle'}
        />
        <DashTile
          emoji="🍽️"
          title="晚餐"
          value={dinnerLabel ? '已決定' : '未定'}
          hint={dinnerLabel ?? '到「生活」抽籤'}
          accent={dinnerLabel ? 'done' : 'idle'}
        />
        <DashTile
          emoji="💑"
          title="約會"
          value={datePlanner.current ? '有提案' : '—'}
          hint={datePlanner.current?.title ?? '到「生活」產生'}
          accent={datePlanner.current?.completed ? 'done' : datePlanner.current ? 'warn' : 'idle'}
        />
      </div>

      {nextAnniversary || upcomingTop3.length > 0 ? (
        <TodayCard emoji="🎀" title="Upcoming 紀念日" accent={`${upcomingTop3.length} 項`}>
          {nextAnniversary ? (
            <p className="mb-2 text-sm font-bold text-rose-700">
              最近：{nextAnniversary.emoji} {nextAnniversary.event.name}
              <span className="ml-1 font-normal text-stone-500">
                · {nextAnniversary.daysUntil === 0 ? '今天' : `${nextAnniversary.daysUntil} 天後`}
              </span>
            </p>
          ) : null}
          <ul className="space-y-1">
            {upcomingTop3.map((u) => (
              <li key={u.event.id} className="flex justify-between text-[12px] text-stone-700">
                <span>
                  {u.emoji} {u.event.name}
                </span>
                <span className="font-bold text-rose-600">
                  {u.daysUntil === 0 ? '今天' : `${u.daysUntil} 天`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-stone-400">詳細管理請到「回憶」</p>
        </TodayCard>
      ) : null}

      {total > 0 ? (
        <TodayCard emoji="✨" title="今日任務快覽" accent={`${pct}%`}>
          <ul className="space-y-1">
            {tasks.dailyTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-[12px]">
                <span>{t.done ? '✅' : '○'}</span>
                <span className={t.done ? 'text-stone-400 line-through' : 'text-stone-700'}>
                  {t.emoji} {t.label}
                </span>
              </li>
            ))}
          </ul>
        </TodayCard>
      ) : null}
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-xl py-2 ${lq.cardSoft}`}>
      <p className="text-[9px] font-bold text-stone-500">{label}</p>
      <p className={`text-sm font-extrabold ${lq.accent}`}>{value}</p>
    </div>
  );
}

function DashTile({
  emoji,
  title,
  value,
  hint,
  accent,
}: {
  emoji: string;
  title: string;
  value: string;
  hint: string;
  accent: 'done' | 'warn' | 'pending' | 'idle';
}) {
  const ring =
    accent === 'done'
      ? 'ring-emerald-200 bg-emerald-50/50'
      : accent === 'warn'
        ? 'ring-amber-200 bg-amber-50/50'
        : accent === 'pending'
          ? 'ring-rose-200 bg-rose-50/50'
          : 'ring-stone-100 bg-white/60';

  return (
    <div className={`rounded-2xl p-3 ring-1 ${ring}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{emoji}</span>
        <span className="text-[11px] font-bold text-stone-800">{title}</span>
      </div>
      <p className="mt-1 text-sm font-extrabold text-stone-900">{value}</p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-stone-500">{hint}</p>
    </div>
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
    <section className={`mb-3 p-3 ${lq.card}`}>
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
