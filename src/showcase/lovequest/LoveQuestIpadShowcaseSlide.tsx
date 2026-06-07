import type { LoveQuestShowcaseSlide } from './slides';
import {
  IPAD_13_SCREEN,
  IPAD_LAYOUT,
  getIpadPhoneOuterSize,
} from './ipadConstants';
import {
  LQ_SHOWCASE_FONT,
  LQ_SHOWCASE_GRADIENT,
} from './constants';
import { ShowcaseIpadFeatureRow } from './components/ShowcaseIpadFeatureRow';
import { ShowcaseIpadLeftColumn } from './components/ShowcaseIpadLeftColumn';
import { ShowcaseOrbs } from './components/ShowcaseOrbs';
import { ShowcasePhoneFrame } from './components/ShowcasePhoneFrame';

type Props = {
  slide: LoveQuestShowcaseSlide;
  exportId?: string;
  nativeScreenshot?: boolean;
};

/**
 * iPad 13" App Store 雙欄式宣傳畫布（2064×2752）
 * 左：超大標題 + 特色 + 情侶插畫｜右：完整手機 mockup｜底：功能卡列
 */
export function LoveQuestIpadShowcaseSlideCanvas({
  slide,
  exportId,
  nativeScreenshot = false,
}: Props) {
  const { w, h } = IPAD_13_SCREEN;
  const { padX, padTop, padBottom, colGap, leftColW, featureRowH } = IPAD_LAYOUT;
  const phone = getIpadPhoneOuterSize();
  const Screen = slide.Screen;

  return (
    <article
      id={exportId}
      className={`lq-showcase-canvas lq-ipad-showcase-canvas relative flex flex-col overflow-hidden${
        nativeScreenshot ? ' lq-native-screenshot-canvas' : ''
      }`}
      style={{
        width: w,
        height: h,
        fontFamily: LQ_SHOWCASE_FONT,
        background: LQ_SHOWCASE_GRADIENT,
      }}
    >
      {!nativeScreenshot ? (
        <>
          <span className="lq-showcase-canvas-spotlight pointer-events-none absolute inset-0 z-[1]" aria-hidden />
          <ShowcaseOrbs />
        </>
      ) : null}

      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        style={{ paddingTop: padTop, paddingBottom: padBottom }}
      >
        <div
          className="flex min-h-0 flex-1 items-stretch"
          style={{
            paddingLeft: padX,
            paddingRight: padX,
            gap: colGap,
          }}
        >
          <div className="shrink-0" style={{ width: leftColW }}>
            <ShowcaseIpadLeftColumn slide={slide} />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div
              className="lq-ipad-phone-stage relative flex items-center justify-center"
              style={{ width: phone.width, height: phone.height, isolation: 'isolate' }}
            >
              <ShowcasePhoneFrame device="ipad-13">
                <Screen />
              </ShowcasePhoneFrame>
            </div>
          </div>
        </div>

        <div className="shrink-0" style={{ height: featureRowH, marginTop: 40 }}>
          <ShowcaseIpadFeatureRow />
        </div>
      </div>
    </article>
  );
}
