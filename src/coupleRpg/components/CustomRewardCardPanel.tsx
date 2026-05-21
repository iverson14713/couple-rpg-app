import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { REWARD_CATEGORY_LABEL } from '../data/rewardShopCatalog';
import {
  CUSTOM_REWARD_COST_DEFAULT,
  CUSTOM_REWARD_COST_MAX,
  CUSTOM_REWARD_COST_MIN,
} from '../lib/customRewardCard';
import { useUserPlan } from '../context/UserPlanContext';
import { ProBadgeIfNeeded } from './ProBadge';
import type { CustomRewardCardInput, RewardShopCategory } from '../storage/rewardTypes';
import { lq } from '../theme';

const CATEGORIES: RewardShopCategory[] = ['massage', 'royal', 'date', 'flirt'];

type Props = {
  loveCoins: number;
  onRedeem: (input: CustomRewardCardInput) => boolean;
  onSuccess?: () => void;
  compact?: boolean;
};

export function CustomRewardCardPanel({ loveCoins, onRedeem, onSuccess, compact }: Props) {
  const { isPro, openUpgradeModal } = useUserPlan();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎫');
  const [category, setCategory] = useState<RewardShopCategory>('date');
  const [cost, setCost] = useState(String(CUSTOM_REWARD_COST_DEFAULT));
  const [needsPartnerComplete, setNeedsPartnerComplete] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const costNum = Math.round(Number(cost));
  const costValid =
    Number.isFinite(costNum) && costNum >= CUSTOM_REWARD_COST_MIN && costNum <= CUSTOM_REWARD_COST_MAX;
  const canAfford = costValid && loveCoins >= costNum;
  const canSubmit = title.trim().length > 0 && costValid;

  const handleSubmit = () => {
    if (!isPro) {
      openUpgradeModal();
      return;
    }
    if (!canSubmit) {
      setMsg('請填寫卡券名稱與有效點數');
      return;
    }
    if (!canAfford) {
      setMsg('愛心幣不足喔～');
      return;
    }
    const ok = onRedeem({
      title: title.trim(),
      description: description.trim(),
      emoji: emoji.trim() || '🎫',
      category,
      cost: costNum,
      needsPartnerComplete,
    });
    if (ok) {
      setTitle('');
      setDescription('');
      setMsg('自訂卡券兌換成功！已放入待使用');
      onSuccess?.();
      setTimeout(() => setMsg(null), 2500);
      return;
    }
    setMsg('兌換失敗，請檢查內容或餘額');
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <section
      className={`${compact ? lq.cardSoft : lq.card} border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-rose-50/50 to-white p-3.5`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
          <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
          自訂卡券
        </h3>
        <ProBadgeIfNeeded show={!isPro} feature="custom_reward_cards" />
        <span className="text-[11px] font-semibold text-violet-700/90">Pro 專屬</span>
      </div>

      {!isPro ? (
        <p className="mb-3 text-[12px] leading-relaxed text-stone-500">
          升級 Pro 後可自訂卡券名稱、說明與兌換點數，打造專屬你們的情侶驚喜。
        </p>
      ) : null}

      <div className={`space-y-2.5 ${!isPro ? 'pointer-events-none opacity-50' : ''}`}>
        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">圖示</span>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className={`mt-1 w-full rounded-xl border border-rose-100 px-3 py-2.5 text-center text-xl bg-white text-stone-900 outline-none focus:ring-2 focus:ring-rose-200`}
            placeholder="🎫"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">卡券名稱</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={40}
            className={`mt-1 w-full rounded-xl border border-rose-100 px-3 py-2.5 text-[14px] bg-white text-stone-900 outline-none focus:ring-2 focus:ring-rose-200`}
            placeholder="例如：週末電影之夜"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">兌現說明（選填）</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            rows={2}
            className={`mt-1 w-full resize-none rounded-xl border border-rose-100 px-3 py-2.5 text-[13px] bg-white text-stone-900 outline-none focus:ring-2 focus:ring-rose-200`}
            placeholder="兌換後要做什麼、注意事項…"
          />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">類型</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RewardShopCategory)}
            className={`mt-1 w-full rounded-xl border border-rose-100 px-3 py-2.5 text-[13px] bg-white text-stone-900 outline-none focus:ring-2 focus:ring-rose-200`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {REWARD_CATEGORY_LABEL[cat].emoji} {REWARD_CATEGORY_LABEL[cat].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">
            兌換點數（LoveCoin）{CUSTOM_REWARD_COST_MIN}～{CUSTOM_REWARD_COST_MAX}
          </span>
          <input
            type="number"
            min={CUSTOM_REWARD_COST_MIN}
            max={CUSTOM_REWARD_COST_MAX}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={`mt-1 w-full rounded-xl border border-rose-100 px-3 py-2.5 text-[14px] font-bold text-amber-800 bg-white text-stone-900 outline-none focus:ring-2 focus:ring-rose-200`}
          />
          <p className="mt-1 text-[11px] text-stone-400">目前餘額：🪙 {loveCoins}</p>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-rose-100">
          <input
            type="checkbox"
            checked={needsPartnerComplete}
            onChange={(e) => setNeedsPartnerComplete(e.target.checked)}
            className="h-4 w-4 rounded border-rose-200 text-rose-600"
          />
          <span className="text-[12px] font-semibold text-stone-700">使用後需對方標記完成</span>
        </label>
      </div>

      {msg ? (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-800">{msg}</p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPro && (!canSubmit || !canAfford)}
        className={`mt-3 min-h-[44px] w-full rounded-xl py-2.5 text-[13px] font-bold transition active:scale-[0.98] disabled:opacity-40 ${
          isPro ? lq.btnPrimary : 'bg-gradient-to-r from-violet-500 to-rose-500 text-white'
        }`}
      >
        {isPro ? '🎁 兌換自訂卡券' : '✨ 升級 Pro 解鎖'}
      </button>
    </section>
  );
}
