import { useCallback, useMemo, useState } from 'react';
import { Check, Users } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { DEFAULT_HOUSEWORK_ITEMS, getTodayAssignment } from '../storage/houseworkStore';

const DEFAULT_HW_IDS = new Set(DEFAULT_HOUSEWORK_ITEMS.map((i) => i.id));
import { RpgMiniStats } from '../components/RpgMiniStats';
import { InlineInput, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

export function HouseworkPage({ embedded }: { embedded?: boolean } = {}) {
  const game = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');
  const [confirmReassign, setConfirmReassign] = useState(false);

  const todayAssignment = useMemo(
    () => getTodayAssignment(game.housework),
    [game.housework]
  );

  const isAssigned = Boolean(todayAssignment?.assignedAt && todayAssignment.chores.length > 0);
  const selectedIds = todayAssignment?.selectedTaskIds ?? [];

  const meName = game.coupleExtended.myNickname.trim() || '我';
  const partnerName = game.coupleExtended.partnerNickname.trim() || '另一半';

  const toggleSelect = useCallback(
    (id: string) => {
      const set = new Set(selectedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      game.setHouseworkSelectedTaskIds([...set]);
    },
    [selectedIds, game]
  );

  const choresByPerson = useMemo(() => {
    const chores = todayAssignment?.chores ?? [];
    return {
      A: chores.filter((c) => c.assignee === 'A'),
      B: chores.filter((c) => c.assignee === 'B'),
    };
  }, [todayAssignment]);

  const doneCount = todayAssignment?.chores.filter((c) => c.completed).length ?? 0;
  const totalCount = todayAssignment?.chores.length ?? 0;
  const hasCompleted = doneCount > 0;

  const handleReassign = useCallback(() => {
    if (hasCompleted && !confirmReassign) {
      setConfirmReassign(true);
      return;
    }
    game.reassignTodayHousework();
    setConfirmReassign(false);
  }, [hasCompleted, confirmReassign, game]);

  return (
    <>
      {!embedded ? (
        <>
          <PageHero emoji="🏠" title="家事分配" subtitle="選今天要做的家事，LoveQuest 會幫你們平均分配" />
          <RpgMiniStats compact />
        </>
      ) : null}

      <p className={`mb-2.5 px-0.5 text-[13px] leading-snug ${lq.textSecondary}`}>
        選今天要做的家事，系統會依數量平均分配給兩人。完成每一項可獲默契 +3、EXP +10、LoveCoin +3。
      </p>

      {!isAssigned ? (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <h2 className={`mb-2 text-sm font-bold ${lq.text}`}>Step 1 · 選今天要做的家事</h2>
          <div className="flex flex-wrap gap-2">
            {game.housework.items.map((item) => {
              const on = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-[14px] font-semibold transition active:scale-[0.98] ${
                    on
                      ? 'border-rose-300 bg-rose-50 text-rose-800 ring-1 ring-rose-200'
                      : 'border-stone-200 bg-white text-stone-700'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      on ? 'border-rose-400 bg-rose-500 text-white' : 'border-stone-300 bg-white'
                    }`}
                  >
                    {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </span>
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <p className={`mt-2 text-[12px] ${lq.textMuted}`}>
            已選 {selectedIds.length} 項{selectedIds.length > 0 ? '' : '，請至少選一項'}
          </p>

          <PrimaryButton
            className="mt-3"
            disabled={selectedIds.length === 0}
            onClick={() => game.startHouseworkAssignment()}
          >
            開始分配
          </PrimaryButton>
        </section>
      ) : (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className={`text-sm font-bold ${lq.text}`}>今日分配結果</h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${lq.tag}`}>
              {doneCount}/{totalCount}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AssigneeColumn
              title={meName}
              chores={choresByPerson.A}
              items={game.housework.items}
              onComplete={(id) => game.completeHouseworkChore(id)}
            />
            <AssigneeColumn
              title={partnerName}
              chores={choresByPerson.B}
              items={game.housework.items}
              onComplete={(id) => game.completeHouseworkChore(id)}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReassign}
              className={`flex-1 rounded-[14px] border border-stone-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-700 active:scale-[0.98]`}
            >
              重新分配
            </button>
            <button
              type="button"
              onClick={() => {
                if (hasCompleted && !window.confirm('清除今日分配可能會遺失完成狀態，確定嗎？')) return;
                game.clearTodayHousework();
                setConfirmReassign(false);
              }}
              className={`flex-1 rounded-[14px] border border-stone-200 bg-stone-50 px-3 py-2.5 text-[13px] font-semibold text-stone-600 active:scale-[0.98]`}
            >
              清除今日分配
            </button>
          </div>

          {confirmReassign ? (
            <div className={`mt-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-[12px] text-amber-950`}>
              <p>重新分配可能會清除今日完成狀態，確定嗎？</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={handleReassign} className="font-bold text-amber-800 underline">
                  確定重新分配
                </button>
                <button type="button" onClick={() => setConfirmReassign(false)} className="text-stone-600">
                  取消
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              game.clearTodayHousework();
              setConfirmReassign(false);
            }}
            className={`mt-2 w-full text-center text-[12px] font-semibold ${lq.accent}`}
          >
            改選其他家事 →
          </button>
        </section>
      )}

      <section className={`mb-3 p-3 ${lq.card}`}>
        <h2 className={`mb-2 text-sm font-bold ${lq.text}`}>管理家事項目</h2>
        <InlineInput
          value={newLabel}
          onChange={setNewLabel}
          placeholder="新增自訂家事…"
          onSubmit={() => {
            game.addHouseworkItem(newLabel);
            setNewLabel('');
          }}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {game.housework.items.map((item) => (
            <span key={item.id} className={`inline-flex items-center gap-1 ${lq.tag}`}>
              <span>{item.emoji}</span>
              {item.label}
              {!DEFAULT_HW_IDS.has(item.id) ? (
                <button
                  type="button"
                  onClick={() => game.removeHouseworkItem(item.id)}
                  className="text-stone-400 hover:text-rose-600"
                  aria-label={`刪除 ${item.label}`}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </section>

      <WeeklyStatsSection />
    </>
  );
}

function AssigneeColumn({
  title,
  chores,
  items,
  onComplete,
}: {
  title: string;
  chores: { taskId: string; assignee: 'A' | 'B'; completed: boolean; rewarded: boolean }[];
  items: { id: string; label: string; emoji: string }[];
  onComplete: (taskId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200/70 bg-gradient-to-b from-white to-stone-50/80 p-2.5">
      <p className={`mb-2 flex items-center gap-1 text-[13px] font-bold ${lq.text}`}>
        <Users className="h-3.5 w-3.5 text-rose-400" aria-hidden />
        {title} 負責
      </p>
      {chores.length === 0 ? (
        <p className={`py-2 text-center text-[12px] ${lq.textMuted}`}>今日無分配</p>
      ) : (
        <ul className="space-y-1.5">
          {chores.map((c) => {
            const item = items.find((i) => i.id === c.taskId);
            if (!item) return null;
            return (
              <li key={c.taskId}>
                <button
                  type="button"
                  onClick={() => !c.completed && onComplete(c.taskId)}
                  disabled={c.completed}
                  className={`flex w-full min-h-[40px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                    c.completed
                      ? 'border-emerald-200 bg-emerald-50/80 opacity-90'
                      : 'border-stone-200 bg-white active:scale-[0.99]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      c.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300'
                    }`}
                  >
                    {c.completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                  </span>
                  <span className="text-base">{item.emoji}</span>
                  <span className={`flex-1 text-[14px] font-semibold ${c.completed ? 'text-stone-500 line-through' : lq.text}`}>
                    {item.label}
                  </span>
                  <span className={`text-[11px] ${c.completed ? 'text-emerald-600' : lq.textMuted}`}>
                    {c.completed ? '完成' : '點擊完成'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function WeeklyStatsSection() {
  const { weeklyStats, couple } = useLoveQuest();

  return (
    <section className={`p-3 ${lq.card}`}>
      <h2 className={`mb-1 text-sm font-bold ${lq.text}`}>本週家事統計</h2>
      <p className={`mb-2 text-[11px] ${lq.textMuted}`}>{weeklyStats.weekKey}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={`rounded-lg py-2 ${lq.cardSoft}`}>
          <p className="text-[10px] text-stone-500">完成</p>
          <p className={`text-lg font-bold ${lq.text}`}>{weeklyStats.total}</p>
        </div>
        <div className={`rounded-lg py-2 ${lq.cardSoft}`}>
          <p className="text-[10px] text-stone-500 truncate">{couple.nameA}</p>
          <p className={`text-lg font-bold ${lq.text}`}>{weeklyStats.byPartner.A}</p>
        </div>
        <div className={`rounded-lg py-2 ${lq.cardSoft}`}>
          <p className="text-[10px] text-stone-500 truncate">{couple.nameB}</p>
          <p className={`text-lg font-bold ${lq.text}`}>{weeklyStats.byPartner.B}</p>
        </div>
      </div>
    </section>
  );
}
