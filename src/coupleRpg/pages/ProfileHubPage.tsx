import { useLayoutEffect, useState } from 'react';
import { HubShell } from '../components/HubShell';
import { ProfileStatsPanel } from '../components/ProfileStatsPanel';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { AiRecordsPage } from './AiRecordsPage';
import { SettingsPage } from './SettingsPage';

const TABS = [
  { id: 'status', label: '狀態', emoji: '💖' },
  { id: 'aiRecords', label: 'AI 紀錄', emoji: '✨' },
  { id: 'settings', label: '設定', emoji: '⚙️' },
] as const;

type ProfileSection = (typeof TABS)[number]['id'];

export function ProfileHubPage() {
  const { profileSection } = useCoupleRpgNav();
  const [section, setSection] = useState<ProfileSection>('status');

  useLayoutEffect(() => {
    setSection(profileSection);
  }, [profileSection]);

  return (
    <HubShell
      emoji="❤️"
      title="我的"
      subtitle="情侶狀態 · 等級 · 設定"
      tabs={[...TABS]}
      active={section}
      onTabChange={(id) => setSection(id as ProfileSection)}
    >
      {section === 'status' && <ProfileStatsPanel />}
      {section === 'aiRecords' && <AiRecordsPage />}
      {section === 'settings' && <SettingsPage embedded />}
    </HubShell>
  );
}
