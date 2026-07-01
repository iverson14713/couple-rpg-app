import { useState } from 'react';
import { XIAOI_IMAGES } from '../../../assets/xiaoi';
import { lq } from '../../theme';
import { SettingsSubPageHeader } from './SettingsSubPageHeader';

const WIDGET_TYPES = [
  {
    title: '經典資訊 Widget',
    description: '查看交往天數、紀念日倒數與火苗，適合喜歡清楚資訊的人。',
    emoji: '💕',
  },
  {
    title: '小愛寵物 Widget',
    description: '有互動會開心，太久沒互動會委屈，提醒你們每天多愛對方一點。',
    emoji: '🐾',
  },
] as const;

const ADD_WIDGET_STEPS = [
  '長按 iPhone 桌面空白處',
  '點左上角「＋」',
  '搜尋 LoveQuest',
  '選擇「經典資訊」或「小愛寵物」',
  '加入桌面',
] as const;

type Props = {
  onBack: () => void;
};

export function SettingsWidgetScreen({ onBack }: Props) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <>
      <SettingsSubPageHeader
        title="桌面 Widget"
        subtitle="經典資訊 Widget 與小愛寵物 Widget"
        onBack={onBack}
      />

      <div className="space-y-3">
        <section className={`p-4 ${lq.card}`}>
          <h3 className={`text-[17px] font-extrabold leading-snug ${lq.text}`}>
            把你們的愛放在桌面上
          </h3>
          <p className={`mt-1.5 text-[13px] leading-relaxed ${lq.textSecondary}`}>
            選擇你喜歡的 Widget，把交往天數、紀念日倒數，或會撒嬌的小愛放到手機桌面。
          </p>

          <div className="lq-widget-guide-preview mt-4" aria-hidden>
            <img
              src={XIAOI_IMAGES.xiaoi_promo}
              alt=""
              className="lq-widget-guide-preview-img"
              decoding="async"
              draggable={false}
            />
          </div>
        </section>

        {WIDGET_TYPES.map((item) => (
          <section key={item.title} className={`p-4 ${lq.card}`}>
            <div className="flex items-start gap-2.5">
              <span className="text-xl" aria-hidden>
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className={`text-[15px] font-extrabold ${lq.text}`}>{item.title}</h4>
                <p className={`mt-1 text-[13px] leading-relaxed ${lq.textSecondary}`}>
                  {item.description}
                </p>
              </div>
            </div>
          </section>
        ))}

        <section className={`p-4 ${lq.card}`}>
          <button
            type="button"
            onClick={() => setShowSteps((open) => !open)}
            className={`w-full ${lq.btnPrimary}`}
            aria-expanded={showSteps}
          >
            {showSteps ? '收起教學' : '查看加入教學'}
          </button>

          <p className={`mt-2.5 text-center text-[11px] leading-snug ${lq.textSecondary}`}>
            請長按 iPhone 桌面空白處，點選「＋」，搜尋 LoveQuest 加入 Widget。
          </p>

          {showSteps ? (
            <ol className="mt-3 space-y-2 border-t border-rose-100/80 pt-3">
              {ADD_WIDGET_STEPS.map((step, index) => (
                <li
                  key={step}
                  className={`flex gap-2.5 text-[13px] leading-snug ${lq.textSecondary}`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      </div>
    </>
  );
}
