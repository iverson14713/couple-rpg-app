import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  CustomQuestionDrawCard,
  type CustomDrawPhase,
} from './CustomQuestionDrawCard';
import {
  CUSTOM_DRAW_CAROUSEL_PREVIEWS,
  CUSTOM_DRAW_TIMING,
  pickCustomDrawMoodLine,
  triggerCustomDrawHaptic,
} from '../lib/customQuestionDrawUx';
import {
  addCustomQuestion,
  countEnabledQuestions,
  CUSTOM_QUESTION_CATEGORIES,
  deleteCustomQuestion,
  loadCustomQuestionBank,
  pickRandomCustomQuestion,
  toggleCustomQuestionEnabled,
  updateCustomQuestion,
  type CustomQuestion,
  type CustomQuestionBankData,
} from '../storage/customQuestionBankStore';
import { lq } from '../theme';

type Props = {
  onBack: () => void;
};

type FormState = {
  open: boolean;
  editing: CustomQuestion | null;
  text: string;
  category: string;
};

const CATEGORY_CHIP: Record<string, string> = {
  互動: 'bg-rose-100/80 text-rose-700 ring-rose-200/60',
  挑戰: 'bg-violet-100/80 text-violet-700 ring-violet-200/60',
  甜蜜: 'bg-pink-100/80 text-pink-700 ring-pink-200/60',
  約會: 'bg-amber-100/80 text-amber-800 ring-amber-200/60',
  真心話: 'bg-fuchsia-100/80 text-fuchsia-700 ring-fuchsia-200/60',
};


function pickCarouselPreview(index: number) {
  return CUSTOM_DRAW_CAROUSEL_PREVIEWS[index % CUSTOM_DRAW_CAROUSEL_PREVIEWS.length]!;
}

function categoryChipClass(category: string): string {
  return CATEGORY_CHIP[category] ?? 'bg-rose-100/70 text-rose-700 ring-rose-200/50';
}

export function CustomQuestionBankPage({ onBack }: Props) {
  const [bank, setBank] = useState<CustomQuestionBankData>(() => loadCustomQuestionBank());
  const [phase, setPhase] = useState<CustomDrawPhase>('idle');
  const [drawn, setDrawn] = useState<CustomQuestion | null>(null);
  const [moodLine, setMoodLine] = useState<string | null>(null);
  const [carouselPreview, setCarouselPreview] = useState<{ emoji: string; label: string } | null>(
    null
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [form, setForm] = useState<FormState>({ open: false, editing: null, text: '', category: '互動' });
  const [deleteTarget, setDeleteTarget] = useState<CustomQuestion | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const drawTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawRunIdRef = useRef(0);

  const enabledCount = useMemo(() => countEnabledQuestions(bank), [bank]);

  const clearTimers = useCallback(() => {
    drawTimerRef.current.forEach((id) => clearTimeout(id));
    drawTimerRef.current = [];
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    drawTimerRef.current.push(id);
    return id;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const openAddForm = () => {
    setFormError(null);
    setForm({ open: true, editing: null, text: '', category: '互動' });
  };

  const openEditForm = (q: CustomQuestion) => {
    setFormError(null);
    setForm({ open: true, editing: q, text: q.text, category: q.category });
  };

  const closeForm = () => {
    setFormError(null);
    setForm({ open: false, editing: null, text: '', category: '互動' });
  };

  const submitForm = () => {
    const text = form.text.trim();
    if (!text) {
      setFormError('請輸入題目內容');
      return;
    }
    if (form.editing) {
      setBank(updateCustomQuestion(bank, form.editing.id, { text, category: form.category }));
    } else {
      setBank(addCustomQuestion(bank, { text, category: form.category }));
    }
    closeForm();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setBank(deleteCustomQuestion(bank, deleteTarget.id));
    if (drawn?.id === deleteTarget.id) {
      setDrawn(null);
      setPhase('idle');
    }
    setDeleteTarget(null);
  };

  const startDrawSequence = useCallback(
    (fromFlip: boolean) => {
      clearTimers();
      drawRunIdRef.current += 1;
      const runId = drawRunIdRef.current;
      setShowCelebration(false);

      const beginShuffle = () => {
        if (drawRunIdRef.current !== runId) return;
        setCarouselPreview(null);
        setPhase('shuffle');

        schedule(() => {
          if (drawRunIdRef.current !== runId) return;
          setPhase('carousel');
          let tick = 0;
          setCarouselPreview(pickCarouselPreview(0));
          carouselIntervalRef.current = window.setInterval(() => {
            tick += 1;
            setCarouselPreview(pickCarouselPreview(tick));
          }, CUSTOM_DRAW_TIMING.carouselTickMs);

          schedule(() => {
            if (carouselIntervalRef.current) {
              clearInterval(carouselIntervalRef.current);
              carouselIntervalRef.current = null;
            }
            if (drawRunIdRef.current !== runId) return;

            const next = pickRandomCustomQuestion(bank, drawn?.id);
            setDrawn(next);
            setMoodLine(pickCustomDrawMoodLine());
            setPhase('revealing');
            triggerCustomDrawHaptic();

            schedule(() => {
              if (drawRunIdRef.current !== runId) return;
              setPhase('revealed');
            }, CUSTOM_DRAW_TIMING.revealMs);
          }, CUSTOM_DRAW_TIMING.carouselMs);
        }, CUSTOM_DRAW_TIMING.shuffleMs);
      };

      if (fromFlip) {
        setPhase('flipping');
        schedule(beginShuffle, CUSTOM_DRAW_TIMING.flipMs);
      } else {
        beginShuffle();
      }
    },
    [bank, drawn?.id, clearTimers, schedule]
  );

  const draw = useCallback(() => {
    if (enabledCount === 0) return;
    if (phase === 'shuffle' || phase === 'carousel' || phase === 'revealing' || phase === 'flipping') {
      return;
    }
    const fromFlip = phase === 'revealed' || phase === 'completed';
    if (phase === 'completed') {
      setPhase('revealed');
    }
    startDrawSequence(fromFlip);
  }, [enabledCount, phase, startDrawSequence]);

  const handleComplete = useCallback(() => {
    if (phase !== 'revealed' || !drawn) return;
    setPhase('completed');
    setShowCelebration(true);
    triggerCustomDrawHaptic();
    schedule(() => setShowCelebration(false), 1200);
  }, [phase, drawn, schedule]);

  const isDrawing =
    phase === 'shuffle' || phase === 'carousel' || phase === 'revealing' || phase === 'flipping';
  const showResultActions = phase === 'revealed' || phase === 'completed';

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 flex items-center gap-0.5 text-[11px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        返回小遊戲
      </button>

      <div className={`mb-3 px-3 py-2.5 ${lq.card}`}>
        <p className="text-[12px] font-bold text-stone-600">📝 我的題庫</p>
        <p className="mt-1 text-[13px] font-extrabold text-stone-900">只玩自己新增的題目</p>
        <p className="mt-0.5 text-[11px] text-stone-500">
          可抽題數：<span className="font-bold text-rose-600">{enabledCount}</span> 題
        </p>
      </div>

      <section className={`mb-3 p-4 ${lq.cardElevated}`}>
        {enabledCount === 0 ? (
          <div className="mb-3 rounded-2xl border border-rose-100/70 bg-rose-50/40 px-4 py-6 text-center">
            <p className="text-[15px] font-bold text-stone-800">還沒有可抽的題目</p>
            <p className="mt-1 text-[12px] text-stone-500">先新增幾個專屬玩法吧</p>
            <button type="button" onClick={openAddForm} className={`mt-4 w-full ${lq.btnPrimary}`}>
              <Plus className="mr-1 inline h-4 w-4" aria-hidden />
              新增題目
            </button>
          </div>
        ) : (
          <>
            <CustomQuestionDrawCard
              phase={phase}
              question={drawn}
              moodLine={moodLine}
              carouselPreview={carouselPreview}
              showCelebration={showCelebration}
              enabledCount={enabledCount}
            />
            {showResultActions ? (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  disabled={phase === 'completed'}
                  onClick={handleComplete}
                  className={`w-full rounded-xl py-2.5 text-sm font-bold ${
                    phase === 'completed'
                      ? 'bg-stone-100 text-stone-400'
                      : 'bg-emerald-600 text-white shadow-sm active:scale-[0.99]'
                  }`}
                >
                  {phase === 'completed' ? '已完成' : '✅ 今天完成了'}
                </button>
                <button
                  type="button"
                  disabled={isDrawing}
                  onClick={draw}
                  className={`w-full rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${lq.btnPrimary}`}
                >
                  換一題
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={draw}
                disabled={isDrawing}
                className={`mt-3 w-full rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40 ${
                  phase === 'idle' ? `game-card-cta-pulse ${lq.btnPrimary}` : lq.btnPrimary
                }`}
              >
                🎲 隨機抽一題
              </button>
            )}
          </>
        )}
      </section>

      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="text-[11px] font-semibold tracking-wide text-stone-400">題目列表</p>
        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center gap-1 rounded-full bg-rose-100/70 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200/50 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          新增題目
        </button>
      </div>

      <div className="space-y-2">
        {bank.questions.map((q) => (
          <QuestionRow
            key={q.id}
            question={q}
            onToggle={() => setBank(toggleCustomQuestionEnabled(bank, q.id))}
            onEdit={() => openEditForm(q)}
            onDelete={() => setDeleteTarget(q)}
          />
        ))}
      </div>

      <QuestionFormSheet
        form={form}
        error={formError}
        onClose={closeForm}
        onChangeText={(text) => setForm((f) => ({ ...f, text }))}
        onChangeCategory={(category) => setForm((f) => ({ ...f, category }))}
        onSubmit={submitForm}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function QuestionRow({
  question,
  onToggle,
  onEdit,
  onDelete,
}: {
  question: CustomQuestion;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border px-3 py-2.5 ${
        question.enabled
          ? 'border-rose-200/50 bg-white/70 backdrop-blur-md'
          : 'border-stone-200/50 bg-stone-50/50 opacity-75'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-[14px] font-bold leading-snug ${question.enabled ? 'text-stone-900' : 'text-stone-500'}`}>
          {question.text}
        </p>
        <span
          className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${categoryChipClass(question.category)}`}
        >
          {question.category}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={question.enabled}
          aria-label={question.enabled ? '停用題目' : '啟用題目'}
          onClick={onToggle}
          className={`relative h-6 w-11 rounded-full transition ${
            question.enabled ? 'bg-rose-400' : 'bg-stone-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              question.enabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="編輯題目"
            className="rounded-lg p-1.5 text-stone-500 active:bg-rose-50 active:text-rose-600"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="刪除題目"
            className="rounded-lg p-1.5 text-stone-500 active:bg-rose-50 active:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionFormSheet({
  form,
  error,
  onClose,
  onChangeText,
  onChangeCategory,
  onSubmit,
}: {
  form: FormState;
  error: string | null;
  onClose: () => void;
  onChangeText: (text: string) => void;
  onChangeCategory: (category: string) => void;
  onSubmit: () => void;
}) {
  if (!form.open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(80,30,50,0.35)] backdrop-blur-[2px]"
        aria-label="關閉"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-t-[28px] border border-[rgba(244,114,182,0.22)] bg-gradient-to-b from-[#fff7fb] to-[#fff1f6] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-16px_48px_-12px_rgba(244,114,182,0.32),0_12px_40px_-16px_rgba(216,180,254,0.18)] ring-1 ring-white/55 backdrop-blur-md sm:rounded-3xl sm:pb-5 sm:pt-5"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-rose-200/55 sm:hidden" aria-hidden />
        <div className="mb-4">
          <p className="flex items-center gap-1.5 text-[18px] font-extrabold tracking-tight text-[#3a2e34]">
            <span className="text-[1.1rem] leading-none" aria-hidden>
              📝
            </span>
            {form.editing ? '編輯題目' : '新增題目'}
          </p>
          <p className="mt-1 text-[12px] font-medium text-[#9a8a94]">寫下你們專屬的互動玩法</p>
        </div>
        <label className="block">
          <span className="text-[12px] font-semibold text-[#7a6a74]">題目內容</span>
          <textarea
            value={form.text}
            onChange={(e) => onChangeText(e.target.value)}
            rows={3}
            placeholder="例如：一起拍一張可愛自拍"
            className="mt-1.5 w-full resize-none rounded-[20px] border border-rose-200/55 bg-[#fffcfd] px-3.5 py-3 text-[14px] leading-relaxed text-[#3a2e34] shadow-[inset_0_1px_2px_rgba(244,114,182,0.06)] placeholder:text-[#d4c4cc] focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200/55"
          />
        </label>
        <div className="mt-4">
          <span className="text-[12px] font-semibold text-[#7a6a74]">分類</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CUSTOM_QUESTION_CATEGORIES.map((cat) => {
              const selected = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChangeCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-[0.98] ${
                    selected
                      ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 text-white shadow-[0_4px_14px_-4px_rgba(244,114,182,0.55)] ring-1 ring-rose-300/40'
                      : 'border border-rose-200/55 bg-white/90 text-[#8a7a84] shadow-[0_2px_8px_-4px_rgba(244,114,182,0.12)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
        {error ? <p className="mt-2.5 text-[12px] font-medium text-rose-600">{error}</p> : null}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full border border-rose-200/60 bg-white px-4 text-[15px] font-semibold text-[#3a2e34] shadow-[0_4px_16px_-10px_rgba(244,114,182,0.15)] active:scale-[0.98]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-4 text-[15px] font-semibold text-white shadow-[0_6px_22px_-6px_rgba(244,114,182,0.45)] active:scale-[0.98]"
          >
            {form.editing ? '儲存' : '新增'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}

function DeleteConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-question-title"
      aria-describedby="delete-question-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(80,30,50,0.35)] backdrop-blur-[2px]"
        aria-label="取消"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-[28px] border border-[rgba(244,114,182,0.22)] bg-gradient-to-b from-[#fff7fb] to-[#fff1f6] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-16px_48px_-12px_rgba(244,114,182,0.32),0_12px_40px_-16px_rgba(216,180,254,0.18)] ring-1 ring-white/55 backdrop-blur-md sm:rounded-3xl sm:pb-5 sm:pt-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-rose-200/55 sm:hidden" aria-hidden />
        <div className="mb-5">
          <p
            id="delete-question-title"
            className="flex items-center gap-1.5 text-[18px] font-extrabold tracking-tight text-[#3a2e34]"
          >
            <span className="text-[1.1rem] leading-none" aria-hidden>
              🗑️
            </span>
            刪除題目
          </p>
          <p id="delete-question-desc" className="mt-1 text-[12px] font-medium text-[#9a8a94]">
            確定要刪除這個題目嗎？刪除後就無法復原囉
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full border border-rose-200/60 bg-white px-4 text-[15px] font-semibold text-[#3a2e34] shadow-[0_4px_16px_-10px_rgba(244,114,182,0.15)] active:scale-[0.98]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-4 text-[15px] font-semibold text-white shadow-[0_6px_22px_-6px_rgba(244,114,182,0.45)] active:scale-[0.98]"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
}
