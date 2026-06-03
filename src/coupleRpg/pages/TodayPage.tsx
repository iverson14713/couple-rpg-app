import { useEffect } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { HomeCoupleOverviewCard } from '../components/HomeCoupleOverviewCard';
import { HomeImportantDateHeroCard } from '../components/HomeImportantDateHeroCard';
import { HomeTodayGrowthCard } from '../components/HomeTodayGrowthCard';
import { TodayActivityFeed } from '../components/TodayActivityFeed';
import { NicknameSetupBanner } from '../components/NicknameSetupBanner';
import { HomeMiniGamesFeaturedCard } from '../components/HomeMiniGamesFeaturedCard';
import { lq } from '../theme';

export function TodayPage() {
  const { navigateTo } = useCoupleRpgNav();
  const auth = useSupabaseAuth();
  const { showBindReminder, hasMembership } = useCoupleSpace();
  const {
    todayDinner,
    houseworkHomeStatus,
    taskProgress,
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
  const { done, total } = taskProgress;

  return (
    <div className="space-y-2">
      <HomeImportantDateHeroCard />

      <HomeCoupleOverviewCard />

      <HomeTodayGrowthCard />

      <NicknameSetupBanner compact />

      {showBindCard ? (
        <section className="flex items-center gap-2.5 rounded-2xl bg-amber-50/80 px-3 py-2 ring-1 ring-amber-200/50">
          <span className="text-lg" aria-hidden>
            💞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-amber-950">
              {auth.user && hasMembership ? '等待另一半加入' : '還沒綁定另一半'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigateTo('profile', { profileSection: auth.user ? 'status' : 'settings' })
            }
            className={`shrink-0 ${lq.btnPrimary} !h-8 !min-h-8 !px-2.5 !text-[12px]`}
          >
            綁定
          </button>
        </section>
      ) : null}

      <h2 className={`mb-1.5 mt-0.5 px-0.5 ${lq.sectionTitle}`}>功能</h2>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
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
            description="完成 2 個小任務，延續愛情火苗"
            badge={total > 0 ? `${done}/${total}` : '0/2'}
            cta="💌 去完成"
            onAction={() => navigateTo('tasks')}
          />
          <HomeCoreFeatureCard
            emoji="💑"
            title="約會去哪？"
            description="今天來一點不一樣的"
            badge={datePlanner.current ? '有提案' : undefined}
            cta="💑 約會"
            onAction={() => navigateTo('dates')}
          />
        </div>

        <HomeMiniGamesFeaturedCard />
      </div>

      <TodayActivityFeed standalone />

      <p className={`pb-1 text-center text-[11px] ${lq.textMuted}`}>
        今日任務 {done}/{total || 2}・完成可獲 LoveCoin + EXP
      </p>
    </div>
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
      className={`relative flex min-h-[7.75rem] flex-col p-2.5 transition active:scale-[0.99] ${lq.cardFeature}`}
    >
      {badge ? (
        <span
          className={`absolute right-1.5 top-1.5 max-w-[calc(100%-3rem)] truncate px-1.5 py-0.5 text-[9px] font-bold ${lq.badge}`}
        >
          {badge}
        </span>
      ) : null}
      <span className="text-xl leading-none" aria-hidden>
        {emoji}
      </span>
      <h3 className={`mt-1 pr-1 text-[14px] font-bold leading-snug ${lq.text}`}>{title}</h3>
      <p className={`mt-0.5 line-clamp-2 flex-1 text-[12px] leading-snug ${lq.textSecondary}`}>
        {description}
      </p>
      <button type="button" onClick={onAction} className={`mt-1.5 w-full ${lq.btnCompact} !min-h-9 !text-[12px]`}>
        {cta}
      </button>
    </article>
  );
}
