import { useCallback, useState, type ReactNode } from 'react';
import { ChevronDown, Copy, PenLine, RefreshCw } from 'lucide-react';
import {
  getTodayPartnerMessage,
  loadDailyMessageExpanded,
  saveCustomTodayMessage,
  saveDailyMessageExpanded,
  shuffleTodayMessage,
  type DailyMessageRecord,
} from '../storage/dailyMessageStore';
import { lq } from '../theme';

export function DailyPartnerMessageCard() {
  const [record, setRecord] = useState<DailyMessageRecord>(() => getTodayPartnerMessage());
  const [expanded, setExpanded] = useState(() => loadDailyMessageExpanded());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [copyOk, setCopyOk] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      saveDailyMessageExpanded(next);
      if (!next) setEditing(false);
      return next;
    });
  }, []);

  const onShuffle = useCallback(() => {
    setRecord(shuffleTodayMessage());
    setEditing(false);
  }, []);

  const onStartEdit = useCallback(() => {
    setDraft(record.text);
    setEditing(true);
    setExpanded(true);
    saveDailyMessageExpanded(true);
  }, [record.text]);

  const onSaveCustom = useCallback(() => {
    const saved = saveCustomTodayMessage(draft);
    if (saved) {
      setRecord(saved);
      setEditing(false);
    }
  }, [draft]);

  const onCopy = useCallback(async () => {
    const text = record.text;
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      window.setTimeout(() => setCopyOk(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyOk(true);
      window.setTimeout(() => setCopyOk(false), 2000);
    }
  }, [record.text]);

  return (
    <section className={`mb-2 overflow-hidden ${lq.card}`}>
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex min-h-[52px] w-full items-center gap-2 px-3 py-2.5 text-left active:bg-stone-50/80"
        aria-expanded={expanded}
      >
        <span className={`shrink-0 text-[14px] font-bold ${lq.text}`}>💬 今天想對你說</span>
        <span className={`min-w-0 flex-1 truncate text-[13px] ${lq.textSecondary}`}>{record.text}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="border-t border-stone-100 px-3 pb-3 pt-2">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="寫一句想對伴侶說的話…"
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[15px] leading-snug text-[#2B2B2B] outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
              />
              <div className="flex gap-2">
                <button type="button" onClick={onSaveCustom} className={`flex-1 ${lq.btnPrimary}`}>
                  💾 儲存
                </button>
                <button type="button" onClick={() => setEditing(false)} className={`flex-1 ${lq.btnSecondary}`}>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="rounded-lg bg-rose-50/50 px-2.5 py-2 text-[15px] font-medium leading-relaxed text-[#2B2B2B]">
                {record.text}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <MessageActionBtn icon={<RefreshCw className="h-3.5 w-3.5" />} label="🔄 換一句" onClick={onShuffle} />
                <MessageActionBtn icon={<PenLine className="h-3.5 w-3.5" />} label="✍️ 自己寫" onClick={onStartEdit} />
                <MessageActionBtn
                  icon={<Copy className="h-3.5 w-3.5" />}
                  label={copyOk ? '✓ 已複製' : '📋 複製'}
                  onClick={() => void onCopy()}
                />
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function MessageActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-stone-700 shadow-sm active:scale-[0.98]"
    >
      {icon}
      {label}
    </button>
  );
}
