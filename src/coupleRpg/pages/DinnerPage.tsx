import { ChecklistSection } from '../components/ChecklistSection';
import { useToggleChecklist } from '../hooks/useToggleChecklist';
import { MOCK_DINNER } from '../mockData';
import { lq } from '../theme';

export function DinnerPage() {
  const dinner = useToggleChecklist(MOCK_DINNER);

  return (
    <>
      <section className={`mb-4 p-4 ${lq.card}`}>
        <span className="text-3xl" aria-hidden>
          🍽️
        </span>
        <h1 className="mt-2 text-xl font-bold text-stone-900">晚餐計畫</h1>
        <p className="mt-1 text-sm text-stone-500">今晚想吃什麼？一起勾選完成吧（示範資料）</p>
      </section>
      <ChecklistSection title="今晚流程" items={dinner.items} onToggle={dinner.toggle} />
      <section className={`p-4 ${lq.cardSoft}`}>
        <p className="text-sm font-bold text-rose-800">💡 小提示</p>
        <p className="mt-1 text-[13px] leading-relaxed text-stone-600">
          完成晚餐任務可獲得愛心值 +2，並提升默契度。
        </p>
      </section>
    </>
  );
}
