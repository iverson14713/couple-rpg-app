import { useState, type ReactNode } from 'react';
import { OfflineBanner } from '../components/OfflineBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { LoveQuestProvider } from './context/LoveQuestContext';
import { BottomNav, type CoupleTabId } from './components/BottomNav';
import { DinnerPage } from './pages/DinnerPage';
import { HouseworkPage } from './pages/HouseworkPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { RpgPage } from './pages/RpgPage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { DatesPage } from './pages/DatesPage';
import { TodayPage } from './pages/TodayPage';
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
          {tab === 'dinner' && <DinnerPage />}
          {tab === 'housework' && <HouseworkPage />}
          {tab === 'tasks' && <TasksPage />}
          {tab === 'dates' && <DatesPage />}
          {tab === 'rpg' && <RpgPage />}
          {tab === 'memories' && <MemoriesPage />}
          {tab === 'settings' && <SettingsPage />}
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
