import { useMemo, useState, type ReactNode } from 'react';
import { Coins, Gift, Ticket, Wallet } from 'lucide-react';
import { REWARD_CATEGORY_LABEL, REWARD_SHOP_ITEMS } from '../data/rewardShopCatalog';
import { EmptyState } from '../components/EmptyState';
import { NicknameSetupBanner } from '../components/NicknameSetupBanner';
import { PageHero } from '../components/ui';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { RewardShopCategory } from '../storage/rewardTypes';
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
    hint: '我的兌換卡券',
    gradient: 'from-emerald-100 via-teal-50 to-rose-50',
  },
};

export function RewardsPage({ embedded }: { embedded?: boolean } = {}) {
  const {
    rpg,
    rpgView,
    todayCoinEarned,
    recentCoinEarns,
    weeklyTitles,
    redeemRewardItem,
    useCoupon,
    activeCoupons,
    usedCoupons,
  } = useLoveQuest();

  const [tab, setTab] = useState<Tab>('wallet');
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

  const shopByCategory = useMemo(() => {
    const map = new Map<RewardShopCategory, typeof REWARD_SHOP_ITEMS>();
    for (const item of REWARD_SHOP_ITEMS) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, []);

  const handleRedeem = (itemId: (typeof REWARD_SHOP_ITEMS)[0]['id']) => {
    const ok = redeemRewardItem(itemId);
    setRedeemMsg(ok ? '兌換成功！已放入我的卡券' : '愛心幣不足喔～');
    if (ok) setTab('coupons');
    setTimeout(() => setRedeemMsg(null), 2500);
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
              : id === 'coupons'
                ? activeCoupons.length > 0
                  ? String(activeCoupons.length)
                  : undefined
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
                <p className="text-[12px] font-bold uppercase tracking-wide text-rose-500">LoveCoin 餘額</p>
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
          <section className={`flex items-center justify-between gap-2 px-1 ${lq.cardSoft} !p-3`}>
            <p className="text-[13px] font-semibold text-stone-700">目前餘額</p>
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
        <section className={`space-y-3 p-3.5 ${lq.card}`}>
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
            <Ticket className="h-4 w-4 text-emerald-600" aria-hidden />
            我的卡券
            {activeCoupons.length > 0 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {activeCoupons.length} 張可用
              </span>
            ) : null}
          </h2>
          {activeCoupons.length === 0 && usedCoupons.length === 0 ? (
            <EmptyState compact emoji="🎫" title="還沒有卡券" hint="到商城用 LoveCoin 兌換吧" className="border-0 bg-transparent" />
          ) : null}
          {activeCoupons.length > 0 ? (
            <>
              <p className="text-[12px] font-bold text-emerald-600">可使用</p>
              <CouponList coupons={activeCoupons} onUse={useCoupon} />
            </>
          ) : null}
          {usedCoupons.length > 0 ? (
            <>
              <p className="text-[12px] font-bold text-stone-400">已使用</p>
              <CouponList coupons={usedCoupons} />
            </>
          ) : null}
        </section>
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

function CouponList({
  coupons,
  onUse,
}: {
  coupons: ReturnType<typeof useLoveQuest>['activeCoupons'];
  onUse?: (id: string) => void;
}) {
  return (
    <ul className="space-y-2.5">
      {coupons.map((c) => (
        <li key={c.id} className="rounded-2xl border border-rose-100 bg-white p-3.5 text-[13px] shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[15px] font-bold text-stone-900">
              {c.emoji} {c.title}
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {c.status === 'active' ? '未使用' : '已使用'}
            </span>
          </div>
          <p className="mt-1 text-stone-500">取得：{formatIso(c.acquiredAt)}</p>
          {c.usedAt ? <p className="text-stone-500">使用：{formatIso(c.usedAt)}</p> : null}
          {c.status === 'active' && onUse ? (
            <button
              type="button"
              onClick={() => onUse(c.id)}
              className={`mt-3 min-h-[44px] w-full rounded-xl py-2.5 text-[13px] font-bold ${lq.btnSecondary}`}
            >
              ✓ 標記已使用
            </button>
          ) : null}
        </li>
      ))}
    </ul>
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
