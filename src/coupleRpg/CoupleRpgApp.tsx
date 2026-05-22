import type { ReactNode } from 'react';
import { OfflineBanner } from '../components/OfflineBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { BottomNav } from './components/BottomNav';
import { TabPageHeader } from './components/TabPageHeader';
import { OnboardingProvider } from './context/OnboardingContext';
import { CoupleRpgNavProvider, useCoupleRpgNav, type CoupleNavTabId } from './context/CoupleRpgNavContext';
import { CoupleSpaceProvider } from './context/CoupleSpaceContext';
import { LoveQuestProvider } from './context/LoveQuestContext';
import { AiToastProvider } from './context/AiToastContext';
import { UserPlanProvider } from './context/UserPlanContext';
import { DinnerPage } from './pages/DinnerPage';
import { HouseworkPage } from './pages/HouseworkPage';
import { ProfileHubPage } from './pages/ProfileHubPage';
import { RewardsPage } from './pages/RewardsPage';
import { TasksPage } from './pages/TasksPage';
import { DatesPage } from './pages/DatesPage';
import { MiniGamesPage } from './pages/MiniGamesPage';
import { ImportantDatesRemindersPage } from './pages/ImportantDatesRemindersPage';
import { UpgradeProPage } from './pages/UpgradeProPage';
import { UpgradeModal } from './components/UpgradeModal';
import { PlanToast } from './components/PlanToast';
import { TodayPage } from './pages/TodayPage';
import { lq } from './theme';

export default function CoupleRpgApp() {
  return (
    <OnboardingProvider>
      <CoupleSpaceProvider>
        <UserPlanProvider>
          <AiToastProvider>
            <LoveQuestProvider>
              <CoupleRpgNavProvider>
                <CoupleRpgShell />
              </CoupleRpgNavProvider>
            </LoveQuestProvider>
          </AiToastProvider>
        </UserPlanProvider>
      </CoupleSpaceProvider>
    </OnboardingProvider>
  );
}

function CoupleRpgShell() {
  const { tab, navigateTo } = useCoupleRpgNav();
  const isOnline = useOnlineStatus();
  const auth = useSupabaseAuth();

  const onNavChange = (next: CoupleNavTabId) => navigateTo(next);

  return (
    <AppRoot>
      {!isOnline ? <OfflineBanner message="目前離線，部分功能可能無法同步。" /> : null}
      {auth.configured && auth.authReady && auth.user ? <LoggedInStrip auth={auth} /> : null}
      <main key={tab} className="page-tab-fade">
        {tab === 'home' && <TodayPage />}
        {tab === 'dinner' && (
          <>
            <TabPageHeader emoji="🍽️" title="今晚吃什麼" subtitle="🎲 隨機抽籤 · 不再糾結" />
            <DinnerPage embedded />
          </>
        )}
        {tab === 'housework' && (
          <>
            <TabPageHeader emoji="🧹" title="家事誰來做" subtitle="多選家事 · 平均分配" />
            <HouseworkPage embedded />
          </>
        )}
        {tab === 'rewards' && (
          <>
            <TabPageHeader emoji="🎁" title="情侶獎勵" subtitle="錢包 · 商城 · 卡券" />
            <RewardsPage embedded />
          </>
        )}
        {tab === 'profile' && <ProfileHubPage />}
        {tab === 'tasks' && (
          <>
            <TabPageHeader emoji="💌" title="今日戀愛任務" subtitle="完成小任務，累積愛心幣" />
            <TasksPage embedded section="tasks" />
          </>
        )}
        {tab === 'dates' && (
          <>
            <TabPageHeader emoji="💑" title="約會去哪裡" subtitle="今天來一點不一樣的" />
            <DatesPage embedded />
          </>
        )}
        {tab === 'miniGames' && (
          <>
            <TabPageHeader emoji="🎲" title="情侶小遊戲" subtitle="骰子、真心話、默契問答，讓今天更有趣" />
            <MiniGamesPage />
          </>
        )}
        {tab === 'importantDates' && (
          <>
            <TabPageHeader emoji="🔔" title="重要日子提醒" subtitle="提醒設定 · AI 安排 · 禮物靈感" />
            <ImportantDatesRemindersPage />
          </>
        )}
        {tab === 'upgrade' && <UpgradeProPage />}
      </main>
      <BottomNav activeTab={tab} onChange={onNavChange} />
      <UpgradeModal />
      <PlanToast />
    </AppRoot>
  );
}

function AppRoot({ children }: { children: ReactNode }) {
  return (
    <div
      className={`min-h-screen px-4 py-6 ${lq.mainPadBottom} ${lq.text} ${lq.bg}`}
    >
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}

function LoggedInStrip({ auth }: { auth: ReturnType<typeof useSupabaseAuth> }) {
  if (!auth.user) return null;
  return (
    <div
      className={`mb-4 flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-[12px] shadow-sm ${lq.strip}`}
    >
      <span className="text-stone-700">
        <span className="font-bold text-stone-500">已登入</span>{' '}
        <span className="font-semibold text-rose-700">
          {auth.profile?.display_name?.trim() || auth.user.email}
        </span>
      </span>
    </div>
  );
}
