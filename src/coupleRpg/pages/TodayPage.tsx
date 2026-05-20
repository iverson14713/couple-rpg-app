import { useMemo } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { FeatureActionCard } from '../components/FeatureActionCard';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { todayKey } from '../lib/dates';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { lq } from '../theme';

export function TodayPage() {
  const { navigateTo } = useCoupleRpgNav();
  const auth = useSupabaseAuth();
  const { showBindReminder, hasMembership } = useCoupleSpace();
  const {
    couple,
    todayDinner,
    draftPick,
    housework,
    taskProgress,
    rpgView,
    rpg,
    datePlanner,
    activeAnniversaryReminders,
    dismissAnniversaryReminder,
    todayCoinEarned,
  } = useLoveQuest();

  const showBindCard = showBindReminder;

  const dinnerLabel = todayDinner?.label ?? draftPick;
  const pendingHw = housework.pendingSpin;
  const { done, total, pct } = taskProgress;

  const todayLine = useMemo(() => {
    const parts: string[] = [];
    if (dinnerLabel) parts.push(`晚餐：${dinnerLabel}`);
    if (pendingHw) parts.push(`家事待做`);
    if (total > 0) parts.push(`任務 ${done}/${total}`);
    if (datePlanner.current && !datePlanner.current.completed) parts.push('約會提案中');
    return parts.length ? parts.join(' · ') : '今天一起創造小驚喜吧';
  }, [dinnerLabel, pendingHw, total, done, datePlanner.current]);

  return (
    <>
      <header className={`mb-2.5 overflow-hidden px-3 py-2.5 ${lq.card}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-400">{todayKey()}</p>
            <h1 className="text-base font-bold text-stone-900">情侶生活總控台</h1>
            <p className="truncate text-[11px] text-stone-500">
              {couple.emojiA} {couple.nameA} · {couple.emojiB} {couple.nameB}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold text-stone-400">Lv.{rpgView.level}</p>
            <p className="text-[11px] font-extrabold text-rose-600">{rpgView.title}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          <CompactStat label="愛心" value={String(rpgView.heartPoints)} />
          <CompactStat label="默契" value={`${rpgView.compatibility}%`} />
          <CompactStat label="愛心幣" value={String(rpg.loveCoins)} />
          <CompactStat label="今日" value={`+${todayCoinEarned}`} />
        </div>
        <p className="mt-2 truncate rounded-lg bg-rose-50/80 px-2 py-1 text-[10px] font-medium text-rose-800/90">
          {todayLine}
        </p>
      </header>

      {showBindCard ? (
        <section className={`mb-2.5 flex items-center gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 ${lq.cardSoft}`}>
          <span className="text-xl" aria-hidden>
            💞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-amber-950">
              {auth.user && hasMembership ? '等待另一半加入' : '還沒綁定另一半'}
            </p>
            <p className="text-[10px] leading-snug text-amber-900/80">
              {auth.user
                ? hasMembership
                  ? '邀請碼已產生，請對方輸入加入即可完成綁定'
                  : '邀請對方加入後，就能一起記錄晚餐、家事與約會'
                : '登入並綁定後，雙方可同步晚餐、家事與約會'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigateTo('profile', { profileSection: auth.user ? 'status' : 'settings' })
            }
            className="shrink-0 rounded-xl bg-amber-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm active:scale-95"
          >
            立即綁定
          </button>
        </section>
      ) : null}

      {activeAnniversaryReminders.length > 0 ? (
        <section className={`mb-2.5 px-2.5 py-2 ${lq.card}`}>
          <p className="mb-1.5 text-[10px] font-bold text-amber-800">🔔 紀念日提醒</p>
          <ul className="space-y-1">
            {activeAnniversaryReminders.slice(0, 2).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-semibold text-amber-950">
                  {r.emoji} {r.message}
                </span>
                <button type="button" onClick={() => dismissAnniversaryReminder(r.id)} className="font-bold text-amber-700">
                  OK
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">重要功能</h2>
      <div className="space-y-2.5">
        <FeatureActionCard
          emoji="🍽️"
          title="今晚吃什麼？"
          description="不知道吃什麼就交給命運決定"
          cta="開始抽晚餐"
          badge={dinnerLabel ? '已決定' : undefined}
          onAction={() => navigateTo('dinner')}
        />
        <FeatureActionCard
          emoji="🏠"
          title="家事誰來做？"
          description="公平分配，不再吵架"
          cta="分配家事"
          badge={pendingHw ? '待完成' : undefined}
          onAction={() => navigateTo('housework')}
        />
        <FeatureActionCard
          emoji="💌"
          title="今日戀愛任務"
          description="完成小任務，累積愛心幣"
          cta="查看任務"
          badge={total > 0 ? `${done}/${total}` : undefined}
          onAction={() => navigateTo('tasks')}
        />
        <FeatureActionCard
          emoji="💑"
          title="約會去哪裡？"
          description="今天來一點不一樣的"
          cta="抽約會"
          badge={datePlanner.current ? '有提案' : undefined}
          onAction={() => navigateTo('dates')}
        />
        <FeatureActionCard
          emoji="🎁"
          title="獎勵商城"
          description="用愛心幣兌換專屬卡券"
          cta="去兌換"
          badge={rpg.loveCoins > 0 ? `${rpg.loveCoins} 幣` : undefined}
          onAction={() => navigateTo('rewards')}
        />
      </div>

      {total > 0 && pct < 100 ? (
        <p className="mt-3 text-center text-[10px] text-stone-400">
          今日任務進度 {pct}% · 完成可獲愛心幣
        </p>
      ) : null}
    </>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`min-w-0 flex-1 rounded-lg px-1.5 py-1 text-center ${lq.cardSoft}`}>
      <p className="text-[8px] font-bold text-stone-500">{label}</p>
      <p className={`truncate text-[11px] font-extrabold ${lq.accent}`}>{value}</p>
    </div>
  );
}
