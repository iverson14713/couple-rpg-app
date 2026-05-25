import { HomeCoupleOverviewCard } from '../../../coupleRpg/components/HomeCoupleOverviewCard';
import { HomeImportantDateHeroCard } from '../../../coupleRpg/components/HomeImportantDateHeroCard';
import { DateItineraryAiResult } from '../../../coupleRpg/components/DateItineraryAiResult';
import { ImportantDateRemindersSection } from '../../../coupleRpg/components/ImportantDateRemindersSection';
import { ProfileStatsPanel } from '../../../coupleRpg/components/ProfileStatsPanel';
import { MiniGamePlayCard } from '../../../coupleRpg/components/MiniGamePlayCard';
import { TabPageHeader } from '../../../coupleRpg/components/TabPageHeader';
import { COUPLE_GAME_MODES } from '../../../coupleRpg/data/coupleGamePrompts';
import { useLoveQuest } from '../../../coupleRpg/context/LoveQuestContext';
import { lq } from '../../../coupleRpg/theme';
import { ShowcaseMockShell } from '../components/ShowcaseMockShell';
import { ShowcaseScrollClip } from '../components/ShowcaseScrollClip';
import { ShowcaseProviders } from '../ShowcaseProviders';
import { SHOWCASE_DATE_PLAN } from '../showcaseDemoData';

/** 首頁「功能」區塊（與 TodayPage 相同卡片結構，展示用不可點） */
function ShowcaseHomeFeatureGrid() {
  const { todayDinner, houseworkHomeStatus, taskProgress, datePlanner, rpgView } = useLoveQuest();

  const dinnerDescription = todayDinner?.label
    ? `晚餐：${todayDinner.label}`
    : '不知道吃什麼就交給命運決定';
  const { done, total } = taskProgress;

  return (
    <>
      <h2 className={`mb-2.5 mt-1 px-0.5 ${lq.sectionTitle}`}>功能</h2>
      <div className="space-y-2.5">
        <section className={`relative overflow-hidden p-4 ${lq.cardElevated}`}>
          <p className={lq.label}>一起玩</p>
          <h3 className={`mt-0.5 text-[20px] font-extrabold leading-snug ${lq.text}`}>情侶小遊戲</h3>
          <p className={`mt-1 text-[13px] ${lq.textSecondary}`}>骰子 · 真心話 · 默契 · 情話</p>
          <div className="mt-3">
            <span className={`inline-flex ${lq.btnPrimary} pointer-events-none opacity-95`}>🎲 開始玩</span>
            <span className="ml-2 rounded-full bg-stone-100/90 px-2.5 py-1 text-[11px] font-bold text-stone-600">
              今日獎勵 {rpgView.miniGamesRewardsToday}/{rpgView.miniGamesRewardCap}
            </span>
          </div>
        </section>
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureCard
            emoji="🍽️"
            title="今晚吃什麼？"
            description={dinnerDescription}
            badge={todayDinner?.label ? '已決定' : '待決定'}
            cta="🍽️ 開始抽"
          />
          <FeatureCard
            emoji="🏠"
            title="家事誰來做？"
            description="公平分配，不再吵架"
            badge={houseworkHomeStatus.badge}
            cta="🧹 分配"
          />
          <FeatureCard
            emoji="💌"
            title="今日戀愛任務"
            description="完成小任務，累積愛心幣"
            badge={total > 0 ? `${done}/${total}` : undefined}
            cta="💌 任務"
          />
          <FeatureCard
            emoji="💑"
            title="約會去哪裡？"
            description="今天來一點不一樣的"
            badge={datePlanner.current ? '有提案' : undefined}
            cta="💑 約會"
          />
        </div>
      </div>
    </>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
  badge,
  cta,
}: {
  emoji: string;
  title: string;
  description: string;
  badge?: string;
  cta: string;
}) {
  return (
    <article className={`relative flex min-h-[9.5rem] flex-col p-3 ${lq.cardFeature}`}>
      {badge ? (
        <span className={`absolute right-2 top-2 max-w-[calc(100%-3.5rem)] truncate px-2 py-0.5 text-[10px] font-bold ${lq.badge}`}>
          {badge}
        </span>
      ) : null}
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <h3 className={`mt-1 pr-1 text-[15px] font-bold leading-snug ${lq.text}`}>{title}</h3>
      <p className={`mt-0.5 line-clamp-2 flex-1 text-[13px] leading-snug ${lq.textSecondary}`}>{description}</p>
      <span className={`mt-2 w-full text-center ${lq.btnCompact} pointer-events-none`}>{cta}</span>
    </article>
  );
}

/** 1. 首頁：HomeImportantDateHeroCard + HomeCoupleOverviewCard + 功能網格 */
export function ShowcaseSyncScreen() {
  return (
    <ShowcaseProviders>
      <ShowcaseMockShell>
        <ShowcaseScrollClip>
          <HomeImportantDateHeroCard />
          <HomeCoupleOverviewCard />
          <ShowcaseHomeFeatureGrid />
        </ShowcaseScrollClip>
      </ShowcaseMockShell>
    </ShowcaseProviders>
  );
}

/** 2. 約會 AI：Dates 頁 AI 結果元件（DateItineraryAiResult） */
export function ShowcaseAiDateScreen() {
  return (
    <ShowcaseProviders>
      <ShowcaseMockShell>
        <ShowcaseScrollClip>
          <TabPageHeader emoji="💑" title="約會去哪" subtitle="AI 行程 · 篩選點子" />
          <section className={`mb-2 p-3 ${lq.card}`}>
            <p className={`text-[12px] font-bold ${lq.textSecondary}`}>✨ AI 約會規劃結果</p>
            <DateItineraryAiResult plan={SHOWCASE_DATE_PLAN} showcase />
          </section>
        </ShowcaseScrollClip>
      </ShowcaseMockShell>
    </ShowcaseProviders>
  );
}

/** 3. 重要日子：ImportantDateRemindersSection（與 App 提醒頁相同） */
export function ShowcaseRemindersScreen() {
  return (
    <ShowcaseProviders>
      <ShowcaseMockShell>
        <ShowcaseScrollClip>
          <ImportantDateRemindersSection showBack={false} />
        </ShowcaseScrollClip>
      </ShowcaseMockShell>
    </ShowcaseProviders>
  );
}

/** 4. 我的狀態：ProfileStatsPanel（與「我的」狀態分頁相同） */
export function ShowcaseRpgScreen() {
  return (
    <ShowcaseProviders>
      <ShowcaseMockShell>
        <ShowcaseScrollClip>
          <div className="mb-2 px-0.5">
            <p className={lq.label}>我的</p>
            <h2 className={lq.pageTitle}>情侶狀態</h2>
            <p className={`text-[12px] ${lq.textSecondary}`}>等級 · LoveCoin · 默契</p>
          </div>
          <ProfileStatsPanel hideAccountChrome />
        </ShowcaseScrollClip>
      </ShowcaseMockShell>
    </ShowcaseProviders>
  );
}

/** 5. 小遊戲：MiniGamePlayCard + 真實模式選擇 UI */
export function ShowcaseGamesScreen() {
  return (
    <ShowcaseProviders>
      <ShowcaseMockShell>
        <ShowcaseScrollClip>
          <ShowcaseMiniGamesContent />
        </ShowcaseScrollClip>
      </ShowcaseMockShell>
    </ShowcaseProviders>
  );
}

function ShowcaseMiniGamesContent() {
  const { rpgView } = useLoveQuest();
  const selectedId = 'coupleDice' as const;
  const modeDef = COUPLE_GAME_MODES.find((m) => m.id === selectedId)!;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`mb-2 flex shrink-0 items-start justify-between gap-2 px-2.5 py-2 ${lq.card}`}>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-stone-800">🎲 情侶小遊戲</p>
          <p className="mt-0.5 text-[11px] font-extrabold text-rose-700">
            今日獎勵 {rpgView.miniGamesRewardsToday}/{rpgView.miniGamesRewardCap}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-100/90 px-2 py-0.5 text-[10px] font-bold text-violet-800">
          7 種玩法
        </span>
      </div>

      <p className="mb-1 shrink-0 px-0.5 text-[10px] font-semibold tracking-wide text-stone-400">模式選擇</p>
      <div className="mb-2 grid shrink-0 grid-cols-2 gap-1.5">
        {COUPLE_GAME_MODES.map((m) => {
          const selected = m.id === selectedId;
          return (
            <span
              key={m.id}
              className={`relative flex min-h-[3.35rem] items-center gap-2 rounded-xl border px-2 py-1.5 ${
                selected ? lq.hubChipActive : lq.hubChipIdle
              }`}
            >
              {m.proOnly ? (
                <span className="absolute right-1 top-1 rounded bg-violet-100/90 px-1 py-px text-[7px] font-bold leading-none text-violet-700">
                  Pro
                </span>
              ) : null}
              <span className="shrink-0 text-[26px] leading-none" aria-hidden>
                {m.emoji}
              </span>
              <span className="min-w-0 flex-1 pr-4">
                <span
                  className={`block truncate font-extrabold leading-tight text-stone-900 ${
                    selected ? 'text-[15px]' : 'text-[14px]'
                  }`}
                >
                  {m.title}
                </span>
                <span className="mt-px block truncate text-[9px] font-medium text-stone-500">
                  {m.description}
                </span>
              </span>
            </span>
          );
        })}
      </div>

      <section className={`min-h-0 flex-1 p-3 ${lq.cardElevated}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className={`text-[14px] font-extrabold ${lq.text}`}>
            <span className="mr-1">{modeDef.emoji}</span>
            {modeDef.title}
          </h2>
          <span className="text-[9px] font-semibold text-stone-400">題庫 120+ 題</span>
        </div>
        <MiniGamePlayCard
          phase="revealed"
          displayEmoji={modeDef.emoji}
          displayTitle="擲骰結果"
          displaySubtitle="今晚的小驚喜"
          displayContent="一起完成一件讓彼此微笑的小事吧～"
          showSparkles
        />
      </section>
    </div>
  );
}
