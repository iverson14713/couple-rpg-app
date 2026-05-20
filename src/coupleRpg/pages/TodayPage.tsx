import { useMemo } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { getUpcomingImportantDates, formatHomeCoupleHeaderLine } from '../lib/importantDates';
import { todayKey } from '../lib/dates';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { lq } from '../theme';

export function TodayPage() {
  const { navigateTo } = useCoupleRpgNav();
  const auth = useSupabaseAuth();
  const { showBindReminder, hasMembership } = useCoupleSpace();
  const {
    todayDinner,
    draftPick,
    housework,
    taskProgress,
    rpgView,
    datePlanner,
    activeAnniversaryReminders,
    dismissAnniversaryReminder,
    todayCoinEarned,
    coupleExtended,
  } = useLoveQuest();

  const importantPreview = useMemo(() => getUpcomingImportantDates(coupleExtended), [coupleExtended]);
  const coupleHeaderLine = useMemo(() => formatHomeCoupleHeaderLine(coupleExtended), [coupleExtended]);
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
            <h1 className="text-lg font-extrabold leading-tight text-stone-900">情侶生活總控台</h1>
            <p className="truncate text-[12px] leading-snug text-stone-600">{coupleHeaderLine}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[12px] font-extrabold text-rose-600">{rpgView.title}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          <CompactStat
            label="愛心值"
            value={String(rpgView.heartPoints)}
            hint="愛心值：代表近期甜蜜程度（0～100）。"
          />
          <CompactStat
            label="默契度"
            value={`${rpgView.compatibility}%`}
            hint="默契度：代表你們長期一起完成事情的配合度（0～100）。"
          />
          <CompactStat
            label="Lv."
            value={String(rpgView.level)}
            hint="EXP：完成任務、家事、約會後累積，用來提升情侶等級（每 100 EXP 升一等）。"
          />
          <CompactStat
            label="今日獲得"
            value={`+${todayCoinEarned}`}
            hint="LoveCoin：完成互動後獲得，可在獎勵商城兌換卡券。此欄為今日累積的愛心幣。"
          />
        </div>
        <details className="mt-1.5 rounded-lg border border-stone-100 bg-stone-50/70 px-2 py-1.5 text-[9px] leading-snug text-stone-600">
          <summary className="cursor-pointer select-none font-bold text-stone-500">數值說明</summary>
          <ul className="mt-1.5 list-disc space-y-1 pl-3.5">
            <li>愛心值：代表近期甜蜜程度。</li>
            <li>默契度：代表你們長期一起完成事情的配合度。</li>
            <li>EXP：完成任務、家事、約會後累積，用來提升情侶等級。</li>
            <li>LoveCoin：完成互動後獲得，可在獎勵商城兌換卡券。</li>
          </ul>
        </details>
        <p className="mt-2 truncate rounded-lg bg-rose-50/80 px-2 py-1 text-[11px] font-medium text-rose-800/90">
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

      <ImportantDatesCard
        preview={importantPreview}
        onGoSettings={() =>
          navigateTo('profile', { profileSection: 'settings', scrollToElementId: 'lq-couple-profile' })
        }
      />

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

      <h2 className="mb-2.5 px-0.5 text-[13px] font-extrabold uppercase tracking-wide text-stone-600">
        重要功能
      </h2>
      <div className="space-y-2.5">
        <section
          className={`relative overflow-hidden rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50/90 p-4 shadow-[0_12px_36px_-14px_rgba(244,114,182,0.45)]`}
        >
          <span className="absolute -right-2 -top-2 text-5xl opacity-[0.12]" aria-hidden>
            🎲
          </span>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-400">一起玩</p>
            <h3 className="mt-0.5 text-xl font-extrabold leading-snug text-stone-900">情侶小遊戲</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-stone-700">
              骰子、真心話、默契問答，讓今天更有趣
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo('miniGames')}
                className={`inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-[14px] font-bold ${lq.btnPrimary}`}
              >
                開始玩
              </button>
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-rose-600 ring-1 ring-rose-100">
                今日獎勵 {Math.min(rpgView.miniGamesRewardsToday, 3)}/3
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <HomeCoreFeatureCard
            emoji="🍽️"
            title="今晚吃什麼？"
            description="不知道吃什麼就交給命運決定"
            badge={dinnerLabel ? '已決定' : undefined}
            cta="開始抽晚餐"
            onAction={() => navigateTo('dinner')}
          />
          <HomeCoreFeatureCard
            emoji="🏠"
            title="家事誰來做？"
            description="公平分配，不再吵架"
            badge={pendingHw ? '待完成' : undefined}
            cta="分配家事"
            onAction={() => navigateTo('housework')}
          />
          <HomeCoreFeatureCard
            emoji="💌"
            title="今日戀愛任務"
            description="完成小任務，累積愛心幣"
            badge={total > 0 ? `${done}/${total}` : undefined}
            cta="查看任務"
            onAction={() => navigateTo('tasks')}
          />
          <HomeCoreFeatureCard
            emoji="💑"
            title="約會去哪裡？"
            description="今天來一點不一樣的"
            badge={datePlanner.current ? '有提案' : undefined}
            cta="抽約會"
            onAction={() => navigateTo('dates')}
          />
        </div>
      </div>

      {total > 0 && pct < 100 ? (
        <p className="mt-3 text-center text-[11px] text-stone-500">
          今日任務進度 {pct}% · 完成可獲愛心幣
        </p>
      ) : null}
    </>
  );
}

function HomeCoreFeatureCard({
  emoji,
  title,
  description,
  badge,
  cta,
  onAction,
}: {
  emoji: string;
  title: string;
  description: string;
  badge?: string;
  cta: string;
  onAction: () => void;
}) {
  return (
    <article
      className={`relative flex min-h-[10.5rem] flex-col rounded-2xl border border-rose-100/90 bg-white/95 p-3 shadow-[0_6px_22px_-12px_rgba(244,114,182,0.38)] transition active:scale-[0.99]`}
    >
      {badge ? (
        <span className="absolute right-2 top-2 max-w-[calc(100%-3.75rem)] truncate rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-100/90">
          {badge}
        </span>
      ) : null}
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 text-lg ring-1 ring-rose-100/70"
        aria-hidden
      >
        {emoji}
      </span>
      <h3 className="mt-1.5 pr-1 text-[12px] font-extrabold leading-snug text-stone-900">{title}</h3>
      <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] leading-snug text-stone-600">{description}</p>
      <button type="button" onClick={onAction} className={`mt-2 w-full rounded-lg py-2 text-[11px] font-bold ${lq.btnPrimary}`}>
        {cta}
      </button>
    </article>
  );
}

function CompactStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`min-w-0 flex-1 rounded-lg px-1.5 py-1.5 text-center ${lq.cardSoft}`} title={hint}>
      <p className="text-[9px] font-bold leading-tight text-stone-600">{label}</p>
      <p className={`mt-0.5 truncate text-[12px] font-extrabold leading-none ${lq.accent}`}>{value}</p>
    </div>
  );
}

function ImportantDatesCard({
  preview,
  onGoSettings,
}: {
  preview: ReturnType<typeof getUpcomingImportantDates>;
  onGoSettings: () => void;
}) {
  if (!preview.hasConfigured) {
    return (
      <section className={`mb-2.5 rounded-2xl border border-rose-100/80 bg-rose-50/40 px-3 py-2.5 ${lq.cardSoft}`}>
        <p className="text-[12px] font-semibold leading-snug text-stone-700">
          設定生日與紀念日，LoveQuest 會幫你記住重要日子。
        </p>
        <button
          type="button"
          onClick={onGoSettings}
          className="mt-2 w-full rounded-xl bg-rose-600 py-2 text-[12px] font-bold text-white shadow-sm active:scale-[0.99]"
        >
          去設定
        </button>
      </section>
    );
  }

  if (preview.items.length === 0) {
    return (
      <section className={`mb-2.5 px-2.5 py-2.5 ${lq.card}`}>
        <p className="mb-1 text-[12px] font-extrabold text-rose-800">重要日子</p>
        <p className="text-[11px] leading-snug text-stone-600">請以正確日期格式（YYYY-MM-DD）填寫，以便顯示倒數。</p>
        <button type="button" onClick={onGoSettings} className="mt-2 text-[11px] font-bold text-rose-700 underline">
          前往設定
        </button>
      </section>
    );
  }

  return (
    <section className={`mb-2.5 px-2.5 py-2.5 ${lq.card}`}>
      <p className="mb-2 text-[12px] font-extrabold text-rose-800">重要日子</p>
      <ul className="space-y-1.5">
        {preview.items.map((it) => (
          <li key={it.id} className="text-[13px] leading-snug text-stone-800">
            {it.isToday ? (
              <span className="font-bold text-rose-700">{it.todayLine}</span>
            ) : (
              <span className="font-medium">{it.countdownLine}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
