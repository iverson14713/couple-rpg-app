import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Loader2, Sparkles, X } from 'lucide-react';
import {
  COST_LABEL,
  DURATION_LABEL,
} from '../data/dateIdeasPool';
import {
  DATE_AI_BUDGET_OPTIONS,
  DATE_AI_STYLE_OPTIONS,
  DATE_AI_TRANSPORT_OPTIONS,
  buildDateItineraryAiPrompt,
  costToDefaultBudget,
  getDateItineraryPreview,
  tagLabelsForSuggestion,
  type DateAiBudgetChoice,
  type DateAiStyleChoice,
  type DateAiTransportChoice,
} from '../lib/dateItineraryAiPrompt';
import { callDateItineraryAssistant } from '../lib/callCoupleAssistant';
import type { DateItineraryPlan } from '../lib/dateItineraryAiModel';
import { DateItineraryAiResult } from './DateItineraryAiResult';
import type { DateSuggestion } from '../storage/dateTypes';
import {
  loadLastDateItineraryAi,
  saveLastDateItineraryAi,
  savedSuggestionToDateSuggestion,
  snapshotDateSuggestion,
  type SavedDateItineraryAi,
  type SavedDateItinerarySettings,
} from '../storage/dateItineraryAiCache';
import { useAiToast } from '../context/AiToastContext';
import { useAiResultReveal } from '../hooks/useAiResultReveal';
import { useAiUsage } from '../hooks/useAiUsage';
import { useProFeature } from '../hooks/useProFeature';
import { useUserPlan } from '../context/UserPlanContext';
import { buildDateItinerarySharePayload } from '../lib/aiShareCardContent';
import { dateItineraryRecordId } from '../lib/aiRecordIds';
import { AiRecordProActions } from './AiRecordProActions';
import { AiShareCardModal } from './AiShareCardModal';
import { AiUsageQuotaLabel } from './AiUsageQuotaLabel';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

type Props = {
  suggestion: DateSuggestion;
  onClose: () => void;
  /** 從「最近 AI 約會行程」開啟：直接顯示已存結果，不扣次 */
  savedRecord?: SavedDateItineraryAi | null;
};

function resolveInitialSheetState(
  suggestionProp: DateSuggestion,
  savedRecord?: SavedDateItineraryAi | null
): {
  suggestion: DateSuggestion;
  plan: DateItineraryPlan | null;
  settings: SavedDateItinerarySettings | null;
  fromCache: boolean;
} {
  if (savedRecord) {
    return {
      suggestion: savedSuggestionToDateSuggestion(savedRecord.suggestion),
      plan: savedRecord.plan,
      settings: savedRecord.settings,
      fromCache: true,
    };
  }
  const last = loadLastDateItineraryAi();
  if (last && last.suggestion.id === suggestionProp.id) {
    return {
      suggestion: suggestionProp,
      plan: last.plan,
      settings: last.settings,
      fromCache: true,
    };
  }
  return {
    suggestion: suggestionProp,
    plan: null,
    settings: null,
    fromCache: false,
  };
}

export function DateItineraryAiSheet({ suggestion: suggestionProp, onClose, savedRecord }: Props) {
  const initial = useMemo(
    () => resolveInitialSheetState(suggestionProp, savedRecord),
    [suggestionProp, savedRecord]
  );
  const suggestion = initial.suggestion;

  const aiPro = useProFeature('ai_in_app');
  const { isPro } = useUserPlan();
  const aiUsage = useAiUsage();
  const { showAiGenerated, showError } = useAiToast();
  const { scrollRef, resultRef, highlight, revealResult } = useAiResultReveal();
  const [departure, setDeparture] = useState(initial.settings?.departure ?? '');
  const [budget, setBudget] = useState<DateAiBudgetChoice>(
    () => initial.settings?.budget ?? costToDefaultBudget(suggestion.cost)
  );
  const [customBudget, setCustomBudget] = useState(initial.settings?.customBudget ?? '');
  const [transport, setTransport] = useState<DateAiTransportChoice>(
    initial.settings?.transport ?? 'transit'
  );
  const [style, setStyle] = useState<DateAiStyleChoice>(initial.settings?.style ?? 'romantic');
  const [partnerPrefs, setPartnerPrefs] = useState(initial.settings?.partnerPrefs ?? '');
  const [plan, setPlan] = useState<DateItineraryPlan | null>(initial.plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(!initial.plan);
  const [resultAnimateIn, setResultAnimateIn] = useState(!!initial.plan);
  const [persistedRecord, setPersistedRecord] = useState<SavedDateItineraryAi | null>(() => {
    if (savedRecord) return savedRecord;
    if (initial.plan) {
      const last = loadLastDateItineraryAi();
      if (last && last.suggestion.id === suggestionProp.id) return last;
    }
    return null;
  });
  const [shareOpen, setShareOpen] = useState(false);
  const viewingCached = initial.fromCache && plan !== null;

  const tagLabels = useMemo(() => tagLabelsForSuggestion(suggestion.tags), [suggestion.tags]);
  const preview = useMemo(() => getDateItineraryPreview(suggestion), [suggestion]);
  const inResultMode = plan !== null;

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

  const handleGenerate = useCallback(async () => {
    const gate = aiUsage.ensureCanCallAi();
    if (!gate.ok) {
      setError(gate.message);
      showError(gate.message);
      if (gate.code === 'QUOTA') aiUsage.onQuotaBlocked(gate.message);
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);
    setResultAnimateIn(false);
    try {
      const prompt = buildDateItineraryAiPrompt({
        suggestion,
        departure,
        budget,
        customBudget,
        transport,
        style,
        partnerPrefs,
      });
      const result = await callDateItineraryAssistant(prompt, aiUsage);
      if (!result.ok) {
        setError(result.message);
        showError(result.message);
        if (result.code === 'QUOTA') aiUsage.onQuotaBlocked(result.message);
        return;
      }
      const nextPlan = result.data.plan;
      setPlan(nextPlan);
      const record = saveLastDateItineraryAi(
        {
          suggestion: snapshotDateSuggestion(suggestion),
          plan: nextPlan,
          settings: { departure, budget, customBudget, transport, style, partnerPrefs },
        },
        { isPro }
      );
      setPersistedRecord(record);
      showAiGenerated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '產生行程時發生錯誤，請再試一次。';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    suggestion,
    departure,
    budget,
    customBudget,
    transport,
    style,
    partnerPrefs,
    aiUsage,
    showAiGenerated,
    showError,
    isPro,
  ]);

  const sheet = (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/45"
        aria-label="關閉"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-rose-50 px-4 py-3.5">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-rose-500">
              <Sparkles className="h-4 w-4" aria-hidden />
              AI 約會行程規劃
              <ProBadgeIfNeeded show={aiPro.showProBadge} feature="ai_in_app" />
            </p>
            <p className={`mt-0.5 truncate text-[17px] font-extrabold ${lq.text}`}>
              {suggestion.emoji} {suggestion.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 active:bg-stone-100"
            aria-label="關閉面板"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
          {viewingCached ? (
            <p className={`mb-3 rounded-xl px-3 py-2 text-[12px] font-semibold leading-snug ${lq.cardSoft} ${lq.textSecondary}`}>
              已保留最近一次 AI 行程，查看不會扣除今日 AI 次數。
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
                  <Sparkles className="h-4 w-4 text-rose-500" aria-hidden />
                  你的專屬約會行程
                </p>
                <DateItineraryAiResult plan={plan} animateIn={resultAnimateIn} />
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
                    <>
                      ▲
                    </>
                  )}
                </span>
              </button>

              {settingsExpanded ? (
                <PlanningSettingsForm
                  suggestion={suggestion}
                  tagLabels={tagLabels}
                  preview={preview}
                  departure={departure}
                  setDeparture={setDeparture}
                  budget={budget}
                  setBudget={setBudget}
                  customBudget={customBudget}
                  setCustomBudget={setCustomBudget}
                  transport={transport}
                  setTransport={setTransport}
                  style={style}
                  setStyle={setStyle}
                  partnerPrefs={partnerPrefs}
                  setPartnerPrefs={setPartnerPrefs}
                  loading={loading}
                  compactSuggestion
                  showPreview={false}
                />
              ) : null}
            </>
          ) : (
            <>
              <p className={`mb-3 text-[13px] leading-relaxed ${lq.textSecondary}`}>
                依目前抽到的約會點子，由 AI 直接產生完整行程建議。
              </p>
              <PlanningSettingsForm
                suggestion={suggestion}
                tagLabels={tagLabels}
                preview={preview}
                departure={departure}
                setDeparture={setDeparture}
                budget={budget}
                setBudget={setBudget}
                customBudget={customBudget}
                setCustomBudget={setCustomBudget}
                transport={transport}
                setTransport={setTransport}
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
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-red-800"
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
              recordId={dateItineraryRecordId(persistedRecord)}
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
            onClick={handleGenerate}
            disabled={generateDisabled}
            aria-busy={loading}
            className={`flex min-h-[48px] w-full items-center justify-center gap-2 ${lq.btnPrimary} disabled:pointer-events-none disabled:opacity-50`}
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
              '✨ 產生約會行程'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mt-2 min-h-[44px] w-full text-[14px] font-semibold text-stone-500 disabled:opacity-50"
          >
            關閉
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
          payload={buildDateItinerarySharePayload(persistedRecord)}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );

  if (typeof document === 'undefined') return portal;
  return createPortal(portal, document.body);
}

type PlanningSettingsFormProps = {
  suggestion: DateSuggestion;
  tagLabels: string[];
  preview: ReturnType<typeof getDateItineraryPreview>;
  departure: string;
  setDeparture: (v: string) => void;
  budget: DateAiBudgetChoice;
  setBudget: (v: DateAiBudgetChoice) => void;
  customBudget: string;
  setCustomBudget: (v: string) => void;
  transport: DateAiTransportChoice;
  setTransport: (v: DateAiTransportChoice) => void;
  style: DateAiStyleChoice;
  setStyle: (v: DateAiStyleChoice) => void;
  partnerPrefs: string;
  setPartnerPrefs: (v: string) => void;
  loading: boolean;
  compactSuggestion?: boolean;
  showPreview?: boolean;
};

function PlanningSettingsForm({
  suggestion,
  tagLabels,
  preview,
  departure,
  setDeparture,
  budget,
  setBudget,
  customBudget,
  setCustomBudget,
  transport,
  setTransport,
  style,
  setStyle,
  partnerPrefs,
  setPartnerPrefs,
  loading,
  compactSuggestion = false,
  showPreview = true,
}: PlanningSettingsFormProps) {
  return (
    <>
      <section
        className={`mb-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-3.5 ${compactSuggestion ? '!mb-3 !p-2.5' : ''}`}
      >
        <p className="mb-2 text-[12px] font-bold text-rose-600">目前約會點子</p>
        <p className={`font-extrabold ${compactSuggestion ? 'text-[14px]' : 'text-[16px]'} ${lq.text}`}>
          {suggestion.title}
        </p>
        {!compactSuggestion && tagLabels.length > 0 ? (
          <p className="mt-1.5 text-[13px] font-semibold text-rose-700">{tagLabels.join(' · ')}</p>
        ) : null}
        {!compactSuggestion ? (
          <>
            <p className={`mt-2 text-[13px] ${lq.textSecondary}`}>
              💰 {COST_LABEL[suggestion.cost]} · ⏱ {DURATION_LABEL[suggestion.duration]}
            </p>
            <p className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>{suggestion.description}</p>
          </>
        ) : null}
      </section>

      <Field label="1. 出發地（可選填）">
        <input
          type="text"
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
          placeholder="例如：台北車站、家附近"
          className={`w-full ${lq.input}`}
          disabled={loading}
        />
      </Field>

      <Field label="2. 預算">
        <div className="flex flex-wrap gap-2">
          {DATE_AI_BUDGET_OPTIONS.map((o) => (
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
            placeholder="例如：2000 元以內"
            className={`mt-2 w-full ${lq.input}`}
            disabled={loading}
          />
        ) : null}
      </Field>

      <Field label="3. 交通方式">
        <div className="flex flex-wrap gap-2">
          {DATE_AI_TRANSPORT_OPTIONS.map((o) => (
            <Chip key={o.id} active={transport === o.id} onClick={() => setTransport(o.id)} disabled={loading}>
              {o.emoji} {o.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="4. 想要風格">
        <div className="flex flex-wrap gap-2">
          {DATE_AI_STYLE_OPTIONS.map((o) => (
            <Chip key={o.id} active={style === o.id} onClick={() => setStyle(o.id)} disabled={loading}>
              {o.emoji} {o.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="5. 對方喜好（可選填）">
        <textarea
          value={partnerPrefs}
          onChange={(e) => setPartnerPrefs(e.target.value)}
          rows={3}
          placeholder="喜歡什麼、怕累、不吃什麼、最近想做的事…"
          className={`w-full resize-none ${lq.input}`}
          disabled={loading}
        />
      </Field>

      {showPreview ? (
        <Field label="規劃方向預覽（靜態參考）">
          <div className={`space-y-2 rounded-2xl p-3 ${lq.cardSoft}`}>
            <PreviewRow label="上午" text={preview.morning} />
            <PreviewRow label="中午" text={preview.noon} />
            <PreviewRow label="下午" text={preview.afternoon} />
            <PreviewRow label="傍晚" text={preview.evening} />
            <PreviewRow label="小驚喜" text={preview.surprise} highlight />
          </div>
          <p className={`mt-2 text-[11px] ${lq.textMuted}`}>以上為方向預覽；詳細行程請用下方按鈕由 AI 產生。</p>
        </Field>
      ) : null}
    </>
  );
}

function PreviewRow({
  label,
  text,
  highlight,
}: {
  label: string;
  text: string;
  highlight?: boolean;
}) {
  if (text === '—') return null;
  return (
    <p className={`text-[13px] leading-relaxed ${highlight ? 'font-semibold text-rose-800' : lq.textSecondary}`}>
      <span className={`font-bold ${lq.text}`}>{label}：</span>
      {text}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <p className={`mb-2 text-[13px] font-bold ${lq.text}`}>{label}</p>
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
      className={`min-h-[40px] rounded-full px-3.5 py-2 text-[13px] font-bold transition active:scale-[0.98] disabled:opacity-50 ${
        active ? 'bg-rose-100 text-rose-800 ring-2 ring-rose-200' : 'bg-stone-100 text-stone-600'
      }`}
    >
      {children}
    </button>
  );
}
