import { ChecklistSection } from '../components/ChecklistSection';
import { useToggleChecklist } from '../hooks/useToggleChecklist';
import { MOCK_HOUSEWORK } from '../mockData';
import { lq } from '../theme';

export function HouseworkPage() {
  const housework = useToggleChecklist(MOCK_HOUSEWORK);

  return (
    <>
      <section className={`mb-4 p-4 ${lq.card}`}>
        <span className="text-3xl" aria-hidden>
          🏠
        </span>
        <h1 className="mt-2 text-xl font-bold text-stone-900">家事分工</h1>
        <p className="mt-1 text-sm text-stone-500">公平分工，生活更輕鬆（示範資料）</p>
      </section>
      <ChecklistSection title="今日家事清單" items={housework.items} onToggle={housework.toggle} />
    </>
  );
}
