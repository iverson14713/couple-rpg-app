import { useMemo, type ReactNode } from 'react';
import { Coins, Heart, Sparkles, Users } from 'lucide-react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { getUpcomingImportantDates, formatHomeCoupleHeaderLine } from '../lib/importantDates';
import { getTogetherDaysInfo } from '../lib/relationshipDays';
import { todayKey } from '../lib/dates';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { DailyPartnerMessageCard } from '../components/DailyPartnerMessageCard';
import { NicknameSetupBanner } from '../components/NicknameSetupBanner';
import type { TogetherDaysInfo } from '../lib/relationshipDays';
import { lq } from '../theme';

export function TodayPage() {
  const { navigateTo } = useCoupleRpgNav();
  const auth = useSupabaseAuth();
  const { showBindReminder, hasMembership } = useCoupleSpace();
  const {
    todayDinner,
    draftPick,
    houseworkHomeStatus,
    taskProgress,
    rpgView,
    datePlanner,
    activeAnniversaryReminders,
    dismissAnniversaryReminder,
    todayCoinEarned,
    coupleExtended,
  } = useLoveQuest();

  const importantPreview = useMemo(() => getUpcomingImportantDates(coupleExtended), [coupleExtended]);
  const togetherDays = useMemo(
    () => getTogetherDaysInfo(coupleExtended.relationshipStart),
    [coupleExtended.relationshipStart]
  );
  const coupleHeaderLine = useMemo(() => formatHomeCoupleHeaderLine(coupleExtended), [coupleExtended]);
  const goCoupleProfile = () =>
    navigateTo('profile', { profileSection: 'settings', scrollToElementId: 'lq-couple-profile' });
  const showBindCard = showBindReminder;

  const dinnerLabel = todayDinner?.label ?? draftPick;
  const { done, total, pct } = taskProgress;

  const todayLine = useMemo(() => {
    const parts: string[] = [];
    if (dinnerLabel) parts.push(`晚餐：${dinnerLabel}`);
    if (houseworkHomeStatus.summaryPart) parts.push(houseworkHomeStatus.summaryPart);
    if (total > 0) parts.push(`任務 ${done}/${total}`);
    if (datePlanner.current && !datePlanner.current.completed) parts.push('約會提案中');
    return parts.length ? parts.join(' · ') : '今天一起創造小驚喜吧';
  }, [dinnerLabel, houseworkHomeStatus.summaryPart, total, done, datePlanner.current]);

  return (
    <>
      <header className={`mb-2.5 overflow-hidden px-3 py-2.5 ${lq.card}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-stone-400">{todayKey()}</p>
            <h1 className={`mt-0.5 text-[22px] font-bold leading-tight ${lq.text}`}>情侶生活總控台</h1>
            <p className={`mt-0.5 truncate text-[13px] ${lq.textSecondary}`}>{coupleHeaderLine}</p>
          </div>
          <div className="shrink-0 rounded-full bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-600">
            {rpgView.title}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          <HudStat icon={<Heart className="h-3.5 w-3.5 text-rose-400" strokeWidth={2.5} />} label="愛心值" value={String(rpgView.heartPoints)} hint="愛心值：代表近期甜蜜程度（0～100）。" />
          <HudStat icon={<Users className="h-3.5 w-3.5 text-violet-400" strokeWidth={2.5} />} label="默契度" value={`${rpgView.compatibility}%`} hint="默契度：代表你們長期一起完成事情的配合度（0～100）。" />
          <HudStat icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.5} />} label="Lv." value={String(rpgView.level)} hint="EXP：完成任務、家事、約會後累積，用來提升情侶等級（每 100 EXP 升一等）。" />
          <HudStat icon={<Coins className="h-3.5 w-3.5 text-amber-600" strokeWidth={2.5} />} label="今日獲得" value={`+${todayCoinEarned}`} hint="LoveCoin：完成互動後獲得，可在獎勵商城兌換卡券。此欄為今日累積的愛心幣。" />
        </div>

        <details className="mt-1.5 rounded-lg border border-stone-200/80 bg-stone-50/80 px-2 py-1.5 text-[11px] leading-snug text-stone-500">
          <summary className="cursor-pointer select-none font-semibold text-stone-500">數值說明</summary>
          <ul className="mt-1.5 list-disc space-y-1 pl-3.5">
            <li>愛心值：代表近期甜蜜程度。</li>
            <li>默契度：代表你們長期一起完成事情的配合度。</li>
            <li>EXP：完成任務、家事、約會後累積，用來提升情侶等級。</li>
            <li>LoveCoin：完成互動後獲得，可在獎勵商城兌換卡券。</li>
          </ul>
        </details>
        <p className="mt-1.5 truncate rounded-lg bg-stone-50 px-2 py-1 text-[12px] font-medium text-stone-600 ring-1 ring-stone-100">
          {todayLine}
        </p>
      </header>

      <NicknameSetupBanner compact />

      {showBindCard ? (
        <section className={`mb-2.5 flex items-center gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/90 px-3 py-2 ${lq.cardSoft}`}>
          <span className="text-xl" aria-hidden>
            💞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-amber-950">
              {auth.user && hasMembership ? '等待另一半加入' : '還沒綁定另一半'}
            </p>
            <p className="text-[12px] leading-snug text-amber-900/75">
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
            className={`shrink-0 ${lq.btnPrimary} !h-9 !min-h-9 !px-3 !text-[13px]`}
          >
            立即綁定
          </button>
        </section>
      ) : null}

      <ImportantDatesCard preview={importantPreview} togetherDays={togetherDays} onGoSettings={goCoupleProfile} />

      <DailyPartnerMessageCard />

      {activeAnniversaryReminders.length > 0 ? (
        <section className={`mb-2.5 px-3 py-2 ${lq.card}`}>
          <p className="mb-1.5 text-[12px] font-bold text-amber-800">🔔 紀念日提醒</p>
          <ul className="space-y-1">
            {activeAnniversaryReminders.slice(0, 2).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-[12px]">
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

      <h2 className={`mb-2 px-0.5 ${lq.sectionTitle}`}>重要功能</h2>
      <div className="space-y-2">
        <section
          className={`relative overflow-hidden rounded-2xl border border-stone-200/70 bg-gradient-to-br from-white via-rose-50/30 to-stone-50/80 p-3.5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.1)]`}
        >
          <span className="absolute -right-1 -top-1 text-4xl opacity-[0.08]" aria-hidden>
            🎲
          </span>
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">一起玩</p>
            <h3 className={`mt-0.5 text-[22px] font-bold leading-snug ${lq.text}`}>情侶小遊戲</h3>
            <p className={`mt-1 text-[14px] leading-snug ${lq.textSecondary}`}>
              骰子、真心話、默契問答，讓今天更有趣
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => navigateTo('miniGames')} className={lq.btnPrimary}>
                開始玩
              </button>
              <span className={lq.tag}>
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
            badge={houseworkHomeStatus.badge}
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
        <p className={`mt-2.5 text-center text-[12px] ${lq.textMuted}`}>
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
    <article className={`relative flex min-h-[9.5rem] flex-col p-2.5 transition active:scale-[0.99] ${lq.card}`}>
      {badge ? (
        <span className={`absolute right-2 top-2 max-w-[calc(100%-3.5rem)] truncate ${lq.tag}`}>{badge}</span>
      ) : null}
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-base ring-1 ring-stone-200/60"
        aria-hidden
      >
        {emoji}
      </span>
      <h3 className={`mt-1 pr-1 text-[15px] font-bold leading-snug ${lq.text}`}>{title}</h3>
      <p className={`mt-0.5 line-clamp-2 flex-1 text-[13px] leading-snug ${lq.textSecondary}`}>{description}</p>
      <button type="button" onClick={onAction} className={`mt-1.5 w-full ${lq.btnCompact}`}>
        {cta}
      </button>
    </article>
  );
}

function HudStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-col items-center rounded-xl border border-stone-200/60 bg-gradient-to-b from-white to-stone-50/90 px-1 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]"
      title={hint}
    >
      <div className="mb-0.5 flex items-center gap-0.5">{icon}</div>
      <p className={`truncate text-[15px] font-bold leading-none ${lq.text}`}>{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-medium text-stone-500">{label}</p>
    </div>
  );
}

const IMPORTANT_DATES_MAX_ROWS = 3;

function ImportantDatesCard({
  preview,
  togetherDays,
  onGoSettings,
}: {
  preview: ReturnType<typeof getUpcomingImportantDates>;
  togetherDays: TogetherDaysInfo;
  onGoSettings: () => void;
}) {
  const showTogether =
    togetherDays.kind === 'active' || togetherDays.kind === 'future' || togetherDays.kind === 'invalid';

  if (!preview.hasConfigured && !showTogether) {
    return (
      <section className={`mb-2 px-3 py-2 ${lq.cardSoft}`}>
        <p className={`text-[12px] leading-snug ${lq.textSecondary}`}>
          設定生日與紀念日，LoveQuest 會幫你記住重要日子。
        </p>
        <button type="button" onClick={onGoSettings} className={`mt-1.5 text-[12px] font-semibold ${lq.accent}`}>
          去設定 →
        </button>
      </section>
    );
  }

  const eventSlots = Math.max(0, IMPORTANT_DATES_MAX_ROWS - (showTogether ? 1 : 0));
  const visibleEvents = preview.items.slice(0, eventSlots);
  const hiddenCount = preview.totalCount - visibleEvents.length;
  const showViewAll = hiddenCount > 0;

  return (
    <section className={`mb-2 px-3 py-2 ${lq.card}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className={`text-[14px] font-bold ${lq.text}`}>重要日子</p>
        {showViewAll ? (
          <button type="button" onClick={onGoSettings} className={`shrink-0 text-[11px] font-semibold ${lq.accent}`}>
            查看全部
          </button>
        ) : null}
      </div>

      <ul className="divide-y divide-stone-100/90">
        {showTogether ? (
          <CompactDateRow
            icon="💕"
            title={
              togetherDays.kind === 'active'
                ? '在一起'
                : togetherDays.kind === 'future'
                  ? '在一起紀念日'
                  : '在一起'
            }
            suffix={
              togetherDays.kind === 'active'
                ? `第 ${togetherDays.days} 天`
                : togetherDays.kind === 'future'
                  ? '尚未開始'
                  : '日期格式有誤'
            }
            highlight={togetherDays.kind === 'active'}
          />
        ) : null}

        {visibleEvents.map((it) => (
          <CompactDateRow
            key={it.id}
            icon={it.icon}
            title={it.displayTitle}
            suffix={it.isToday ? '就是今天！' : `還有 ${it.daysUntil} 天`}
            highlight={it.isToday}
          />
        ))}

        {preview.hasConfigured && preview.items.length === 0 && !showTogether ? (
          <li className={`py-2 text-[12px] ${lq.textSecondary}`}>請以 YYYY-MM-DD 填寫日期以顯示倒數</li>
        ) : null}
      </ul>
    </section>
  );
}

function CompactDateRow({
  icon,
  title,
  suffix,
  highlight,
}: {
  icon: string;
  title: string;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex min-h-[40px] items-center gap-2 py-1">
      <span className="w-6 shrink-0 text-center text-base leading-none" aria-hidden>
        {icon}
      </span>
      <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${highlight ? lq.accent : lq.text}`}>
        {title}
      </span>
      <span className={`shrink-0 text-[12px] font-medium ${lq.textSecondary}`}>{suffix}</span>
    </li>
  );
}
