import { useState } from 'react';
import { HubShell } from '../components/HubShell';
import { TasksPage } from './TasksPage';
import { RewardsPage } from './RewardsPage';

const TABS = [
  { id: 'tasks', label: '任務', emoji: '💌' },
  { id: 'games', label: '遊戲', emoji: '🎲' },
  { id: 'rewards', label: '獎勵', emoji: '🎁' },
] as const;

type PlaySection = (typeof TABS)[number]['id'];

export function PlayHubPage() {
  const [section, setSection] = useState<PlaySection>('tasks');

  return (
    <HubShell
      emoji="🎲"
      title="互動"
      subtitle="戀愛任務 · 曖昧小遊戲 · 情侶獎勵"
      tabs={[...TABS]}
      active={section}
      onTabChange={(id) => setSection(id as PlaySection)}
    >
      {section === 'tasks' && <TasksPage embedded section="tasks" />}
      {section === 'games' && <TasksPage embedded section="games" />}
      {section === 'rewards' && <RewardsPage embedded />}
    </HubShell>
  );
}
