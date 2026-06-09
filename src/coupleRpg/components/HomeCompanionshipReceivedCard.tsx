import { useEffect } from 'react';
import { useCompanionship } from '../context/CompanionshipContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatCompanionshipTimeAgo } from '../lib/companionshipTime';
import { companionshipReceivedHeadline, companionshipTypeIcon } from '../data/companionshipPresets';
import { lq } from '../theme';

/** 首頁：收到對方陪伴卡 */
export function HomeCompanionshipReceivedCard() {
  const { latestUnseen, markSeen } = useCompanionship();
  const { displayNameForUser } = useLoveQuest();

  useEffect(() => {
    if (!latestUnseen) return;
    const t = window.setTimeout(() => markSeen(latestUnseen.id), 2500);
    return () => window.clearTimeout(t);
  }, [latestUnseen, markSeen]);

  if (!latestUnseen) return null;

  const senderName = displayNameForUser(latestUnseen.senderUserId);
  const presetIcon = companionshipTypeIcon(latestUnseen.type);

  return (
    <section
      className="lq-companionship-received lq-home-section-in lq-home-elev relative overflow-hidden rounded-[22px] px-4 py-4 ring-1 ring-rose-200/45"
      aria-label="對方陪伴了你一下"
    >
      <div className="lq-companionship-received-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10">
        <p className="text-[13px] font-bold text-rose-500">
          {companionshipReceivedHeadline(latestUnseen.type)}
        </p>
        <div className="mt-2 flex items-start gap-3">
          <span className="lq-companionship-received-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[22px] shadow-sm">
            {presetIcon}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[15px] font-extrabold ${lq.text}`}>{senderName}</p>
            <p className={`mt-1 text-[15px] font-semibold leading-snug text-rose-700`}>
              「{latestUnseen.message}」
            </p>
            <p className={`mt-1.5 text-[12px] font-semibold ${lq.textSecondary}`}>
              {formatCompanionshipTimeAgo(latestUnseen.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
