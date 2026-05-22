import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import {
  FREE_DAILY_CHORE_REWARD_LIMIT,
  HOUSEWORK_CHORE_REWARD_GRANTED_HINT,
  PRO_DAILY_CHORE_REWARD_LIMIT,
} from '../constants/choreRewardLimits';
import { todayKey } from '../lib/dates';
import { useUserPlan } from '../context/UserPlanContext';
import {
  getDailyChoreRewardCount,
  getDailyChoreRewardLimit,
  hasChoreRewardClaim,
  isDailyChoreRewardLimitReached,
} from '../storage/choreRewardClaimsStore';
import { DEFAULT_HOUSEWORK_ITEMS, getTodayAssignment } from '../storage/houseworkStore';
import { EmptyState } from '../components/EmptyState';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { InlineInput, PageHero, PrimaryButton } from '../components/ui';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { useProFeature } from '../hooks/useProFeature';
import { lq } from '../theme';

const DEFAULT_HW_IDS = new Set(DEFAULT_HOUSEWORK_ITEMS.map((i) => i.id));

export function HouseworkPage({ embedded }: { embedded?: boolean } = {}) {
  const game = useLoveQuest();
  const { isPro } = useUserPlan();
  const { pullHouseworkFromCloud } = game;
  const [newLabel, setNewLabel] = useState('');
  const [confirmReassign, setConfirmReassign] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const [rewardHint, setRewardHint] = useState<string | null>(null);
  const [claimsTick, setClaimsTick] = useState(0);

  const today = todayKey();
  const dailyRewardCount = useMemo(() => {
    void claimsTick;
    return getDailyChoreRewardCount(today);
  }, [today, claimsTick]);
  const dailyRewardLimit = getDailyChoreRewardLimit(isPro);
  const dailyRewardDisplayCount = Math.min(dailyRewardCount, dailyRewardLimit);
  const dailyLimitReached = useMemo(() => {
    void claimsTick;
    return isDailyChoreRewardLimitReached(today, isPro);
  }, [today, isPro, claimsTick]);

  useEffect(() => {
    void pullHouseworkFromCloud();
  }, [pullHouseworkFromCloud]);

  const todayAssignment = useMemo(
    () => getTodayAssignment(game.housework),
    [game.housework]
  );

  const hasAssignment = Boolean(
    todayAssignment?.assignedAt &&
      (todayAssignment.chores.length > 0 || (todayAssignment.selectedTaskIds?.length ?? 0) > 0)
  );

  const [stickAssignedView, setStickAssignedView] = useState(false);
  useEffect(() => {
    if (hasAssignment) setStickAssignedView(true);
    if (!todayAssignment?.assignedAt) setStickAssignedView(false);
  }, [hasAssignment, todayAssignment?.assignedAt]);

  const isAssigned = hasAssignment || (stickAssignedView && Boolean(todayAssignment?.assignedAt));
  const selectedIds = todayAssignment?.selectedTaskIds ?? [];

  const meName = game.displayNames.me;
  const partnerName = game.displayNames.partner;

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

  const handleCompleteChore = useCallback(
    (taskId: string) => {
      if (completingIds.has(taskId)) return;
      setCompletingIds((prev) => new Set(prev).add(taskId));
      setRewardHint(null);
      try {
        const result = game.completeHouseworkChore(taskId);
        setClaimsTick((t) => t + 1);
        if (result.granted) {
          setRewardHint(HOUSEWORK_CHORE_REWARD_GRANTED_HINT);
        } else if (result.rewardAlreadyClaimed) {
          setRewardHint('已完成，今天這項家事已領過獎勵');
        } else if (result.dailyLimitReached) {
          setRewardHint('已完成，今日家事獎勵已達上限');
        }
      } finally {
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [completingIds, game]
  );

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
          <PageHero emoji="🧹" title="家事誰來做" subtitle="多選家事・平均分配" />
          <RpgMiniStats compact />
        </>
      ) : null}

      <HouseworkPageIntro
        rewardDisplayCount={dailyRewardDisplayCount}
        rewardLimit={dailyRewardLimit}
        limitReached={dailyLimitReached}
      />

      {!isAssigned ? (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <h2 className={`mb-2 flex items-center gap-1.5 text-sm font-bold ${lq.text}`}>
            <span aria-hidden>🧺</span> Step 1 · 選今天要做的家事
          </h2>
          {game.housework.items.length === 0 ? (
            <EmptyState compact emoji="🧹" title="還沒有家事項目" hint="使用下方新增，或稍後載入預設項目" className="mb-2" />
          ) : null}
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
            🧹 開始分配
          </PrimaryButton>
        </section>
      ) : (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className={`flex items-center gap-1.5 text-sm font-bold ${lq.text}`}>
              <span aria-hidden>📋</span> 今日分配結果
            </h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${lq.tag}`}>
              {doneCount}/{totalCount}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AssigneeColumn
              title={meName}
              chores={choresByPerson.A}
              items={game.housework.items}
              today={today}
              completingIds={completingIds}
              dailyLimitReached={dailyLimitReached}
              onComplete={handleCompleteChore}
            />
            <AssigneeColumn
              title={partnerName}
              chores={choresByPerson.B}
              items={game.housework.items}
              today={today}
              completingIds={completingIds}
              dailyLimitReached={dailyLimitReached}
              onComplete={handleCompleteChore}
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
                if (
                  hasCompleted &&
                  !window.confirm('清除今日分配會移除畫面上的完成狀態，但今日已領獎勵不會重置。確定嗎？')
                )
                  return;
                game.clearTodayHousework();
                setConfirmReassign(false);
              }}
              className={`flex-1 rounded-[14px] border border-stone-200 bg-stone-50 px-3 py-2.5 text-[13px] font-semibold text-stone-600 active:scale-[0.98]`}
            >
              清除今日分配
            </button>
          </div>

          {rewardHint ? (
            <p
              className={`mt-2 rounded-xl border px-3 py-2 text-[12px] ${
                rewardHint === HOUSEWORK_CHORE_REWARD_GRANTED_HINT
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                  : `border-stone-200 bg-stone-50 ${lq.textMuted}`
              }`}
            >
              {rewardHint}
            </p>
          ) : null}

          {confirmReassign ? (
            <div className={`mt-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-[12px] text-amber-950`}>
              <p>重新分配會重排家事，今日已領過的獎勵不會重置。確定嗎？</p>
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
        <h2 className={`mb-2 flex items-center gap-1.5 text-sm font-bold ${lq.text}`}>
          <span aria-hidden>⚙️</span> 管理家事項目
        </h2>
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

function HouseworkPageIntro({
  rewardDisplayCount,
  rewardLimit,
  limitReached,
}: {
  rewardDisplayCount: number;
  rewardLimit: number;
  limitReached: boolean;
}) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="mb-3 space-y-1 px-0.5">
      <p className={`text-[12px] leading-snug ${lq.textSecondary}`}>
        完成家事可獲得 <span className="whitespace-nowrap">🤝+3 ✨+10 🪙+3</span>
      </p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p
          className={`text-[12px] font-bold leading-snug ${
            limitReached ? 'text-amber-900' : 'text-stone-800'
          }`}
        >
          <span aria-hidden>🧹 </span>
          今日獎勵 {rewardDisplayCount}/{rewardLimit}
          {limitReached ? <span className="font-semibold text-amber-800"> · 已達上限</span> : null}
        </p>
        {limitReached ? (
          <span className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200/70">
            仍可繼續記錄
          </span>
        ) : null}
      </div>

      <p className={`text-[11px] font-medium leading-snug ${lq.textMuted}`}>
        <span aria-hidden>📱 </span>
        本機家事 · 動態共享
      </p>

      <div>
        <button
          type="button"
          onClick={() => setRulesOpen((v) => !v)}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-stone-500 active:opacity-70"
          aria-expanded={rulesOpen}
        >
          規則說明
          {rulesOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-rose-400" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-rose-400" aria-hidden />
          )}
        </button>
        {rulesOpen ? (
          <ul className={`mt-1.5 space-y-1 pl-0.5 text-[11px] leading-relaxed ${lq.textMuted}`}>
            <li>· 家事分配儲存在本機</li>
            <li>· 完成動態會顯示在今日動態</li>
            <li>· Free 每日最多 {FREE_DAILY_CHORE_REWARD_LIMIT} 項家事獎勵</li>
            <li>· Pro 每日最多 {PRO_DAILY_CHORE_REWARD_LIMIT} 項家事獎勵</li>
            <li>· 超過上限仍可完成，但不再給獎</li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function AssigneeColumn({
  title,
  chores,
  items,
  today,
  completingIds,
  dailyLimitReached,
  onComplete,
}: {
  title: string;
  chores: { taskId: string; assignee: 'A' | 'B'; completed: boolean; rewarded: boolean }[];
  items: { id: string; label: string; emoji: string }[];
  today: string;
  completingIds: Set<string>;
  dailyLimitReached: boolean;
  onComplete: (id: string) => void;
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
            const rewardClaimed = hasChoreRewardClaim(today, c.taskId);
            const locking = completingIds.has(c.taskId);
            const noReward = rewardClaimed || dailyLimitReached;
            const statusLabel = c.completed
              ? rewardClaimed
                ? '已完成，本日獎勵已領'
                : dailyLimitReached
                  ? '已完成，今日獎勵已達上限'
                  : '完成'
              : rewardClaimed
                ? '可完成（本日獎勵已領）'
                : dailyLimitReached
                  ? '可完成（今日獎勵已達上限）'
                  : '點擊完成';
            return (
              <li key={c.taskId}>
                <button
                  type="button"
                  onClick={() => !c.completed && !locking && onComplete(c.taskId)}
                  disabled={c.completed || locking}
                  className={`flex w-full min-h-[40px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                    c.completed
                      ? 'border-emerald-200 bg-emerald-50/80 opacity-90'
                      : locking
                        ? 'border-stone-200 bg-stone-50 opacity-70'
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
                  <span
                    className={`max-w-[42%] text-right text-[10px] leading-tight ${
                      c.completed ? 'text-emerald-600' : noReward ? 'text-amber-700' : lq.textMuted
                    }`}
                  >
                    {locking ? '處理中…' : statusLabel}
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
  const statsPro = useProFeature('housework_advanced');

  return (
    <section className={`p-3 ${lq.card}`}>
      <h2 className={`mb-1 flex flex-wrap items-center gap-2 ${lq.sectionTitleSm}`}>
        本週家事統計
        <ProBadgeIfNeeded show={statsPro.showProBadge} feature="housework_advanced" />
      </h2>
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
