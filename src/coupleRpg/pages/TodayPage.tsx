import { AppHeader } from '../components/AppHeader';
import { ChecklistSection } from '../components/ChecklistSection';
import { StatsCard } from '../components/StatsCard';
import { useToggleChecklist } from '../hooks/useToggleChecklist';
import { MOCK_DINNER, MOCK_HOUSEWORK, MOCK_LOVE_TASKS, MOCK_STATS } from '../mockData';

function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TodayPage() {
  const dinner = useToggleChecklist(MOCK_DINNER);
  const housework = useToggleChecklist(MOCK_HOUSEWORK);
  const love = useToggleChecklist(MOCK_LOVE_TASKS);

  return (
    <>
      <AppHeader dateLabel={todayLabel()} />
      <StatsCard stats={MOCK_STATS} />
      <ChecklistSection
        title="今日晚餐"
        description="一起完成的小目標，累積愛心值"
        items={dinner.items}
        onToggle={dinner.toggle}
      />
      <ChecklistSection
        title="今日家事"
        description="分工合作，默契度 UP"
        items={housework.items}
        onToggle={housework.toggle}
      />
      <ChecklistSection
        title="今日戀愛任務"
        description="小小儀式感，讓今天更甜"
        items={love.items}
        onToggle={love.toggle}
      />
    </>
  );
}
