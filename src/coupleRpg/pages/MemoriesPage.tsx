import { useLoveQuest } from '../context/LoveQuestContext';
import { PageHero } from '../components/ui';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { useProFeature } from '../hooks/useProFeature';
import { lq } from '../theme';

export function MemoriesPage({ embedded }: { embedded?: boolean } = {}) {
  const { dinnerHistory, completionHistory, dateHistory } = useLoveQuest();

  const taskRecords = completionHistory.filter((r) => r.kind === 'task');
  const gameRecords = completionHistory.filter((r) => r.kind === 'game');
  return (
    <>
      {!embedded ? (
        <PageHero emoji="📷" title="回憶與歷史" subtitle="晚餐、約會、任務與小遊戲的甜蜜紀錄" />
      ) : null}

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className={`mb-2 flex flex-wrap items-center gap-2 ${lq.sectionTitleSm}`}>
          回憶與歷史
          <ProBadgeIfNeeded show={historyPro.showProBadge} feature="history_unlimited" />
        </h2>
        <h3 className="mb-2 text-[14px] font-bold text-stone-800">晚餐回憶</h3>
        {dinnerHistory.length === 0 ? (
          <p className="text-[13px] text-stone-500">尚無晚餐紀錄</p>
        ) : (
          <HistoryList
            items={dinnerHistory.map((h) => ({
              id: h.id,
              emoji: '🍽️',
              title: h.label,
              meta: h.date,
            }))}
          />
        )}
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">約會紀錄（最近 7 筆）</h2>
        {dateHistory.length === 0 ? (
          <p className="text-[13px] text-stone-500">完成約會後會出現在這裡</p>
        ) : (
          <HistoryList
            items={dateHistory.map((h) => ({
              id: h.id,
              emoji: h.emoji,
              title: h.title,
              meta: `${h.date} ${h.time}`,
            }))}
          />
        )}
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">戀愛任務紀錄</h2>
        {taskRecords.length === 0 ? (
          <p className="text-[13px] text-stone-500">完成任務後會出現在這裡</p>
        ) : (
          <HistoryList
            items={taskRecords.map((r) => ({
              id: r.id,
              emoji: r.emoji,
              title: r.title,
              meta: `${r.date} ${r.time}`,
            }))}
          />
        )}
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">小遊戲紀錄</h2>
        {gameRecords.length === 0 ? (
          <p className="text-[13px] text-stone-500">完成曖昧小遊戲後會出現在這裡</p>
        ) : (
          <ul className="space-y-2">
            {gameRecords.map((r) => (
              <li key={r.id} className="rounded-xl border border-rose-50 bg-white/80 px-3 py-2.5 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-stone-900">
                    {r.emoji} {r.title}
                  </span>
                  <span className="shrink-0 text-stone-400">
                    {r.date} {r.time}
                  </span>
                </div>
                {r.detail ? <p className="mt-1 text-stone-600">{r.detail}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function HistoryList({
  items,
}: {
  items: { id: string; emoji: string; title: string; meta: string }[];
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3 py-2 text-[13px]"
        >
          <span className="font-semibold text-stone-800">
            {item.emoji} {item.title}
          </span>
          <span className="text-stone-400">{item.meta}</span>
        </li>
      ))}
    </ul>
  );
}
