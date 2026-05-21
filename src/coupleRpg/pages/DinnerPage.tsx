import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { DinnerSyncStatusLine } from '../components/DinnerSyncStatusLine';
import { formatDateShort } from '../lib/dates';
import { foodEmojiForLabel } from '../lib/dinnerFoodEmoji';
import { pickRandomOption } from '../storage/dinnerStore';
import { DinnerFateCard } from '../components/DinnerFateCard';
import { EmptyState } from '../components/EmptyState';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, OptionChip, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

const SHUFFLE_MS = 1500;
const ROLL_TICK_MS = 80;

export function DinnerPage({ embedded }: { embedded?: boolean } = {}) {
  const lqState = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');

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

  const activeOptions = lqState.dinnerOptions;
  const optionCount = activeOptions.length;
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
  const drawButtonLabel = isDrawing ? '抽籤中…' : canRedraw ? '🔄 再抽一次' : '🎲 隨機抽籤';

  const startDinnerDraw = useCallback(() => {
    const opts = activeOptions;
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
  }, [activeOptions, lqState.setDinnerDraftPick, clearDrawTimers]);

  return (
    <>
      {!embedded ? (
        <>
          <PageHero emoji="🍽️" title="晚餐決定器" subtitle="新增選項 · 隨機抽籤 · 不再糾結" />
          <RpgMiniStats compact />
        </>
      ) : null}

      <DinnerSyncStatusLine
        status={lqState.dinnerSyncStatus}
        error={lqState.dinnerSyncError}
        canSyncOptions={lqState.dinnerCanSyncOptions}
        onRetry={lqState.retryDinnerSync}
      />

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className={`mb-3 flex items-center gap-1.5 text-sm font-bold ${lq.text}`}>
          <span aria-hidden>🍽️</span> 今晚吃什麼？
        </h2>

        <div className="mb-3 flex min-h-[180px] items-center justify-center py-1">
          {emptyHint || optionCount === 0 ? (
            <EmptyState
              emoji="🍽️"
              title={emptyHint ? '請先新增晚餐選項' : '還沒有晚餐選項'}
              hint="先新增幾個常吃的餐點吧"
              className="min-h-[168px] w-full"
            />
          ) : (
            <DinnerFateCard mode={cardMode} displayName={displayName} displaySubtitle={displaySubtitle} />
          )}
        </div>

        <PrimaryButton onClick={startDinnerDraw} disabled={isDrawing || optionCount === 0}>
          {drawButtonLabel}
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          disabled={isDrawing || !lqState.draftPick}
          onClick={() => lqState.saveDinnerResult()}
          className="mt-2"
        >
          💾 儲存今日結果
        </PrimaryButton>
        {savedTodayResult ? (
          <button
            type="button"
            onClick={() => lqState.clearTodayDinnerResult()}
            className={`mt-2 w-full text-center text-[12px] font-semibold ${lq.accent}`}
          >
            清除今日結果
          </button>
        ) : null}
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className={`mb-2 flex items-center gap-1.5 text-sm font-bold ${lq.text}`}>
          <span aria-hidden>🍱</span> 晚餐選項
        </h2>
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
          {activeOptions.map((o) => (
            <OptionChip
              key={o.id}
              emoji={foodEmojiForLabel(o.label)}
              label={o.label}
              onRemove={() => lqState.removeDinnerOption(o.id)}
            />
          ))}
        </ChipRow>
        {activeOptions.length === 0 ? (
          <p className={`mt-2 text-[12px] ${lq.textSecondary}`}>🍽️ 至少新增一項才能抽籤</p>
        ) : null}
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className={`mb-2 flex items-center gap-1.5 text-sm font-bold ${lq.text}`}>
          <span aria-hidden>📆</span> 最近 7 天晚餐
        </h2>
        {lqState.dinnerHistory.length === 0 ? (
          <EmptyState compact emoji="🍽️" title="尚無晚餐紀錄" hint="儲存今日結果後會出現在這裡" className="border-0 bg-transparent" />
        ) : (
          <ul className="space-y-1.5">
            {lqState.dinnerHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-[13px]"
              >
                <span className={`flex min-w-0 items-center gap-1.5 font-semibold ${lq.text}`}>
                  <span aria-hidden>{foodEmojiForLabel(h.label)}</span>
                  <span className="truncate">{h.label}</span>
                </span>
                <span className={lq.textMuted}>{formatDateShort(h.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
