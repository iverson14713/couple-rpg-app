import { useLoveQuest } from '../context/LoveQuestContext';
import { PageHero } from '../components/ui';
import { lq } from '../theme';

export function MemoriesPage() {
  const { activity, dinnerHistory } = useLoveQuest();

  return (
    <>
      <PageHero emoji="📷" title="回憶與歷史" subtitle="晚餐紀錄與你們的成長足跡" />

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">晚餐回憶</h2>
        {dinnerHistory.length === 0 ? (
          <p className="text-[13px] text-stone-500">尚無晚餐紀錄</p>
        ) : (
          <ul className="space-y-1.5">
            {dinnerHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3 py-2 text-[13px]"
              >
                <span className="font-semibold text-stone-800">🍽️ {h.label}</span>
                <span className="text-stone-400">{h.date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">活動歷史</h2>
        {activity.length === 0 ? (
          <p className="text-[13px] text-stone-500">完成家事、任務或儲存晚餐後會出現在這裡</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((h) => (
              <li key={h.id} className="rounded-xl border border-rose-50 bg-white/80 px-3 py-2.5 text-[13px]">
                <span className="font-semibold text-stone-900">{h.date}</span>
                <span className="text-stone-400"> · {h.time}</span>
                <p className="mt-0.5 text-stone-600">{h.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
