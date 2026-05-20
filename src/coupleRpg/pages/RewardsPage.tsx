import { useMemo, useState, type ReactNode } from 'react';
import { REWARD_CATEGORY_LABEL, REWARD_SHOP_ITEMS } from '../data/rewardShopCatalog';
import { PageHero } from '../components/ui';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { RewardShopCategory } from '../storage/rewardTypes';
import { lq } from '../theme';

type Tab = 'wallet' | 'shop' | 'coupons';

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
        <PageHero emoji="🎁" title="情侶獎勵" subtitle="LoveCoin · 獎勵商城 · 我的卡券" />
      ) : null}

      <section className={`mb-3 overflow-hidden p-4 ${lq.card}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-rose-400">LoveCoin 愛心幣</p>
            <p className="text-3xl font-extrabold text-rose-700">{rpg.loveCoins}</p>
          </div>
          <span className="text-4xl" aria-hidden>
            🪙
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px]">
          <div className={`rounded-xl py-2 ${lq.cardSoft}`}>
            <p className="font-bold text-stone-500">今日獲得</p>
            <p className={`text-base font-extrabold ${lq.accent}`}>+{todayCoinEarned}</p>
          </div>
          <div className={`rounded-xl py-2 ${lq.cardSoft}`}>
            <p className="font-bold text-stone-500">累積總數</p>
            <p className={`text-base font-extrabold ${lq.accent}`}>{rpg.loveCoins}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <Pill>💖 {rpgView.heartPoints}</Pill>
          <Pill>🤝 {rpgView.compatibility}%</Pill>
          <Pill>🏠 {rpgView.houseworkPoints}</Pill>
          <Pill>✨ Lv.{rpgView.level}</Pill>
          <Pill>🔥 {rpg.loginStreak} 天</Pill>
        </div>
      </section>

      <section className={`mb-3 p-3 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">本週稱號</h2>
        <ul className="space-y-1.5 text-[12px]">
          <li className="rounded-xl bg-amber-50/80 px-2.5 py-2 text-stone-700">
            👑 家事王：
            {weeklyTitles.houseworkKing
              ? `${weeklyTitles.houseworkKing.emoji} ${weeklyTitles.houseworkKing.name}（${weeklyTitles.houseworkKing.count} 次）`
              : '本週尚無家事紀錄'}
          </li>
          <li className="rounded-xl bg-pink-50/80 px-2.5 py-2 text-stone-700">
            💗 最貼心：{weeklyTitles.sweetheart}
          </li>
          <li className="rounded-xl bg-violet-50/60 px-2.5 py-2 text-stone-600">
            ⭐ 情侶等級 Lv.{rpgView.level} · {rpgView.title}
          </li>
        </ul>
      </section>

      <div className="mb-3 flex gap-1 rounded-2xl bg-rose-50/60 p-1 ring-1 ring-rose-100">
        {(
          [
            ['wallet', '錢包'],
            ['shop', '商城'],
            ['coupons', '卡券'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition ${
              tab === id ? 'bg-white text-rose-700 shadow-sm' : 'text-stone-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {redeemMsg ? (
        <p className="mb-2 text-center text-[12px] font-semibold text-rose-600">{redeemMsg}</p>
      ) : null}

      {tab === 'wallet' && (
        <section className={`p-3 ${lq.card}`}>
          <h2 className="mb-2 text-sm font-bold text-stone-900">最近獲得</h2>
          {recentCoinEarns.length === 0 ? (
            <p className="text-[13px] text-stone-500">完成家事、任務、約會或小遊戲可賺愛心幣</p>
          ) : (
            <ul className="space-y-1.5">
              {recentCoinEarns.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-xl bg-white/80 px-2.5 py-2 text-[12px]"
                >
                  <span className="min-w-0 truncate font-medium text-stone-800">
                    {e.emoji} {e.title}
                  </span>
                  <span className="shrink-0 font-bold text-rose-600">+{e.coins}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-stone-400">
            家事 +15 · 任務 +10 · 小遊戲 +12 · 約會 +20 · 每日登入也有獎勵
          </p>
        </section>
      )}

      {tab === 'shop' && (
        <div className="space-y-3">
          {Array.from(shopByCategory.entries()).map(([cat, items]) => {
            const meta = REWARD_CATEGORY_LABEL[cat];
            return (
              <section key={cat} className={`p-3 ${lq.card}`}>
                <h2 className="mb-2 text-sm font-bold text-stone-900">
                  {meta.emoji} {meta.label}
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((item) => {
                    const canAfford = rpg.loveCoins >= item.cost;
                    return (
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-rose-50 bg-gradient-to-r from-rose-50/50 to-amber-50/30 p-3"
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-stone-900">{item.title}</p>
                          <p className="text-[11px] text-stone-500">{item.description}</p>
                          <p className="mt-0.5 text-[11px] font-bold text-amber-700">🪙 {item.cost}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleRedeem(item.id)}
                          className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition active:scale-95 disabled:opacity-40 ${
                            canAfford ? lq.btnPrimary : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          兌換
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
        <section className={`space-y-3 p-3 ${lq.card}`}>
          <h2 className="text-sm font-bold text-stone-900">我的卡券</h2>
          {activeCoupons.length === 0 && usedCoupons.length === 0 ? (
            <p className="text-[13px] text-stone-500">還沒有卡券，去商城兌換吧～</p>
          ) : null}
          {activeCoupons.length > 0 ? (
            <>
              <p className="text-[11px] font-bold text-emerald-600">可使用</p>
              <CouponList coupons={activeCoupons} onUse={useCoupon} />
            </>
          ) : null}
          {usedCoupons.length > 0 ? (
            <>
              <p className="text-[11px] font-bold text-stone-400">已使用</p>
              <CouponList coupons={usedCoupons} />
            </>
          ) : null}
        </section>
      )}
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
    <ul className="space-y-2">
      {coupons.map((c) => (
        <li key={c.id} className="rounded-xl border border-rose-100 bg-white/90 p-3 text-[12px]">
          <div className="flex items-start justify-between gap-2">
            <span className="font-bold text-stone-900">
              {c.emoji} {c.title}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
              className={`mt-2 w-full rounded-lg py-2 text-[11px] font-bold ${lq.btnSecondary}`}
            >
              ✓ 標記已使用
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/80 px-2 py-0.5 font-semibold text-stone-600 ring-1 ring-rose-100">
      {children}
    </span>
  );
}

function formatIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
