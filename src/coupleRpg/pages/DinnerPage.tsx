import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { DinnerSyncStatusLine } from '../components/DinnerSyncStatusLine';
import { foodEmojiForLabel } from '../lib/dinnerFoodEmoji';
import { fateIndexForLabel, pickDinnerFateIndex, pickDinnerFateQuip, quipForLabel } from '../lib/dinnerFateExtras';
import { formatDinnerRelativeDay } from '../lib/dinnerHistoryLabels';
import { pickRandomOption } from '../storage/dinnerStore';
import { DinnerFateCard, type DinnerFatePhase, type DinnerFateReveal } from '../components/DinnerFateCard';
import { EmptyState } from '../components/EmptyState';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, OptionChip, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

const FLIP_MS = 500;
const FLIP_MID_MS = 250;
const EMOJI_POP_MS = 300;
const BTN_PRESS_MS = 200;

function buildReveal(label: string, quip?: string): DinnerFateReveal {
  return {
    label,
    emoji: foodEmojiForLabel(label),
    fateIndex: pickDinnerFateIndex(),
    quip: quip ?? pickDinnerFateQuip(),
  };
}

export function DinnerPage({ embedded }: { embedded?: boolean } = {}) {
  const lqState = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');

  const [isFlipping, setIsFlipping] = useState(false);
  const [showResultOnBack, setShowResultOnBack] = useState(false);
  const [emojiPop, setEmojiPop] = useState(false);
  const [revealMeta, setRevealMeta] = useState<DinnerFateReveal | null>(null);
  const [emptyHint, setEmptyHint] = useState(false);
  const [drawBtnPress, setDrawBtnPress] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

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

  const activeOptions = lqState.dinnerOptions;
  const optionCount = activeOptions.length;
  const selectedFood = lqState.draftPick;
  const savedTodayResult =
    lqState.todayDinner?.label && !lqState.draftPick ? lqState.todayDinner.label : null;

  useEffect(() => {
    if (!selectedFood || revealMeta?.label === selectedFood) return;
    setRevealMeta({
      label: selectedFood,
      emoji: foodEmojiForLabel(selectedFood),
      fateIndex: fateIndexForLabel(selectedFood),
      quip: quipForLabel(selectedFood),
    });
  }, [selectedFood, revealMeta?.label]);

  const fatePhase = useMemo((): DinnerFatePhase => {
    if (isFlipping) return 'flipping';
    if (selectedFood) return 'revealed';
    if (savedTodayResult) return 'saved';
    return 'idle';
  }, [isFlipping, selectedFood, savedTodayResult]);

  const displayReveal = useMemo((): DinnerFateReveal | null => {
    if (fatePhase === 'idle') return null;
    if (savedTodayResult && !selectedFood) {
      return {
        label: savedTodayResult,
        emoji: foodEmojiForLabel(savedTodayResult),
        fateIndex: fateIndexForLabel(savedTodayResult),
        quip: '',
      };
    }
    if (revealMeta) return revealMeta;
    if (selectedFood) {
      return {
        label: selectedFood,
        emoji: foodEmojiForLabel(selectedFood),
        fateIndex: fateIndexForLabel(selectedFood),
        quip: quipForLabel(selectedFood),
      };
    }
    return null;
  }, [fatePhase, revealMeta, savedTodayResult, selectedFood]);

  const drawButtonLabel =
    fatePhase === 'flipping' ? '抽籤中...' : fatePhase === 'idle' ? '隨機抽籤' : '再抽一次';

  const triggerBtnPress = useCallback(() => {
    setDrawBtnPress(true);
    const tid = window.setTimeout(() => setDrawBtnPress(false), BTN_PRESS_MS);
    timeoutRefs.current.push(tid);
  }, []);

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
    const nextReveal = buildReveal(finalLabel);

    setEmptyHint(false);
    setEmojiPop(false);
    setShowResultOnBack(false);
    setRevealMeta(nextReveal);
    setFlipKey((k) => k + 1);
    setIsFlipping(true);
    triggerBtnPress();

    const tMid = window.setTimeout(() => {
      if (drawRunIdRef.current !== runId) return;
      setShowResultOnBack(true);
    }, FLIP_MID_MS);
    timeoutRefs.current.push(tMid);

    const tDone = window.setTimeout(() => {
      if (drawRunIdRef.current !== runId) return;
      lqState.setDinnerDraftPick(finalLabel);
      setIsFlipping(false);
      setEmojiPop(true);
      const tPop = window.setTimeout(() => setEmojiPop(false), EMOJI_POP_MS);
      timeoutRefs.current.push(tPop);
    }, FLIP_MS);
    timeoutRefs.current.push(tDone);
  }, [activeOptions, lqState.setDinnerDraftPick, clearDrawTimers, triggerBtnPress]);

  const showEmptyCard = emptyHint || optionCount === 0;

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

        <div className="mb-3 flex min-h-[220px] items-center justify-center py-1">
          {showEmptyCard ? (
            <EmptyState
              emoji="🍽️"
              title={emptyHint ? '請先新增晚餐選項' : '還沒有晚餐選項'}
              hint="先新增幾個常吃的餐點吧"
              className="min-h-[208px] w-full"
            />
          ) : (
            <DinnerFateCard
              key={flipKey}
              phase={fatePhase}
              isFlipping={isFlipping}
              showResultOnBack={showResultOnBack}
              emojiPop={emojiPop}
              reveal={displayReveal}
            />
          )}
        </div>

        <PrimaryButton
          onClick={startDinnerDraw}
          disabled={fatePhase === 'flipping' || optionCount === 0}
          className={drawBtnPress ? 'dinner-draw-btn--press' : ''}
        >
          {drawButtonLabel}
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          disabled={fatePhase === 'flipping' || !lqState.draftPick}
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
                className="rounded-xl bg-stone-50 px-3 py-2.5 text-[13px] font-semibold text-stone-700"
              >
                <span className={`inline-flex min-w-0 items-center gap-1.5 ${lq.text}`}>
                  <span aria-hidden>{foodEmojiForLabel(h.label)}</span>
                  <span className="text-stone-500">{formatDinnerRelativeDay(h.date)}</span>
                  <span className="truncate">{h.label}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
