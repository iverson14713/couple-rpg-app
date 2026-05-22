import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Cloud, Coins, Gift, RefreshCw, Ticket, Wallet } from 'lucide-react';
import { COMPLETED_REWARD_CARD_RETENTION_DAYS } from '../constants/rewardCardRetention';
import { REWARD_CATEGORY_LABEL, REWARD_SHOP_ITEMS } from '../data/rewardShopCatalog';
import { EmptyState } from '../components/EmptyState';
import { CustomRewardCardPanel } from '../components/CustomRewardCardPanel';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { useProFeature } from '../hooks/useProFeature';
import { NicknameSetupBanner } from '../components/NicknameSetupBanner';
import { PageHero } from '../components/ui';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useToast } from '../../context/ToastContext';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  canOwnerCancelUseRewardCard,
  canOwnerCompleteRewardCard,
  canOwnerUseRewardCard,
  REWARD_CARD_STATUS_LABEL,
} from '../lib/rewardCardHelpers';
import { couponActorIds } from '../lib/rewardCardModel';
import type { OwnedCoupon, RewardShopCategory } from '../storage/rewardTypes';
import { lq } from '../theme';

type Tab = 'wallet' | 'shop' | 'coupons';

const TAB_META: Record<
  Tab,
  { label: string; icon: typeof Wallet; hint: string; gradient: string }
> = {
  wallet: {
    label: '錢包',
    icon: Wallet,
    hint: '愛心幣與獲得紀錄',
    gradient: 'from-rose-100 via-pink-50 to-amber-50',
  },
  shop: {
    label: '商城',
    icon: Gift,
    hint: '兌換情侶卡券',
    gradient: 'from-violet-100 via-rose-50 to-pink-50',
  },
  coupons: {
    label: '卡券',
    icon: Ticket,
    hint: '我的卡券',
    gradient: 'from-emerald-100 via-teal-50 to-rose-50',
  },
};

export function RewardsPage({ embedded }: { embedded?: boolean } = {}) {
  const auth = useSupabaseAuth();
  const currentUserId = auth.user?.id ?? null;
  const { showToast } = useToast();

  const {
    rpg,
    rpgView,
    todayCoinEarned,
    recentCoinEarns,
    weeklyTitles,
    displayNameForUser,
    redeemRewardItem,
    redeemCustomRewardItem,
    useCoupon,
    cancelRewardCardUse,
    completeRewardCard,
    redeemedCoupons,
    inProgressCoupons,
    completedCouponsSorted,
    rewardCardSyncStatus,
    rewardCardSyncError,
    highlightCouponId,
    clearHighlightCoupon,
    pullRewardCardsFromCloud,
    syncRewardCards,
    cleanupOldCompletedRewardCards,
  } = useLoveQuest();

  const [tab, setTab] = useState<Tab>('wallet');
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [syncingManual, setSyncingManual] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);
  const highlightHandledRef = useRef<string | null>(null);
  const syncPro = useProFeature('full_sync');
  const customCardPro = useProFeature('custom_reward_cards');

  useEffect(() => {
    if (tab === 'coupons') {
      void pullRewardCardsFromCloud();
    }
  }, [tab, pullRewardCardsFromCloud]);

  useEffect(() => {
    if (tab !== 'coupons' || !highlightCouponId) return;
    if (highlightHandledRef.current === highlightCouponId) return;

    const inList =
      redeemedCoupons.some((c) => c.id === highlightCouponId) ||
      inProgressCoupons.some((c) => c.id === highlightCouponId) ||
      completedCouponsSorted.some((c) => c.id === highlightCouponId);
    if (!inList) return;

    highlightHandledRef.current = highlightCouponId;
    const el = document.querySelector(`[data-coupon-id="${highlightCouponId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const clearGlow = window.setTimeout(() => clearHighlightCoupon(), 3200);
    return () => window.clearTimeout(clearGlow);
  }, [
    tab,
    highlightCouponId,
    redeemedCoupons,
    inProgressCoupons,
    completedCouponsSorted,
    clearHighlightCoupon,
  ]);

  const completedCount = completedCouponsSorted.length;

  const shopByCategory = useMemo(() => {
    const map = new Map<RewardShopCategory, typeof REWARD_SHOP_ITEMS>();
    for (const item of REWARD_SHOP_ITEMS) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, []);

  const handleRedeem = async (itemId: (typeof REWARD_SHOP_ITEMS)[0]['id']) => {
    const result = await redeemRewardItem(itemId);
    if (result.ok) {
      setTab('coupons');
      showToast('已兌換成功，卡券已加入', 'success', { position: 'top' });
      setRedeemMsg(null);
      return;
    }
    setRedeemMsg('愛心幣不足喔～');
    setTimeout(() => setRedeemMsg(null), 2500);
  };

  const handleCustomRedeem = async (input: Parameters<typeof redeemCustomRewardItem>[0]) => {
    const result = await redeemCustomRewardItem(input);
    if (result.ok) {
      setTab('coupons');
      showToast('已兌換成功，卡券已加入', 'success', { position: 'top' });
      return true;
    }
    return false;
  };

  const SYNC_STATUS_LABEL = {
    local: '本機保存',
    syncing: '正在同步我的卡券…',
    synced: '已同步至帳號',
    error: '同步失敗，稍後再試',
  } as const;

  const showSyncing = rewardCardSyncStatus === 'syncing' || syncingManual;

  const handleSync = async () => {
    setSyncingManual(true);
    try {
      await syncRewardCards();
    } finally {
      setSyncingManual(false);
    }
  };

  const pendingCount = redeemedCoupons.length;
  const hasAnyCoupons =
    redeemedCoupons.length > 0 ||
    inProgressCoupons.length > 0 ||
    completedCount > 0;

  const handleCleanupOld = async () => {
    const removed = await cleanupOldCompletedRewardCards();
    setCleanupMsg(
      removed > 0 ? `已清理 ${removed} 筆超過 ${COMPLETED_REWARD_CARD_RETENTION_DAYS} 天的舊紀錄` : '目前沒有需要清理的舊紀錄。'
    );
    setTimeout(() => setCleanupMsg(null), 2800);
  };

  return (
    <>
      {!embedded ? (
        <PageHero emoji="🎁" title="情侶獎勵" subtitle="錢包 · 商城 · 卡券，用 LoveCoin 兌換專屬驚喜" />
      ) : null}

      <NicknameSetupBanner compact />

      <section className="mb-3 grid grid-cols-3 gap-2">
        {(['wallet', 'shop', 'coupons'] as const).map((id) => {
          const meta = TAB_META[id];
          const Icon = meta.icon;
          const active = tab === id;
          const badge =
            id === 'wallet'
              ? String(rpg.loveCoins)
              : id === 'coupons' && pendingCount > 0
                ? String(pendingCount)
                : undefined;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex min-h-[7.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center transition active:scale-[0.98] ${
                active
                  ? 'border-rose-300 bg-gradient-to-b from-white to-rose-50/90 shadow-[0_8px_24px_-10px_rgba(244,63,94,0.35)] ring-2 ring-rose-200/80'
                  : 'border-stone-200/80 bg-white/90 shadow-sm'
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} ${
                  active ? 'scale-105' : ''
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? 'text-rose-600' : 'text-stone-500'}`} strokeWidth={2.25} />
              </span>
              <span className={`text-[15px] font-extrabold leading-tight ${active ? 'text-rose-800' : lq.text}`}>
                {meta.label}
              </span>
              <span className={`text-[10px] leading-tight ${active ? 'text-rose-600/90' : lq.textMuted}`}>
                {meta.hint}
              </span>
              {badge ? (
                <span
                  className={`absolute right-1.5 top-1.5 min-w-[1.35rem] rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    active ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </section>

      {redeemMsg ? (
        <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-[13px] font-semibold text-rose-700 ring-1 ring-rose-100">
          {redeemMsg}
        </p>
      ) : null}

      {tab === 'wallet' && (
        <div className="space-y-3">
          <section className={`overflow-hidden p-4 ${lq.card}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-rose-500">我的 LoveCoin</p>
                <p className="mt-0.5 text-4xl font-extrabold tabular-nums text-rose-700">{rpg.loveCoins}</p>
                <p className="mt-1 text-[13px] font-semibold text-emerald-600">今日獲得 +{todayCoinEarned}</p>
              </div>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 text-4xl shadow-inner">
                🪙
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <StatPill>💖 {rpgView.heartPoints}</StatPill>
              <StatPill>🤝 {rpgView.compatibility}%</StatPill>
              <StatPill>✨ Lv.{rpgView.level}</StatPill>
              <StatPill>🔥 {rpg.loginStreak} 天</StatPill>
            </div>
          </section>

          <section className={`p-3.5 ${lq.card}`}>
            <h2 className="mb-2.5 flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
              <Coins className="h-4 w-4 text-amber-600" aria-hidden />
              最近獲得
            </h2>
            {recentCoinEarns.length === 0 ? (
              <EmptyState
                compact
                emoji="🪙"
                title="還沒有獲得紀錄"
                hint="完成任務、家事、約會或小遊戲就會累積 LoveCoin"
                className="border-0 bg-transparent"
              />
            ) : (
              <ul className="space-y-2">
                {recentCoinEarns.map((e) => (
                  <li
                    key={e.id}
                    className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2.5 text-[13px]"
                  >
                    <span className="min-w-0 truncate font-semibold text-stone-800">
                      {e.emoji} {e.title}
                    </span>
                    <span className="shrink-0 text-base font-extrabold text-rose-600">+{e.coins}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
              家事 · 任務 · 小遊戲 · 約會 · 每日登入皆可累積 LoveCoin
            </p>
          </section>
        </div>
      )}

      {tab === 'shop' && (
        <div className="space-y-3">
          <p className={`flex flex-wrap items-center gap-2 px-1 text-[13px] font-semibold text-stone-600`}>
            兌換情侶卡券
            <ProBadgeIfNeeded show={customCardPro.showProBadge} feature="custom_reward_cards" />
          </p>
          <section className={`flex items-center justify-between gap-2 px-1 ${lq.cardSoft} !p-3`}>
            <p className="text-[13px] font-semibold text-stone-700">我的餘額</p>
            <p className="text-xl font-extrabold text-rose-700">🪙 {rpg.loveCoins}</p>
          </section>
          {Array.from(shopByCategory.entries()).map(([cat, items]) => {
            const meta = REWARD_CATEGORY_LABEL[cat];
            return (
              <section key={cat} className={`p-3.5 ${lq.card}`}>
                <h2 className="mb-2.5 text-[15px] font-bold text-stone-900">
                  {meta.emoji} {meta.label}
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {items.map((item) => {
                    const canAfford = rpg.loveCoins >= item.cost;
                    return (
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-rose-100/80 bg-gradient-to-r from-rose-50/60 to-amber-50/40 p-3.5"
                      >
                        <span className="text-3xl">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-bold text-stone-900">{item.title}</p>
                          <p className="mt-0.5 text-[12px] leading-snug text-stone-500">{item.description}</p>
                          <p className="mt-1 text-[13px] font-extrabold text-amber-700">🪙 {item.cost}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleRedeem(item.id)}
                          className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-bold transition active:scale-95 disabled:opacity-40 ${
                            canAfford ? lq.btnPrimary : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          🎁 兌換
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === 'coupons' && (
        <>
          <CustomRewardCardPanel
            loveCoins={rpg.loveCoins}
            onRedeem={handleCustomRedeem}
            compact
          />

          <section className={`space-y-3 p-3.5 ${lq.card}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={`flex flex-wrap items-center gap-1.5 ${lq.sectionTitleSm}`}>
              <Ticket className="h-4 w-4 text-emerald-600" aria-hidden />
              我的卡券
              <ProBadgeIfNeeded show={syncPro.showProBadge} feature="full_sync" />
            </h2>
            <button
              type="button"
              disabled={showSyncing}
              onClick={() => void handleSync()}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold ${lq.btnSecondary}`}
            >
              {showSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Cloud className="h-3.5 w-3.5" aria-hidden />
              )}
              同步我的卡券
            </button>
          </div>

          <p className="text-[12px] leading-relaxed text-stone-500">
            卡券只保存在你的帳號中，不會同步給另一半；使用紀錄會顯示在今日動態。
          </p>

          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-stone-50/90 px-2.5 py-2 ring-1 ring-stone-100">
            <span className="text-[11px] font-semibold text-stone-600">
              {SYNC_STATUS_LABEL[rewardCardSyncStatus]}
            </span>
            {showSyncing ? (
              <RefreshCw className="h-3 w-3 animate-spin text-rose-500" aria-hidden />
            ) : null}
          </div>

          {rewardCardSyncError ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-900 ring-1 ring-amber-100">
              {rewardCardSyncError}
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-stone-400">
              登入並連上網路後，卡券會同步至你的帳號；另一半僅能在今日動態看到兌換／使用紀錄。
            </p>
          )}

          {!hasAnyCoupons ? (
            <EmptyState compact emoji="🎫" title="還沒有卡券" hint="到商城用 LoveCoin 兌換吧" className="border-0 bg-transparent" />
          ) : null}

          {redeemedCoupons.length > 0 ? (
            <CouponSection title="可使用" count={redeemedCoupons.length} accent="emerald">
              <CouponList
                coupons={redeemedCoupons}
                currentUserId={currentUserId}
                displayNameForUser={displayNameForUser}
                onUse={useCoupon}
              />
            </CouponSection>
          ) : null}

          {inProgressCoupons.length > 0 ? (
            <CouponSection title="使用中" count={inProgressCoupons.length} accent="amber">
              <CouponList
                coupons={inProgressCoupons}
                currentUserId={currentUserId}
                displayNameForUser={displayNameForUser}
                onComplete={completeRewardCard}
                onCancelUse={cancelRewardCardUse}
              />
            </CouponSection>
          ) : null}

          {completedCount > 0 ? (
            <CompletedRecordsSection
              count={completedCount}
              expanded={completedExpanded}
              onToggle={() => setCompletedExpanded((v) => !v)}
              retentionDays={COMPLETED_REWARD_CARD_RETENTION_DAYS}
              cleanupMsg={cleanupMsg}
              onCleanup={() => void handleCleanupOld()}
            >
              <ul className="space-y-1.5">
                {completedCouponsSorted.map((c) => (
                  <CompletedCouponRow
                    key={c.id}
                    coupon={c}
                    displayNameForUser={displayNameForUser}
                  />
                ))}
              </ul>
            </CompletedRecordsSection>
          ) : null}
        </section>
        </>
      )}

      <section className={`mt-3 p-3 ${lq.cardSoft}`}>
        <h2 className="mb-2 text-[12px] font-bold text-stone-600">本週稱號</h2>
        <ul className="space-y-1.5 text-[12px] text-stone-600">
          <li>
            👑 家事王：
            {weeklyTitles.houseworkKing
              ? `${weeklyTitles.houseworkKing.emoji} ${weeklyTitles.houseworkKing.name}（${weeklyTitles.houseworkKing.count} 次）`
              : '本週尚無家事紀錄'}
          </li>
          <li>💗 最貼心：{weeklyTitles.sweetheart}</li>
          <li>
            ⭐ Lv.{rpgView.level} · {rpgView.title}
          </li>
        </ul>
      </section>
    </>
  );
}

function CompletedRecordsSection({
  count,
  expanded,
  onToggle,
  retentionDays,
  cleanupMsg,
  onCleanup,
  children,
}: {
  count: number;
  expanded: boolean;
  onToggle: () => void;
  retentionDays: number;
  cleanupMsg: string | null;
  onCleanup: () => void;
  children: ReactNode;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl border border-stone-200/80 bg-stone-50/60 px-3 py-2.5 text-left transition active:scale-[0.99]"
        aria-expanded={expanded}
      >
        <span className="text-[12px] font-bold text-stone-600">已完成紀錄</span>
        <span className="flex items-center gap-2 text-[12px] font-extrabold text-stone-500">
          {count}
          <Chevron className="h-4 w-4 shrink-0" aria-hidden />
        </span>
      </button>

      {expanded ? (
        <>
          {children}
          <p className="px-0.5 text-[10px] leading-relaxed text-stone-400">
            已完成卡券會保留 {retentionDays} 天，之後自動清理。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCleanup}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
            >
              清理舊紀錄
            </button>
            {cleanupMsg ? (
              <span className="text-[11px] font-medium text-stone-500">{cleanupMsg}</span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CompletedCouponRow({
  coupon: c,
  displayNameForUser,
}: {
  coupon: OwnedCoupon;
  displayNameForUser: (userId: string | null | undefined) => string;
}) {
  const actors = couponActorIds(c);
  const user = actors.usedBy
    ? displayNameForUser(actors.usedBy)
    : actors.redeemedBy
      ? displayNameForUser(actors.redeemedBy)
      : '—';

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 bg-stone-50/50 px-2.5 py-2 text-[12px]">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-stone-800">
          {c.emoji} {c.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-stone-500">
          {user} 使用 · {c.completedAt ? formatIso(c.completedAt) : '—'}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-600">
        {REWARD_CARD_STATUS_LABEL.completed}
      </span>
    </li>
  );
}

function CouponSection({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: 'emerald' | 'amber' | 'stone';
  children: ReactNode;
}) {
  const titleClass =
    accent === 'emerald'
      ? 'text-emerald-600'
      : accent === 'amber'
        ? 'text-amber-700'
        : 'text-stone-500';
  return (
    <div className="space-y-2">
      <p className={`text-[12px] font-bold ${titleClass}`}>
        {title}
        <span className="ml-1.5 font-extrabold">({count})</span>
      </p>
      {children}
    </div>
  );
}

function CouponList({
  coupons,
  currentUserId,
  displayNameForUser,
  onUse,
  onComplete,
  onCancelUse,
}: {
  coupons: OwnedCoupon[];
  currentUserId: string | null;
  displayNameForUser: (userId: string | null | undefined) => string;
  onUse?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancelUse?: (id: string) => void;
}) {
  return (
    <ul className="space-y-2.5">
      {coupons.map((c) => (
        <CouponCard
          key={c.id}
          coupon={c}
          currentUserId={currentUserId}
          displayNameForUser={displayNameForUser}
          onUse={onUse}
          onComplete={onComplete}
          onCancelUse={onCancelUse}
        />
      ))}
    </ul>
  );
}

function CouponCard({
  coupon: c,
  currentUserId,
  displayNameForUser,
  onUse,
  onComplete,
  onCancelUse,
}: {
  coupon: OwnedCoupon;
  currentUserId: string | null;
  displayNameForUser: (userId: string | null | undefined) => string;
  onUse?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancelUse?: (id: string) => void;
}) {
  const actors = couponActorIds(c);
  const redeemerName = actors.redeemedBy ? displayNameForUser(actors.redeemedBy) : null;
  const usedName = actors.usedBy ? displayNameForUser(actors.usedBy) : null;
  const completedName = actors.completedBy ? displayNameForUser(actors.completedBy) : null;

  const badgeClass =
    c.status === 'redeemed'
      ? 'bg-emerald-100 text-emerald-700'
      : c.status === 'used'
        ? 'bg-amber-100 text-amber-800'
        : c.status === 'completed'
          ? 'bg-stone-100 text-stone-600'
          : 'bg-stone-100 text-stone-500';

  const showUse = onUse && canOwnerUseRewardCard(c, currentUserId);
  const showComplete = onComplete && canOwnerCompleteRewardCard(c, currentUserId);
  const showCancelUse = onCancelUse && canOwnerCancelUseRewardCard(c, currentUserId);

  return (
    <li
      data-coupon-id={c.id}
      className="rounded-2xl border border-rose-100 bg-white p-3.5 text-[13px] shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[15px] font-bold text-stone-900">
          {c.emoji} {c.title}
          {c.isCustom ? (
            <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              自訂
            </span>
          ) : null}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeClass}`}>
          {REWARD_CARD_STATUS_LABEL[c.status]}
        </span>
      </div>

      {c.description ? (
        <p className="mt-1.5 text-[12px] leading-snug text-stone-500">{c.description}</p>
      ) : null}

      <dl className="mt-2 space-y-0.5 text-[12px] text-stone-500">
        <div>
          <dt className="inline font-semibold text-stone-600">點數：</dt>
          <dd className="inline">🪙 {c.cost}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-stone-600">兌換：</dt>
          <dd className="inline">
            {redeemerName ?? '—'} · {formatIso(c.redeemedAt)}
          </dd>
        </div>
        {c.status !== 'redeemed' && c.usedAt && actors.usedBy ? (
          <div>
            <dt className="inline font-semibold text-stone-600">使用：</dt>
            <dd className="inline">
              {usedName ?? '—'} · {formatIso(c.usedAt)}
            </dd>
          </div>
        ) : c.status === 'redeemed' ? (
          <div>
            <dt className="inline font-semibold text-stone-500">使用：</dt>
            <dd className="inline text-stone-400">尚未使用</dd>
          </div>
        ) : null}
        {c.status === 'completed' && c.completedAt ? (
          <div>
            <dt className="inline font-semibold text-stone-600">完成：</dt>
            <dd className="inline">
              {completedName ?? redeemerName ?? '—'} · {formatIso(c.completedAt)}
            </dd>
          </div>
        ) : c.status === 'used' ? (
          <div>
            <dt className="inline font-semibold text-stone-500">完成：</dt>
            <dd className="inline text-stone-400">尚未完成</dd>
          </div>
        ) : null}
      </dl>

      {c.syncPending ? (
        <p className="mt-1.5 text-[10px] font-semibold text-amber-600">
          {c.syncError ? c.syncError : '同步中…'}
        </p>
      ) : null}

      {showUse ? (
        <button
          type="button"
          onClick={() => onUse(c.id)}
          className={`mt-3 min-h-[44px] w-full rounded-xl py-2.5 text-[13px] font-bold ${lq.btnPrimary}`}
        >
          ✨ 使用卡券
        </button>
      ) : null}

      {showCancelUse ? (
        <button
          type="button"
          onClick={() => onCancelUse!(c.id)}
          className="mt-2 min-h-[40px] w-full rounded-xl border border-stone-200 bg-white py-2 text-[12px] font-bold text-stone-600"
        >
          取消使用
        </button>
      ) : null}

      {showComplete ? (
        <button
          type="button"
          onClick={() => onComplete!(c.id)}
          className={`mt-3 min-h-[44px] w-full rounded-xl py-2.5 text-[13px] font-bold ${lq.btnSecondary}`}
        >
          ✓ 標記完成
        </button>
      ) : null}
    </li>
  );
}

function StatPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/90 px-2.5 py-1 font-semibold text-stone-600 ring-1 ring-rose-100">
      {children}
    </span>
  );
}

function formatIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
