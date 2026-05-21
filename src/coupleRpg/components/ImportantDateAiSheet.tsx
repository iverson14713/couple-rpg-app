import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  AI_BUDGET_OPTIONS,
  AI_STYLE_OPTIONS,
  STATIC_GIFT_IDEAS,
  buildImportantDateAiPrompt,
  type AiBudgetChoice,
  type AiPromptInput,
  type AiStyleChoice,
} from '../lib/importantDateAiPrompt';
import type { ImportantDateEvent } from '../lib/importantDateEvents';
import { lq } from '../theme';

type Props = {
  event: ImportantDateEvent;
  initialPrefs: string;
  onClose: () => void;
  onSavePrefs: (prefs: string) => void;
};

export function ImportantDateAiSheet({ event, initialPrefs, onClose, onSavePrefs }: Props) {
  const [budget, setBudget] = useState<AiBudgetChoice>('mid');
  const [customBudget, setCustomBudget] = useState('');
  const [style, setStyle] = useState<AiStyleChoice>('romantic');
  const [partnerPrefs, setPartnerPrefs] = useState(initialPrefs);
  const [copyOk, setCopyOk] = useState(false);

  const prompt = useMemo(() => {
    const input: AiPromptInput = { event, budget, customBudget, style, partnerPrefs };
    return buildImportantDateAiPrompt(input);
  }, [event, budget, customBudget, style, partnerPrefs]);

  const onCopy = useCallback(async () => {
    onSavePrefs(partnerPrefs);
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopyOk(true);
    window.setTimeout(() => setCopyOk(false), 2200);
  }, [prompt, partnerPrefs, onSavePrefs]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 p-0" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="關閉" onClick={onClose} />
      <div className="relative max-h-[88vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-rose-500">✨ AI 幫我安排</p>
            <p className={`truncate text-[15px] font-bold ${lq.text}`}>
              {event.icon} {event.displayTitle}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 active:bg-stone-100" aria-label="關閉面板">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6 pt-3">
          <p className={`mb-3 text-[12px] ${lq.textSecondary}`}>選擇條件後產生 Prompt，複製到 ChatGPT 使用（尚未接 API）。</p>

          <Field label="1. 重要日子類型">
            <p className={`text-[14px] font-semibold ${lq.text}`}>
              {event.icon} {event.typeLabel}
            </p>
          </Field>

          <Field label="2. 預算">
            <div className="flex flex-wrap gap-1.5">
              {AI_BUDGET_OPTIONS.map((o) => (
                <Chip key={o.id} active={budget === o.id} onClick={() => setBudget(o.id)}>
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
              />
            ) : null}
          </Field>

          <Field label="3. 風格">
            <div className="flex flex-wrap gap-1.5">
              {AI_STYLE_OPTIONS.map((o) => (
                <Chip key={o.id} active={style === o.id} onClick={() => setStyle(o.id)}>
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

          <Field label="6. 產生的 AI Prompt">
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-800">
              {prompt}
            </pre>
          </Field>

          <button type="button" onClick={() => void onCopy()} className={`mt-2 w-full ${lq.btnPrimary}`}>
            {copyOk ? '✓ 已複製' : '📋 複製 Prompt'}
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
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition active:scale-[0.98] ${
        active ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-200' : 'bg-stone-100 text-stone-600'
      }`}
    >
      {children}
    </button>
  );
}
