import { Image } from 'lucide-react';
import { useUserPlan } from '../context/UserPlanContext';
import { AiFavoriteButton } from './AiFavoriteButton';
import { lq } from '../theme';

type Props = {
  recordId: string;
  onShareCard: () => void;
  className?: string;
};

/** 已產生 AI 結果時：收藏 + 分享卡（Pro 門檻在子元件內） */
export function AiRecordProActions({ recordId, onShareCard, className = '' }: Props) {
  const { isPro, openUpgradeModal } = useUserPlan();

  const handleShare = () => {
    if (!isPro) {
      openUpgradeModal('產生 IG 分享卡為 Pro 功能');
      return;
    }
    onShareCard();
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <AiFavoriteButton recordId={recordId} />
      <button
        type="button"
        onClick={handleShare}
        className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200/55 bg-white/75 px-3 py-2 text-[12px] font-bold text-rose-700 shadow-[0_4px_16px_-10px_rgba(244,114,182,0.2)] backdrop-blur-sm active:scale-[0.98] sm:flex-none`}
      >
        <Image className="h-4 w-4" aria-hidden />
        產生分享圖
      </button>
    </div>
  );
}
