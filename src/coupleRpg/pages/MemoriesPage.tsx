import { MOCK_HISTORY, MOCK_MEMORIES } from '../mockData';
import { lq } from '../theme';

export function MemoriesPage() {
  return (
    <>
      <section className={`mb-4 p-4 ${lq.card}`}>
        <span className="text-3xl" aria-hidden>
          📷
        </span>
        <h1 className="mt-2 text-xl font-bold text-stone-900">回憶與歷史</h1>
        <p className="mt-1 text-sm text-stone-500">珍藏時光與活動紀錄（示範資料）</p>
      </section>

      <section className={`mb-4 p-4 ${lq.card}`}>
        <h2 className="mb-3 text-base font-bold text-stone-900">甜蜜回憶</h2>
        <ul className="space-y-3">
          {MOCK_MEMORIES.map((m) => (
            <li key={m.id} className={`rounded-2xl p-3 ${lq.cardSoft}`}>
              <MemoryRow entry={m} />
            </li>
          ))}
        </ul>
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-3 text-base font-bold text-stone-900">歷史紀錄</h2>
        <ul className="space-y-2">
          {MOCK_HISTORY.map((h) => (
            <li key={h.id} className="rounded-xl border border-rose-50 bg-white/80 px-3 py-2.5 text-[13px]">
              <span className="font-semibold text-stone-900">{h.actor}</span>
              <span className="text-stone-400">
                {' '}
                · {h.date} {h.time}
              </span>
              <p className="mt-0.5 text-stone-600">{h.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function MemoryRow({ entry }: { entry: (typeof MOCK_MEMORIES)[number] }) {
  return (
    <div className="flex gap-3">
      <span className="text-2xl">{entry.emoji}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-stone-400">{entry.date}</p>
        <p className="font-bold text-stone-900">{entry.title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-stone-600">{entry.note}</p>
      </div>
    </div>
  );
}
