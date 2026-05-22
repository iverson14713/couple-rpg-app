import { useEffect } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { HomeCoupleOverviewCard } from '../components/HomeCoupleOverviewCard';
import { HomeImportantDateHeroCard } from '../components/HomeImportantDateHeroCard';
import { NicknameSetupBanner } from '../components/NicknameSetupBanner';
import { lq } from '../theme';

export function TodayPage() {
  const { navigateTo } = useCoupleRpgNav();
  const auth = useSupabaseAuth();
  const { showBindReminder, hasMembership } = useCoupleSpace();
  const {
    todayDinner,
    dinnerHomeStatus,
    houseworkHomeStatus,
    taskProgress,
    rpgView,
    datePlanner,
    syncCoupleProfile,
  } = useLoveQuest();

  useEffect(() => {
    void syncCoupleProfile();
  }, [syncCoupleProfile]);

  const showBindCard = showBindReminder;
  const dinnerBadge = todayDinner?.label ? '已決定' : '待決定';
  const dinnerDescription = todayDinner?.label
    ? `晚餐：${todayDinner.label}`
    : '不知道吃什麼就交給命運決定';
  const { done, total, pct } = taskProgress;

  return (
    <>
      <HomeImportantDateHeroCard />

      <HomeCoupleOverviewCard />

      <NicknameSetupBanner compact />

      {showBindCard ? (
        <section className="mb-3 flex items-center gap-2.5 rounded-2xl bg-amber-50/80 px-3.5 py-2.5 ring-1 ring-amber-200/50">
          <span className="text-xl" aria-hidden>
            💞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-amber-950">
              {auth.user && hasMembership ? '等待另一半加入' : '還沒綁定另一半'}
            </p>
            <p className="text-[12px] leading-snug text-amber-900/80">
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

      <h2 className={`mb-2.5 mt-1 px-0.5 ${lq.sectionTitle}`}>功能</h2>
      <div className="space-y-2.5">
        <section className={`relative overflow-hidden p-4 ${lq.cardElevated}`}>
          <span className="absolute -right-1 -top-1 text-4xl opacity-[0.06]" aria-hidden>
            🎲
          </span>
          <div className="relative">
            <p className={lq.label}>一起玩</p>
            <h3 className={`mt-0.5 text-[20px] font-extrabold leading-snug ${lq.text}`}>情侶小遊戲</h3>
            <p className={`mt-1 text-[13px] ${lq.textSecondary}`}>骰子 · 真心話 · 默契 · 情話 · 挑戰</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => navigateTo('miniGames')} className={lq.btnPrimary}>
                🎲 開始玩
              </button>
              <span className="rounded-full bg-stone-100/90 px-2.5 py-1 text-[11px] font-bold text-stone-600">
                今日獎勵 {rpgView.miniGamesRewardsToday}/{rpgView.miniGamesRewardCap}
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5">
          <HomeCoreFeatureCard
            emoji="🍽️"
            title="今晚吃什麼？"
            description={dinnerDescription}
            badge={dinnerBadge}
            cta="🍽️ 開始抽"
            onAction={() => navigateTo('dinner')}
          />
          <HomeCoreFeatureCard
            emoji="🏠"
            title="家事誰來做？"
            description="公平分配，不再吵架"
            badge={houseworkHomeStatus.badge}
            cta="🧹 分配"
            onAction={() => navigateTo('housework')}
          />
          <HomeCoreFeatureCard
            emoji="💌"
            title="今日戀愛任務"
            description="完成小任務，累積愛心幣"
            badge={total > 0 ? `${done}/${total}` : undefined}
            cta="💌 任務"
            onAction={() => navigateTo('tasks')}
          />
          <HomeCoreFeatureCard
            emoji="💑"
            title="約會去哪裡？"
            description="今天來一點不一樣的"
            badge={datePlanner.current ? '有提案' : undefined}
            cta="💑 約會"
            onAction={() => navigateTo('dates')}
          />
        </div>
      </div>

      {total > 0 && pct < 100 ? (
        <p className={`mt-3 text-center text-[12px] ${lq.textMuted}`}>
          今日任務 {pct}% · 完成可獲 LoveCoin
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
    <article className={`relative flex min-h-[9.5rem] flex-col p-3 transition active:scale-[0.99] ${lq.cardFeature}`}>
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
      <button type="button" onClick={onAction} className={`mt-2 w-full ${lq.btnCompact}`}>
        {cta}
      </button>
    </article>
  );
}
