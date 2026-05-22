import { Cloud } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { getSyncStatus } from '../services/coupleSyncService';
import { useProFeature } from '../hooks/useProFeature';
import { ProBadgeIfNeeded } from './ProBadge';
import { lq } from '../theme';

export function CloudSyncSection() {
  const auth = useSupabaseAuth();
  const isOnline = useOnlineStatus();
  const { space, loading, isFullyBound } = useCoupleSpace();
  const { displayNames } = useLoveQuest();

  const syncPro = useProFeature('full_sync');

  const status = getSyncStatus({
    isOnline,
    supabaseConfigured: auth.configured,
    userId: auth.user?.id ?? null,
    userDisplayName: auth.user ? displayNames.me : null,
    coupleSpaceLoading: loading,
    space,
    isFullyBound,
  });

  const accentClass =
    status.phase === 'ready'
      ? 'bg-emerald-50/90 text-emerald-900 ring-emerald-100'
      : status.phase === 'not_logged_in' || status.phase === 'disabled'
        ? 'bg-stone-50 text-stone-700 ring-stone-100'
        : 'bg-amber-50/90 text-amber-950 ring-amber-100';

  return (
    <section className={`mb-4 p-4 ${lq.card}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Cloud className="h-5 w-5 text-rose-500" aria-hidden />
        <h2 className={lq.sectionTitleSm}>☁️ 雲端同步</h2>
        <ProBadgeIfNeeded show={syncPro.showProBadge} feature="full_sync" />
      </div>

      <div className={`rounded-xl px-3 py-2.5 ring-1 ${accentClass}`}>
        <p className="text-sm font-bold">{status.title}</p>
        <p className="mt-1 text-[12px] leading-relaxed opacity-90">{status.description}</p>
      </div>

      <dl className="mt-3 space-y-1.5 text-[12px]">
        <StatusRow label="網路" value={status.networkLabel} />
        <StatusRow label="帳號" value={status.accountLabel} />
        <StatusRow label="情侶空間" value={status.coupleSpaceLabel} />
        {status.memberCountLabel ? (
          <StatusRow label="成員" value={status.memberCountLabel} />
        ) : null}
      </dl>

      {status.phase === 'ready' ? (
        <p className="mt-2 text-[10px] text-stone-400">
          資料仍優先儲存於本機；雲端雙向同步將在下一階段接上。
        </p>
      ) : null}
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/60 px-2.5 py-1.5">
      <dt className="font-semibold text-stone-500">{label}</dt>
      <dd className="font-bold text-stone-800">{value}</dd>
    </div>
  );
}
