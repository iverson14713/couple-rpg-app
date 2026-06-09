import { useState } from 'react';
import { useCompanionship } from '../context/CompanionshipContext';
import { CompanionshipSheet } from './CompanionshipSheet';

/** 首頁：陪伴一下入口 + 今日統計 */
export function HomeCompanionshipEntryCard() {
  const { stats, canUseCompanionship, bindHint, freeSendsRemaining } = useCompanionship();
  const [open, setOpen] = useState(false);

  const subtitle =
    freeSendsRemaining !== null && canUseCompanionship
      ? `今天還可送 ${freeSendsRemaining} 次`
      : canUseCompanionship
        ? '輕鬆傳遞陪伴感'
        : (bindHint ?? '綁定後即可使用');

  return (
    <>
      <section
        className="lq-companionship-entry lq-home-section-in lq-home-elev relative overflow-hidden rounded-[20px] px-3.5 py-3 ring-1 ring-white/80"
        aria-label="陪伴一下"
      >
        <div className="lq-companionship-entry-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-extrabold tracking-tight text-[#3d3539]">💗 陪伴一下</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-[#b07a8f]">{subtitle}</p>
            {stats.todayCount > 0 ? (
              <p className="mt-1 text-[10px] font-semibold text-[#c4a0ad]">
                今天互相陪伴 {stats.todayCount} 次
                {stats.streakDays > 1 ? ` · 連續 ${stats.streakDays} 天` : ''}
              </p>
            ) : stats.streakDays > 1 ? (
              <p className="mt-1 text-[10px] font-semibold text-[#c4a0ad]">
                連續陪伴 {stats.streakDays} 天
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lq-companionship-entry-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[17px] transition active:scale-95"
            aria-label={canUseCompanionship ? '送陪伴' : '看看陪伴功能'}
          >
            ❤️
          </button>
        </div>
      </section>

      <CompanionshipSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
