import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  AI_BUDGET_OPTIONS,
  AI_STYLE_OPTIONS,
  STATIC_GIFT_IDEAS,
  buildImportantDateAiPrompt,
  type AiBudgetChoice,
  type AiPromptInput,
  type AiStyleChoice,
} from '../lib/importantDateAiPrompt';
import { postCoupleAssistant } from '../lib/coupleAssistantApi';
import type { ImportantDateEvent } from '../lib/importantDateEvents';
import { useProFeature } from '../hooks/useProFeature';
import { useUserPlan } from '../context/UserPlanContext';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

type Props = {
  event: ImportantDateEvent;
  initialPrefs: string;
  onClose: () => void;
  onSavePrefs: (prefs: string) => void;
};

export function ImportantDateAiSheet({ event, initialPrefs, onClose, onSavePrefs }: Props) {
  const aiPro = useProFeature('ai_in_app');
  const { isPro } = useUserPlan();
  const [budget, setBudget] = useState<AiBudgetChoice>('mid');
  const [customBudget, setCustomBudget] = useState('');
  const [style, setStyle] = useState<AiStyleChoice>('romantic');
  const [partnerPrefs, setPartnerPrefs] = useState(initialPrefs);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(() => {
    const input: AiPromptInput = { event, budget, customBudget, style, partnerPrefs };
    return buildImportantDateAiPrompt(input);
  }, [event, budget, customBudget, style, partnerPrefs]);

  const onGenerate = useCallback(async () => {
    onSavePrefs(partnerPrefs);
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const result = await postCoupleAssistant('important-date', prompt, isPro ? 'pro' : 'free');
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAnswer(result.data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : '產生建議時發生錯誤，請再試一次。');
    } finally {
      setLoading(false);
    }
  }, [prompt, partnerPrefs, onSavePrefs, isPro]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 p-0" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="關閉" onClick={onClose} />
      <div className="relative z-10 max-h-[88vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500">
              ✨ AI 幫我安排
              <ProBadgeIfNeeded show={aiPro.showProBadge} feature="ai_in_app" />
            </p>
            <p className={`truncate text-[15px] font-bold ${lq.text}`}>
              {event.icon} {event.displayTitle}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 active:bg-stone-100" aria-label="關閉面板">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6 pt-3">
          <p className={`mb-3 text-[12px] ${lq.textSecondary}`}>
            選擇條件後由 AI 直接產生約會與驚喜建議（需本機助理服務運行中）。
          </p>

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
                className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2 text-[14px] outline-none focus:border-rose-300"
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
              className="w-full resize-none rounded-xl border border-stone-200 px-3 py-2.5 text-[14px] outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
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

          {error ? (
            <div
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] leading-relaxed text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {answer ? (
            <Field label="AI 安排建議">
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-[12px] leading-relaxed text-stone-800">
                {answer}
              </div>
            </Field>
          ) : null}

          <button
            type="button"
            onClick={() => void onGenerate()}
            disabled={loading}
            className={`mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 ${lq.btnPrimary} disabled:opacity-60`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                正在產生建議…
              </>
            ) : (
              '✨ 產生 AI 建議'
            )}
          </button>
        </div>
      </div>
    </div>
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
