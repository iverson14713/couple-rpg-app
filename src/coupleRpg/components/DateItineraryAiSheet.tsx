import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, X } from 'lucide-react';
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
import { useAiToast } from '../context/AiToastContext';
import { useAiResultReveal } from '../hooks/useAiResultReveal';
import { useAiUsage } from '../hooks/useAiUsage';
import { useProFeature } from '../hooks/useProFeature';
import { AiUsageQuotaLabel } from './AiUsageQuotaLabel';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

type Props = {
  suggestion: DateSuggestion;
  onClose: () => void;
};

export function DateItineraryAiSheet({ suggestion, onClose }: Props) {
  const aiPro = useProFeature('ai_in_app');
  const aiUsage = useAiUsage();
  const { showAiGenerated, showError } = useAiToast();
  const { scrollRef, resultRef, highlight, revealResult } = useAiResultReveal();
  const [departure, setDeparture] = useState('');
  const [budget, setBudget] = useState<DateAiBudgetChoice>(() => costToDefaultBudget(suggestion.cost));
  const [customBudget, setCustomBudget] = useState('');
  const [transport, setTransport] = useState<DateAiTransportChoice>('transit');
  const [style, setStyle] = useState<DateAiStyleChoice>('romantic');
  const [partnerPrefs, setPartnerPrefs] = useState('');
  const [plan, setPlan] = useState<DateItineraryPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagLabels = useMemo(() => tagLabelsForSuggestion(suggestion.tags), [suggestion.tags]);
  const preview = useMemo(() => getDateItineraryPreview(suggestion), [suggestion]);

  const generateDisabled = loading || !aiUsage.canUseAi;

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
      setPlan(result.data.plan);
      showAiGenerated();
      revealResult();
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
    revealResult,
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
          <p className={`mb-3 text-[13px] leading-relaxed ${lq.textSecondary}`}>
            依目前抽到的約會點子，由 AI 直接產生完整行程建議。
          </p>

          <section className={`mb-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-3.5`}>
            <p className="mb-2 text-[12px] font-bold text-rose-600">目前約會點子</p>
            <p className="text-[16px] font-extrabold text-stone-900">{suggestion.title}</p>
            {tagLabels.length > 0 ? (
              <p className="mt-1.5 text-[13px] font-semibold text-rose-700">{tagLabels.join(' · ')}</p>
            ) : null}
            <p className="mt-2 text-[13px] text-stone-600">
              💰 {COST_LABEL[suggestion.cost]} · ⏱ {DURATION_LABEL[suggestion.duration]}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-700">{suggestion.description}</p>
          </section>

          <Field label="1. 出發地（可選填）">
            <input
              type="text"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              placeholder="例如：台北車站、家附近"
              className="w-full rounded-xl border border-stone-200 px-3 py-3 text-[15px] outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
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
                className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-[15px] outline-none focus:border-rose-300"
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
              className="w-full resize-none rounded-xl border border-stone-200 px-3 py-3 text-[15px] outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
              disabled={loading}
            />
          </Field>

          <Field label="規劃方向預覽（靜態參考）">
            <div className={`space-y-2 rounded-2xl p-3 ${lq.cardSoft}`}>
              <PreviewRow label="上午" text={preview.morning} />
              <PreviewRow label="中午" text={preview.noon} />
              <PreviewRow label="下午" text={preview.afternoon} />
              <PreviewRow label="傍晚" text={preview.evening} />
              <PreviewRow label="小驚喜" text={preview.surprise} highlight />
            </div>
            <p className="mt-2 text-[11px] text-stone-500">以上為方向預覽；詳細行程請用下方按鈕由 AI 產生。</p>
          </Field>

          {error ? (
            <div
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div
            ref={resultRef}
            className={`ai-result-reveal ${highlight ? 'ai-result-reveal--highlight' : ''}`}
          >
            {plan ? <DateItineraryAiResult plan={plan} /> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-stone-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
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

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
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
    <p className={`text-[13px] leading-relaxed ${highlight ? 'font-semibold text-rose-800' : 'text-stone-700'}`}>
      <span className="font-bold text-stone-800">{label}：</span>
      {text}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <p className="mb-2 text-[13px] font-bold text-stone-700">{label}</p>
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
