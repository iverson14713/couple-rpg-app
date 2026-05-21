import { useCallback, useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatDateShort } from '../lib/dates';
import { pickRandomOption } from '../storage/dinnerStore';
import { DinnerFateCard, type DinnerFateCardPhase } from '../components/DinnerFateCard';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, OptionChip, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

const SHUFFLE_MS = 1500;
const FLIP_MS = 550;

export function DinnerPage({ embedded }: { embedded?: boolean } = {}) {
  const lqState = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [emptyHint, setEmptyHint] = useState(false);
  const [showFateCard, setShowFateCard] = useState(false);
  const [fatePhase, setFatePhase] = useState<DinnerFateCardPhase>('flipped');
  const [revealLabel, setRevealLabel] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);

  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const drawRunIdRef = useRef(0);

  const clearDrawTimers = useCallback(() => {
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

  useEffect(() => {
    if (isDrawing) return;
    const label = lqState.draftPick ?? lqState.todayDinner?.label ?? null;
    if (label) {
      setShowFateCard(true);
      setRevealLabel(label);
      setFatePhase('flipped');
      setSavedOnly(!lqState.draftPick && Boolean(lqState.todayDinner));
    } else {
      setShowFateCard(false);
      setRevealLabel('');
      setSavedOnly(false);
    }
  }, [lqState.draftPick, lqState.todayDinner, isDrawing]);

  const optionCount = lqState.dinner.options.length;
  const canRedraw = optionCount > 0 && (showFateCard || Boolean(lqState.draftPick || lqState.todayDinner));

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

    setEmptyHint(false);
    setIsDrawing(true);
    setShowFateCard(true);
    setFatePhase('shuffling');
    setRevealLabel(finalLabel);
    setSavedOnly(false);

    const tFlip = window.setTimeout(() => {
      if (drawRunIdRef.current !== runId) return;
      setFatePhase('flipped');
      lqState.setDinnerDraftPick(finalLabel);

      const tDone = window.setTimeout(() => {
        if (drawRunIdRef.current !== runId) return;
        setIsDrawing(false);
      }, FLIP_MS);
      timeoutRefs.current.push(tDone);
    }, SHUFFLE_MS);
    timeoutRefs.current.push(tFlip);
  }, [lqState.dinner.options, lqState.setDinnerDraftPick, clearDrawTimers]);

  const drawButtonLabel = isDrawing ? '抽籤中...' : canRedraw ? '再抽一次' : '隨機抽籤';

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

        <div className="mb-3 flex min-h-[168px] items-center justify-center py-1">
          {emptyHint ? (
            <div className="w-full rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center">
              <p className="text-[14px] font-semibold text-stone-700">請先新增晚餐選項</p>
            </div>
          ) : showFateCard && revealLabel ? (
            <DinnerFateCard phase={fatePhase} label={revealLabel} savedOnly={savedOnly && fatePhase === 'flipped'} />
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-stone-200/90 bg-gradient-to-br from-rose-50/40 to-white px-4 py-10 text-center">
              <p className={`text-[14px] ${lq.textSecondary}`}>按下隨機抽籤，翻開今晚的命運卡</p>
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
