import { useState, type ReactNode } from 'react';
import { OfflineBanner } from '../components/OfflineBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { LoveQuestProvider } from './context/LoveQuestContext';
import { BottomNav, type CoupleTabId } from './components/BottomNav';
import { TodayPage } from './pages/TodayPage';
import { LifeHubPage } from './pages/LifeHubPage';
import { PlayHubPage } from './pages/PlayHubPage';
import { MemoriesHubPage } from './pages/MemoriesHubPage';
import { ProfileHubPage } from './pages/ProfileHubPage';
import { lq } from './theme';

export default function CoupleRpgApp() {
  const [tab, setTab] = useState<CoupleTabId>('today');
  const isOnline = useOnlineStatus();
  const auth = useSupabaseAuth();

  return (
    <LoveQuestProvider>
      <AppRoot>
        {!isOnline ? <OfflineBanner message="目前離線，部分功能可能無法同步。" /> : null}
        {auth.configured && auth.authReady && auth.user ? <LoggedInStrip auth={auth} /> : null}
        <main key={tab} className="page-tab-fade">
          {tab === 'today' && <TodayPage />}
          {tab === 'life' && <LifeHubPage />}
          {tab === 'play' && <PlayHubPage />}
          {tab === 'memories' && <MemoriesHubPage />}
          {tab === 'profile' && <ProfileHubPage />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </AppRoot>
    </LoveQuestProvider>
  );
}

function AppRoot({ children }: { children: ReactNode }) {
  return (
    <div className={`min-h-screen px-4 py-6 pb-28 text-stone-800 ${lq.bg}`}>
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
