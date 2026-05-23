import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Loader2, X } from 'lucide-react';
import {
  AI_BUDGET_OPTIONS,
  AI_STYLE_OPTIONS,
  STATIC_GIFT_IDEAS,
  buildImportantDateItineraryPrompt,
  type AiBudgetChoice,
  type AiPromptInput,
  type AiStyleChoice,
} from '../lib/importantDateAiPrompt';
import { callDateItineraryAssistant } from '../lib/callCoupleAssistant';
import type { DateItineraryPlan } from '../lib/dateItineraryAiModel';
import type { ImportantDatePlan } from '../lib/importantDateAiModel';
import { isSavedImportantItineraryPlan } from '../lib/importantDateItineraryPlan';
import { DateItineraryAiResult } from './DateItineraryAiResult';
import { ImportantDateAiResult } from './ImportantDateAiResult';
import type { ImportantDateEvent } from '../lib/importantDateEvents';
import { buildImportantDateSharePayload } from '../lib/aiShareCardContent';
import { importantDateRecordId } from '../lib/aiRecordIds';
import {
  loadLastImportantDateAi,
  saveImportantDateAi,
  snapshotImportantDateEvent,
  type SavedImportantDateAi,
} from '../storage/importantDateAiCache';
import { AiRecordProActions } from './AiRecordProActions';
import { AiShareCardModal } from './AiShareCardModal';
import { useAiToast } from '../context/AiToastContext';
import { useAiResultReveal } from '../hooks/useAiResultReveal';
import { useAiUsage } from '../hooks/useAiUsage';
import { useProFeature } from '../hooks/useProFeature';
import { useUserPlan } from '../context/UserPlanContext';
import { AiUsageQuotaLabel } from './AiUsageQuotaLabel';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

type Props = {
  event: ImportantDateEvent;
  initialPrefs: string;
  onClose: () => void;
  onSavePrefs: (prefs: string) => void;
  savedRecord?: SavedImportantDateAi | null;
};

function resolveInitialImportantState(
  event: ImportantDateEvent,
  initialPrefs: string,
  savedRecord?: SavedImportantDateAi | null
): {
  plan: DateItineraryPlan | ImportantDatePlan | null;
  budget: AiBudgetChoice;
  customBudget: string;
  style: AiStyleChoice;
  partnerPrefs: string;
  fromCache: boolean;
} {
  if (savedRecord) {
    return {
      plan: savedRecord.plan,
      budget: savedRecord.settings.budget,
      customBudget: savedRecord.settings.customBudget,
      style: savedRecord.settings.style,
      partnerPrefs: savedRecord.settings.partnerPrefs,
      fromCache: true,
    };
  }
  const last = loadLastImportantDateAi();
  if (last && last.event.id === event.id && isSavedImportantItineraryPlan(last.plan)) {
    return {
      plan: last.plan,
      budget: last.settings.budget,
      customBudget: last.settings.customBudget,
      style: last.settings.style,
      partnerPrefs: last.settings.partnerPrefs,
      fromCache: true,
    };
  }
  return {
    plan: null,
    budget: 'mid',
    customBudget: '',
    style: 'romantic',
    partnerPrefs: initialPrefs,
    fromCache: false,
  };
}

export function ImportantDateAiSheet({
  event,
  initialPrefs,
  onClose,
  onSavePrefs,
  savedRecord,
}: Props) {
  const initial = useMemo(
    () => resolveInitialImportantState(event, initialPrefs, savedRecord),
    [event, initialPrefs, savedRecord]
  );

  const aiPro = useProFeature('ai_in_app');
  const { isPro } = useUserPlan();
  const aiUsage = useAiUsage();
  const { showAiGenerated, showError } = useAiToast();
  const { scrollRef, resultRef, highlight, revealResult } = useAiResultReveal();
  const [budget, setBudget] = useState<AiBudgetChoice>(initial.budget);
  const [customBudget, setCustomBudget] = useState(initial.customBudget);
  const [style, setStyle] = useState<AiStyleChoice>(initial.style);
  const [partnerPrefs, setPartnerPrefs] = useState(initial.partnerPrefs);
  const [plan, setPlan] = useState<DateItineraryPlan | ImportantDatePlan | null>(initial.plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(!initial.plan);
  const [resultAnimateIn, setResultAnimateIn] = useState(!!initial.plan);
  const [persistedRecord, setPersistedRecord] = useState<SavedImportantDateAi | null>(() => {
    if (savedRecord) return savedRecord;
    if (initial.plan) {
      const last = loadLastImportantDateAi();
      if (last && last.event.id === event.id) return last;
    }
    return null;
  });
  const [shareOpen, setShareOpen] = useState(false);
  const viewingCached = initial.fromCache && plan !== null;
  const inResultMode = plan !== null;

  const prompt = useMemo(() => {
    const input: AiPromptInput = { event, budget, customBudget, style, partnerPrefs };
    return buildImportantDateItineraryPrompt(input);
  }, [event, budget, customBudget, style, partnerPrefs]);

  const generateDisabled = loading || aiUsage.aiCallInFlight || !aiUsage.canUseAi;

  useEffect(() => {
    void aiUsage.refreshAiQuota();
  }, [aiUsage.refreshAiQuota]);

  useEffect(() => {
    if (!plan) return;
    setSettingsExpanded(false);
    setResultAnimateIn(true);
    const t = window.setTimeout(() => revealResult(), 80);
    return () => window.clearTimeout(t);
  }, [plan, revealResult]);

  const onGenerate = useCallback(async () => {
    const gate = aiUsage.ensureCanCallAi();
    if (!gate.ok) {
      setError(gate.message);
      showError(gate.message);
      if (gate.code === 'QUOTA') aiUsage.onQuotaBlocked(gate.message);
      return;
    }

    onSavePrefs(partnerPrefs);
    setLoading(true);
    setError(null);
    setPlan(null);
    setResultAnimateIn(false);
    try {
      const result = await callDateItineraryAssistant(prompt, aiUsage);
      if (!result.ok) {
        setError(result.message);
        showError(result.message);
        if (result.code === 'QUOTA') aiUsage.onQuotaBlocked(result.message);
        return;
      }
      const nextPlan = result.data.plan;
      setPlan(nextPlan);
      const record = saveImportantDateAi(
        {
          event: snapshotImportantDateEvent(event),
          plan: nextPlan,
          settings: { budget, customBudget, style, partnerPrefs },
        },
        { isPro }
      );
      setPersistedRecord(record);
      showAiGenerated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '產生建議時發生錯誤，請再試一次。';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    prompt,
    partnerPrefs,
    onSavePrefs,
    aiUsage,
    showAiGenerated,
    showError,
    event,
    budget,
    customBudget,
    style,
    isPro,
  ]);

  const sheet = (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/40"
        aria-label="關閉"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500">
              ✨ AI 幫我安排
              <ProBadgeIfNeeded show={aiPro.showProBadge} feature="ai_in_app" />
            </p>
            <p className={`truncate text-[15px] font-bold ${lq.text}`}>
              {event.icon} {event.displayTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 active:bg-stone-100"
            aria-label="關閉面板"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
          {viewingCached ? (
            <p className={`mb-3 rounded-xl px-3 py-2 text-[12px] font-semibold leading-snug ${lq.cardSoft} ${lq.textSecondary}`}>
              已保留最近一次 AI 安排，查看不會扣除今日 AI 次數。
            </p>
          ) : null}

          {inResultMode ? (
            <>
              <div
                ref={resultRef}
                className={`ai-result-reveal mb-3 ${resultAnimateIn ? 'ai-result-enter' : ''} ${highlight ? 'ai-result-reveal--highlight' : ''}`}
                aria-live="polite"
              >
                <p className={`mb-2 flex items-center gap-1.5 ${lq.sectionTitleSm}`}>
                  ✨ 你的專屬一日行程
                </p>
                {isSavedImportantItineraryPlan(plan) ? (
                  <DateItineraryAiResult plan={plan} />
                ) : (
                  <ImportantDateAiResult plan={plan as ImportantDatePlan} />
                )}
              </div>

              <button
                type="button"
                onClick={() => setSettingsExpanded((v) => !v)}
                className={`mb-3 flex w-full min-h-[44px] items-center justify-between gap-2 rounded-2xl border border-rose-100/80 px-3.5 py-2.5 text-left ${lq.cardSoft}`}
                aria-expanded={settingsExpanded}
              >
                <span className={`text-[14px] font-bold ${lq.text}`}>規劃設定</span>
                <span className={`flex items-center gap-0.5 text-[12px] font-semibold ${lq.textMuted}`}>
                  {settingsExpanded ? (
                    <>
                      收合
                      <ChevronUp className="h-4 w-4" aria-hidden />
                    </>
                  ) : (
                    <>▲</>
                  )}
                </span>
              </button>

              {settingsExpanded ? (
                <SettingsFields
                  event={event}
                  budget={budget}
                  setBudget={setBudget}
                  customBudget={customBudget}
                  setCustomBudget={setCustomBudget}
                  style={style}
                  setStyle={setStyle}
                  partnerPrefs={partnerPrefs}
                  setPartnerPrefs={setPartnerPrefs}
                  loading={loading}
                />
              ) : null}
            </>
          ) : (
            <>
              <p className={`mb-3 text-[12px] ${lq.textSecondary}`}>
                選擇條件後由 AI 產生完整一日行程（下午→晚餐→晚間）。
              </p>
              <SettingsFields
                event={event}
                budget={budget}
                setBudget={setBudget}
                customBudget={customBudget}
                setCustomBudget={setCustomBudget}
                style={style}
                setStyle={setStyle}
                partnerPrefs={partnerPrefs}
                setPartnerPrefs={setPartnerPrefs}
                loading={loading}
              />
            </>
          )}

          {error ? (
            <div
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] leading-relaxed text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {!inResultMode ? <div ref={resultRef} className="h-0 overflow-hidden" aria-hidden /> : null}
        </div>

        <div className="shrink-0 border-t border-stone-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {inResultMode && persistedRecord ? (
            <AiRecordProActions
              recordId={importantDateRecordId(persistedRecord)}
              onShareCard={() => setShareOpen(true)}
              className="mb-3"
            />
          ) : null}
          <div className="mb-2 flex items-center justify-between gap-2">
            <AiUsageQuotaLabel />
            {!aiUsage.canUseAi && aiUsage.isLoggedIn && !aiUsage.isPro ? (
              <button
                type="button"
                onClick={() => aiUsage.onQuotaBlocked()}
                className="text-[11px] font-bold text-violet-600 underline-offset-2"
              >
                升級 Pro
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generateDisabled}
            aria-busy={loading}
            className={`flex min-h-[44px] w-full items-center justify-center gap-2 ${lq.btnPrimary} disabled:pointer-events-none disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                正在產生行程…
              </>
            ) : !aiUsage.isLoggedIn ? (
              '請先登入使用 AI'
            ) : !aiUsage.canUseAi ? (
              '今日 AI 次數已用完'
            ) : inResultMode ? (
              '✨ 重新產生行程'
            ) : (
              '✨ 產生 AI 一日行程'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const portal = (
    <>
      {sheet}
      {shareOpen && persistedRecord ? (
        <AiShareCardModal
          payload={buildImportantDateSharePayload(persistedRecord)}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );

  if (typeof document === 'undefined') return portal;
  return createPortal(portal, document.body);
}

function SettingsFields({
  event,
  budget,
  setBudget,
  customBudget,
  setCustomBudget,
  style,
  setStyle,
  partnerPrefs,
  setPartnerPrefs,
  loading,
}: {
  event: ImportantDateEvent;
  budget: AiBudgetChoice;
  setBudget: (v: AiBudgetChoice) => void;
  customBudget: string;
  setCustomBudget: (v: string) => void;
  style: AiStyleChoice;
  setStyle: (v: AiStyleChoice) => void;
  partnerPrefs: string;
  setPartnerPrefs: (v: string) => void;
  loading: boolean;
}) {
  return (
    <>
      <Field label="1. 重要日子類型">
        <p className={`text-[14px] font-semibold ${lq.text}`}>
          {event.icon} {event.typeLabel}
        </p>
      </Field>

      <Field label="2. 預算">
        <div className="flex flex-wrap gap-1.5">
          {AI_BUDGET_OPTIONS.map((o) => (
            <Chip key={o.id} active={budget === o.id} onClick={() => setBudget(o.id)} disabled={loading}>
              {o.label}
            </Chip>
          ))}
        </div>
        {budget === 'custom' ? (
          <input
            type="text"
            value={customBudget}
            onChange={(e) => setCustomBudget(e.target.value)}
            placeholder="例如：3000 元以內"
            className={`mt-2 w-full ${lq.input}`}
            disabled={loading}
          />
        ) : null}
      </Field>

      <Field label="3. 風格">
        <div className="flex flex-wrap gap-1.5">
          {AI_STYLE_OPTIONS.map((o) => (
            <Chip key={o.id} active={style === o.id} onClick={() => setStyle(o.id)} disabled={loading}>
              {o.emoji} {o.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="4. 對方喜好">
        <textarea
          value={partnerPrefs}
          onChange={(e) => setPartnerPrefs(e.target.value)}
          rows={3}
          placeholder="喜歡什麼、不喜歡什麼、最近想要什麼…"
          className={`w-full resize-none ${lq.input}`}
          disabled={loading}
        />
      </Field>

      <Field label="5. 禮物靈感（靜態參考）">
        <div className="space-y-2">
          {Object.values(STATIC_GIFT_IDEAS).map((g) => (
            <div key={g.title} className={`rounded-xl px-2.5 py-2 ${lq.cardSoft}`}>
              <p className="text-[12px] font-bold text-stone-700">
                {g.emoji} {g.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-stone-600">{g.items.join(' · ')}</p>
            </div>
          ))}
        </div>
      </Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[12px] font-bold text-stone-600">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  disabled,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
        active ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-200' : 'bg-stone-100 text-stone-600'
      }`}
    >
      {children}
    </button>
  );
}
