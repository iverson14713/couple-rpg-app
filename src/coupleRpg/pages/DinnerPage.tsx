import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatDateShort } from '../lib/dates';
import { pickRandomOption } from '../storage/dinnerStore';
import { DinnerFateCard } from '../components/DinnerFateCard';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, OptionChip, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

const SHUFFLE_MS = 1500;
const ROLL_TICK_MS = 80;

export function DinnerPage({ embedded }: { embedded?: boolean } = {}) {
  const lqState = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [emptyHint, setEmptyHint] = useState(false);
  const [rollingFoodName, setRollingFoodName] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const drawRunIdRef = useRef(0);

  const clearDrawTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeoutRefs.current.forEach((id) => clearTimeout(id));
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => {
      drawRunIdRef.current += 1;
      clearDrawTimers();
    };
  }, [clearDrawTimers]);

  useEffect(() => {
    void lqState.pullDinnerFromCloud();
  }, [lqState.pullDinnerFromCloud]);

  const optionCount = lqState.dinner.options.length;
  const selectedFood = lqState.draftPick;
  const savedTodayResult =
    lqState.todayDinner?.label && !lqState.draftPick ? lqState.todayDinner.label : null;

  const isRolling = isDrawing;

  const { displayName, displaySubtitle, cardMode } = useMemo(() => {
    if (isRolling) {
      return {
        displayName: rollingFoodName || '…',
        displaySubtitle: '正在替你們挑選今晚的答案...',
        cardMode: 'rolling' as const,
      };
    }
    if (selectedFood) {
      return {
        displayName: selectedFood,
        displaySubtitle: '今晚就決定吃這個！',
        cardMode: 'picked' as const,
      };
    }
    if (savedTodayResult) {
      return {
        displayName: savedTodayResult,
        displaySubtitle: '已儲存今日結果',
        cardMode: 'saved' as const,
      };
    }
    return {
      displayName: '準備抽籤',
      displaySubtitle: '讓命運幫你們決定今晚吃什麼',
      cardMode: 'idle' as const,
    };
  }, [isRolling, rollingFoodName, selectedFood, savedTodayResult]);

  const canRedraw = optionCount > 0 && Boolean(selectedFood || savedTodayResult);
  const drawButtonLabel = isDrawing ? '抽籤中...' : canRedraw ? '再抽一次' : '隨機抽籤';

  const startDinnerDraw = useCallback(() => {
    const opts = lqState.dinner.options;
    if (opts.length === 0) {
      setEmptyHint(true);
      const tid = window.setTimeout(() => setEmptyHint(false), 3200);
      timeoutRefs.current.push(tid);
      return;
    }

    const picked = pickRandomOption(opts);
    if (!picked) return;

    clearDrawTimers();
    drawRunIdRef.current += 1;
    const runId = drawRunIdRef.current;
    const finalLabel = picked.label;
    const labels = opts.map((o) => o.label);

    setEmptyHint(false);
    setIsDrawing(true);
    setRollingFoodName(labels[Math.floor(Math.random() * labels.length)] ?? finalLabel);

    intervalRef.current = setInterval(() => {
      if (drawRunIdRef.current !== runId) return;
      if (labels.length === 1) {
        setRollingFoodName(labels[0]!);
        return;
      }
      setRollingFoodName(labels[Math.floor(Math.random() * labels.length)]!);
    }, ROLL_TICK_MS);

    const tDone = window.setTimeout(() => {
      if (drawRunIdRef.current !== runId) return;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRollingFoodName(finalLabel);
      lqState.setDinnerDraftPick(finalLabel);
      setIsDrawing(false);
    }, SHUFFLE_MS);
    timeoutRefs.current.push(tDone);
  }, [lqState.dinner.options, lqState.setDinnerDraftPick, clearDrawTimers]);

  return (
    <>
      {!embedded ? (
        <>
          <PageHero emoji="🍽️" title="晚餐決定器" subtitle="新增選項、隨機抽籤，再也不吵架" />
          <RpgMiniStats compact />
        </>
      ) : null}

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          disabled={syncBusy}
          onClick={() => {
            setSyncBusy(true);
            void lqState.syncDinnerFoodOptions().finally(() => setSyncBusy(false));
          }}
          className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-600 shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          {syncBusy ? '同步中…' : '同步晚餐資料'}
        </button>
      </div>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className={`mb-3 text-sm font-bold ${lq.text}`}>今晚吃什麼？</h2>

        <div className="mb-3 flex min-h-[180px] items-center justify-center py-1">
          {emptyHint ? (
            <div className="flex min-h-[168px] w-full items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 text-center">
              <p className="text-[14px] font-semibold text-stone-700">請先新增晚餐選項</p>
            </div>
          ) : optionCount > 0 ? (
            <DinnerFateCard mode={cardMode} displayName={displayName} displaySubtitle={displaySubtitle} />
          ) : (
            <div className="flex min-h-[168px] w-full items-center justify-center rounded-2xl border border-dashed border-stone-200/90 bg-gradient-to-br from-rose-50/40 to-white px-4 text-center">
              <p className={`text-[14px] ${lq.textSecondary}`}>請先新增晚餐選項</p>
            </div>
          )}
        </div>

        <PrimaryButton
          onClick={startDinnerDraw}
          disabled={isDrawing || optionCount === 0}
          className="flex items-center justify-center gap-2"
        >
          <Dices className="h-4 w-4 shrink-0" aria-hidden />
          {drawButtonLabel}
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          disabled={isDrawing || !lqState.draftPick}
          onClick={() => lqState.saveDinnerResult()}
          className="mt-2"
        >
          儲存今日結果
        </PrimaryButton>
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className={`mb-2 text-sm font-bold ${lq.text}`}>晚餐選項</h2>
        <InlineInput
          value={newLabel}
          onChange={setNewLabel}
          placeholder="例如：麻辣鍋、披薩…"
          onSubmit={() => {
            lqState.addDinnerOption(newLabel);
            setNewLabel('');
          }}
        />
        <ChipRow>
          {lqState.dinner.options.map((o) => (
            <OptionChip key={o.id} label={o.label} onRemove={() => lqState.removeDinnerOption(o.id)} />
          ))}
        </ChipRow>
        {lqState.dinner.options.length === 0 ? (
          <p className={`mt-2 text-[13px] ${lq.textSecondary}`}>至少新增一個選項才能抽籤</p>
        ) : null}
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className={`mb-2 text-sm font-bold ${lq.text}`}>最近 7 天晚餐</h2>
        {lqState.dinnerHistory.length === 0 ? (
          <p className={`text-[13px] ${lq.textSecondary}`}>尚無紀錄，儲存今日結果後會出現在這裡</p>
        ) : (
          <ul className="space-y-1.5">
            {lqState.dinnerHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-[13px]"
              >
                <span className={`font-semibold ${lq.text}`}>{h.label}</span>
                <span className={lq.textMuted}>{formatDateShort(h.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
