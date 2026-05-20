import { useCallback, useEffect, useRef, useState } from 'react';
import { Dices, UtensilsCrossed } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatDateShort } from '../lib/dates';
import { pickRandomOption } from '../storage/dinnerStore';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, OptionChip, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

const FAST_TICK_MS = 80;
const FAST_PHASE_MS = 1600;

export function DinnerPage({ embedded }: { embedded?: boolean } = {}) {
  const lqState = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [spinDisplay, setSpinDisplay] = useState<string | null>(null);
  const [emptyHint, setEmptyHint] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const drawRunIdRef = useRef(0);

  const clearDrawingTimers = useCallback(() => {
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
      clearDrawingTimers();
    };
  }, [clearDrawingTimers]);

  useEffect(() => {
    void lqState.pullDinnerFromCloud();
  }, [lqState.pullDinnerFromCloud]);

  const optionCount = lqState.dinner.options.length;
  const showMainLine = isDrawing ? spinDisplay : (lqState.draftPick ?? lqState.todayDinner?.label ?? null);

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

    clearDrawingTimers();
    drawRunIdRef.current += 1;
    const runId = drawRunIdRef.current;

    const labels = opts.map((o) => o.label);
    const finalLabel = picked.label;

    setIsDrawing(true);
    setSpinDisplay(labels[0] ?? finalLabel);

    intervalRef.current = setInterval(() => {
      if (drawRunIdRef.current !== runId) return;
      if (labels.length === 1) {
        setSpinDisplay(labels[0]!);
        return;
      }
      setSpinDisplay(labels[Math.floor(Math.random() * labels.length)]!);
    }, FAST_TICK_MS);

    const tSlowPhase = window.setTimeout(() => {
      if (drawRunIdRef.current !== runId) return;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const slowMs = [130, 160, 200, 240];
      let i = 0;
      const tickSlow = () => {
        if (drawRunIdRef.current !== runId) return;
        if (i < slowMs.length) {
          if (labels.length > 1) {
            setSpinDisplay(labels[Math.floor(Math.random() * labels.length)]!);
          } else {
            setSpinDisplay(labels[0]!);
          }
          const tid = window.setTimeout(tickSlow, slowMs[i]);
          timeoutRefs.current.push(tid);
          i += 1;
        } else {
          setSpinDisplay(finalLabel);
          const tid2 = window.setTimeout(() => {
            if (drawRunIdRef.current !== runId) return;
            lqState.setDinnerDraftPick(finalLabel);
            setIsDrawing(false);
            setSpinDisplay(null);
          }, 300);
          timeoutRefs.current.push(tid2);
        }
      };
      tickSlow();
    }, FAST_PHASE_MS);
    timeoutRefs.current.push(tSlowPhase);
  }, [lqState.dinner.options, lqState.setDinnerDraftPick, clearDrawingTimers]);

  const drawButtonLabel = isDrawing ? '抽籤中...' : optionCount > 0 && (lqState.draftPick || lqState.todayDinner) ? '再抽一次' : '隨機抽籤';

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
          className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          {syncBusy ? '同步中…' : '同步晚餐資料'}
        </button>
      </div>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">今晚吃什麼？</h2>
        <div
          className={`mb-3 flex min-h-[88px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all duration-300 ${
            showMainLine || emptyHint
              ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50/80'
              : 'border-rose-100 bg-rose-50/40'
          } ${isDrawing ? 'scale-[1.02] shadow-[0_0_28px_-4px_rgba(251,113,133,0.45)] ring-2 ring-rose-300/55 motion-safe:animate-pulse' : ''}`}
        >
          {emptyHint ? (
            <p className="text-sm font-semibold text-rose-800">請先新增晚餐選項</p>
          ) : showMainLine ? (
            <>
              <UtensilsCrossed
                className={`mb-1 h-6 w-6 text-rose-400 transition-transform ${isDrawing ? 'motion-safe:animate-bounce motion-safe:[animation-duration:0.85s]' : ''}`}
                aria-hidden
              />
              <p className="text-xl font-extrabold text-rose-700">{showMainLine}</p>
              {isDrawing ? (
                <p className="mt-1.5 text-[12px] font-medium text-stone-600">命運正在選擇今晚的答案...</p>
              ) : lqState.draftPick ? (
                <>
                  <p className="mt-1 text-[12px] font-semibold text-stone-700">今晚就決定吃這個！</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">抽籤結果 · 記得儲存</p>
                </>
              ) : lqState.todayDinner ? (
                <p className="mt-1 text-[11px] text-stone-500">已儲存今日結果</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-stone-500">按下隨機抽籤開始</p>
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
        <h2 className="mb-2 text-sm font-bold text-stone-900">晚餐選項</h2>
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
          <p className="mt-2 text-[12px] text-stone-500">至少新增一個選項才能抽籤</p>
        ) : null}
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">最近 7 天晚餐</h2>
        {lqState.dinnerHistory.length === 0 ? (
          <p className="text-[13px] text-stone-500">尚無紀錄，儲存今日結果後會出現在這裡</p>
        ) : (
          <ul className="space-y-1.5">
            {lqState.dinnerHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3 py-2 text-[13px]"
              >
                <span className="font-semibold text-stone-800">{h.label}</span>
                <span className="text-stone-400">{formatDateShort(h.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
