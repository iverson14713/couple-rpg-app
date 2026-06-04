import { ChevronRight } from 'lucide-react';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { useLoveQuest } from '../context/LoveQuestContext';
import { HomeDecorIllustration } from './ui/HomeDecorIllustration';
import type { HomeDecorRole } from './ui/HomeDecorIllustration';
import type { HomeQuestIconId } from './ui/homeQuestIcons';

export type HomeRecommendationItem = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  cta: string;
  gradient: string;
  iconId: HomeQuestIconId;
  illustrationRole?: HomeDecorRole;
  onAction: () => void;
};

type Props = {
  items: HomeRecommendationItem[];
};

/** 首頁「今日推薦」— App Store 精選卡（僅排版） */
export function HomeRecommendationsCarousel({ items }: Props) {
  return (
    <section className="lq-home-section-in" aria-label="今日推薦">
      <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-[20px] font-bold tracking-tight text-[#3d3539]">今日推薦</h2>
        <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#d0c4cb]">
          滑動查看更多
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <div className="-mx-0.5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-0.5 pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const illusRole = item.illustrationRole ?? 'card';
          const isQuiet = illusRole === 'cardQuiet';
          return (
            <article
              key={item.id}
              className={`lq-home-rec-card lq-home-elev relative isolate min-h-[13.5rem] w-[min(39vw,9.5rem)] shrink-0 snap-start overflow-hidden rounded-[22px] bg-gradient-to-b ring-1 ring-white/90 ${item.gradient}`}
            >
              <HomeDecorIllustration id={item.iconId} role={illusRole} />

              <div className="relative z-10 flex min-h-[13.5rem] flex-col px-3 pb-3 pt-3">
                <div>
                  <h3
                    className={`pr-1 leading-[1.2] tracking-tight ${
                      isQuiet
                        ? 'text-[15px] font-bold text-[#5c5258]'
                        : 'text-[15px] font-extrabold text-[#3d3539]'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-[#b07a8f]">
                    {item.subtitle}
                  </p>
                </div>

                <div className="min-h-[4.5rem] flex-1" aria-hidden />

                <button type="button" onClick={item.onAction} className="lq-rec-cta">
                  {item.cta}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function useHomeRecommendationItems(): HomeRecommendationItem[] {
  const { navigateTo } = useCoupleRpgNav();
  const { todayDinner, taskProgress } = useLoveQuest();
  const { done, total } = taskProgress;

  const dinnerSubtitle = todayDinner?.label
    ? `已選：${todayDinner.label.length > 10 ? `${todayDinner.label.slice(0, 10)}…` : todayDinner.label}`
    : '幫你決定晚餐';

  return [
    {
      id: 'dinner',
      title: '今晚吃什麼？',
      subtitle: dinnerSubtitle,
      cta: '去抽籤',
      iconId: 'dinner',
      illustrationRole: 'cardQuiet',
      gradient: 'from-[#ffedd5] via-[#fff7ed] to-[#fffcf8]',
      onAction: () => navigateTo('dinner'),
    },
    {
      id: 'dates',
      title: '約會去哪？',
      subtitle: '找個好地方',
      cta: '去看看',
      iconId: 'date',
      gradient: 'from-[#dbeafe] via-[#eff6ff] to-[#f8fbff]',
      onAction: () => navigateTo('dates'),
    },
    {
      id: 'tasks',
      title: '今日戀愛任務',
      subtitle: '完成任務得獎勵',
      cta: total > 0 && done >= total ? '已完成' : '去完成',
      iconId: 'love-task',
      gradient: 'from-[#fce7f3] via-[#fdf2f8] to-[#fff5f9]',
      onAction: () => navigateTo('tasks'),
    },
    {
      id: 'housework',
      title: '家事誰來做？',
      subtitle: '公平分配不吵架',
      cta: '去分配',
      iconId: 'chores',
      gradient: 'from-[#ede9fe] via-[#f5f3ff] to-[#faf8ff]',
      onAction: () => navigateTo('housework'),
    },
  ];
}
