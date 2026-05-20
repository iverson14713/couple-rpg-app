import { ChecklistSection } from '../components/ChecklistSection';
import { useToggleChecklist } from '../hooks/useToggleChecklist';
import { MOCK_LOVE_TASKS, MOCK_QUESTS } from '../mockData';
import { lq } from '../theme';

export function TasksPage() {
  const love = useToggleChecklist(MOCK_LOVE_TASKS);
  const quests = useToggleChecklist(MOCK_QUESTS);

  return (
    <>
      <section className={`mb-4 p-4 ${lq.card}`}>
        <span className="text-3xl" aria-hidden>
          🎯
        </span>
        <h1 className="mt-2 text-xl font-bold text-stone-900">任務中心</h1>
        <p className="mt-1 text-sm text-stone-500">戀愛任務與每日挑戰（示範資料）</p>
      </section>
      <ChecklistSection title="戀愛任務" description="甜蜜互動" items={love.items} onToggle={love.toggle} />
      <ChecklistSection title="每日挑戰" description="完成可解鎖獎勵" items={quests.items} onToggle={quests.toggle} />
    </>
  );
}
