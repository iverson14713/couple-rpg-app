import type { CSSProperties } from 'react';
import { resolveXiaoiImage } from '../../assets/xiaoi';
import { XIAOI_HERO_MESSAGES, type XiaoiState } from '../lib/xiaoiState';
import { XIAOI_VISUAL_CONFIG } from '../lib/xiaoiVisualConfig';

type XiaoiHeroStageProps = {
  state: XiaoiState;
  imageName: string;
  title: string;
};

/** 首頁 Hero 卡右側：固定舞台 + 固定文案區 */
export function XiaoiHeroStage({ state, imageName, title }: XiaoiHeroStageProps) {
  const visual = XIAOI_VISUAL_CONFIG[state];
  const message = XIAOI_HERO_MESSAGES[state];

  return (
    <>
      <div className="lq-xiaoi-stage">
        <img
          src={resolveXiaoiImage(imageName)}
          alt={title}
          decoding="async"
          draggable={false}
          className="lq-xiaoi-stage-img"
          style={
            {
              '--offsetX': `${visual.offsetX}px`,
              '--offsetY': `${visual.offsetY}px`,
              '--scale': String(visual.scale),
            } as CSSProperties
          }
        />
      </div>
      <p className="lq-xiaoi-stage-caption">{message}</p>
    </>
  );
}
