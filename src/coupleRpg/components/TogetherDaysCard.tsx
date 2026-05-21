import { Heart } from 'lucide-react';
import type { TogetherDaysInfo } from '../lib/relationshipDays';
import { lq } from '../theme';

type Props = {
  info: TogetherDaysInfo;
  onGoSettings?: () => void;
};

export function TogetherDaysCard({ info, onGoSettings }: Props) {
  if (info.kind === 'none' || info.kind === 'invalid') return null;

  if (info.kind === 'future') {
    return (
      <section className={`mb-2 flex items-center gap-2.5 rounded-xl border border-stone-200/70 bg-gradient-to-r from-rose-50/50 to-white px-3 py-2 ${lq.card}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-lg ring-1 ring-stone-200/60" aria-hidden>
          💕
        </span>
        <p className={`text-[13px] font-medium ${lq.textSecondary}`}>在一起紀念日尚未開始</p>
      </section>
    );
  }

  return (
    <section className={`mb-2 flex items-center gap-3 rounded-xl border border-stone-200/70 bg-gradient-to-r from-rose-50/60 via-white to-stone-50/80 px-3 py-2.5 ${lq.card}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200/60" aria-hidden>
        <Heart className="h-5 w-5 text-rose-400" fill="currentColor" strokeWidth={0} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[18px] font-bold leading-tight ${lq.text}`}>
          我們已經在一起 <span className={lq.accent}>{info.days}</span> 天
        </p>
        {info.milestoneHint ? (
          <p className={`mt-0.5 text-[12px] font-medium ${lq.textSecondary}`}>{info.milestoneHint}</p>
        ) : null}
      </div>
      {onGoSettings ? (
        <button
          type="button"
          onClick={onGoSettings}
          className={`shrink-0 text-[11px] font-semibold ${lq.accent}`}
        >
          編輯
        </button>
      ) : null}
    </section>
  );
}
