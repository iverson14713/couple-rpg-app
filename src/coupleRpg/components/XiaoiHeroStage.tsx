import type { CSSProperties } from 'react';
import { getXiaoiStateProfile } from '../xiaoi/xiaoiStateProfiles';
import type { XiaoiState } from '../xiaoi/types';
import { XiaoiAnimatedPet } from './xiaoi/XiaoiAnimatedPet';

type XiaoiHeroStageProps = {
  state: XiaoiState;
  imageName: string;
  title: string;
};

/** 首頁 Hero 卡右側：固定舞台 + 固定文案區 */
export function XiaoiHeroStage({ state, imageName, title }: XiaoiHeroStageProps) {
  const profile = getXiaoiStateProfile(state);
  const { heroLayout: visual } = profile;

  return (
    <>
      <div className="lq-xiaoi-stage">
        <XiaoiAnimatedPet
          state={state}
          imageName={imageName}
          title={title}
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
      <p className="lq-xiaoi-stage-caption">{profile.message}</p>
    </>
  );
}
