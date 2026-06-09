import { useEffect } from 'react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { HomeHeroLoveCard } from '../components/HomeHeroLoveCard';
import { HomeImportantDateHeroCard } from '../components/HomeImportantDateHeroCard';
import {
  HomeRecommendationsCarousel,
  useHomeRecommendationItems,
} from '../components/HomeRecommendationsCarousel';
import { TodayActivityFeed } from '../components/TodayActivityFeed';
import { NicknameSetupBanner } from '../components/NicknameSetupBanner';
import { HomeMiniGamesFeaturedCard } from '../components/HomeMiniGamesFeaturedCard';
import { HomeCompanionshipReceivedCard } from '../components/HomeCompanionshipReceivedCard';
import { HomeCompanionshipEntryCard } from '../components/HomeCompanionshipEntryCard';
import { lq } from '../theme';

export function TodayPage() {
  const { navigateTo } = useCoupleRpgNav();
  const auth = useSupabaseAuth();
  const { showBindReminder, hasMembership } = useCoupleSpace();
  const { syncCoupleProfile } = useLoveQuest();
  const recommendations = useHomeRecommendationItems();

  useEffect(() => {
    void syncCoupleProfile();
  }, [syncCoupleProfile]);

  const showBindCard = showBindReminder;

  return (
    <div className="space-y-3.5 pb-1">
      <HomeHeroLoveCard />

      <HomeCompanionshipReceivedCard />

      <HomeImportantDateHeroCard />

      <NicknameSetupBanner compact />

      {showBindCard ? (
        <section className="lq-home-section-in flex items-center gap-3 rounded-2xl bg-amber-50/90 px-3.5 py-3 ring-1 ring-amber-200/55">
          <span className="text-xl" aria-hidden>
            💞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-amber-950">
              {auth.user && hasMembership ? '等待另一半加入' : '還沒綁定另一半'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigateTo('profile', { profileSection: auth.user ? 'status' : 'settings' })
            }
            className={`shrink-0 ${lq.btnPrimary} !min-h-10 !px-3 !text-[14px]`}
          >
            綁定
          </button>
        </section>
      ) : null}

      <HomeRecommendationsCarousel items={recommendations} />

      <HomeCompanionshipEntryCard />

      <HomeMiniGamesFeaturedCard />

      <TodayActivityFeed standalone homeCompact />
    </div>
  );
}
