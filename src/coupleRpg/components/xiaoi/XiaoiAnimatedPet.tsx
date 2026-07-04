import type { CSSProperties } from 'react';
import { resolveXiaoiImage } from '../../../assets/xiaoi';
import { getXiaoiStateProfile } from '../../xiaoi/xiaoiStateProfiles';
import type { XiaoiState } from '../../xiaoi/types';

type XiaoiAnimatedPetProps = {
  state: XiaoiState;
  imageName?: string;
  title: string;
  className?: string;
  style?: CSSProperties;
};

const SHADOW_CLASS: Record<XiaoiState, string> = {
  happy: 'lq-xiaoi-shadow--happy',
  sad: 'lq-xiaoi-shadow--sad',
  sleepy: 'lq-xiaoi-shadow--sleepy',
  back_angry: 'lq-xiaoi-shadow--angry',
};

/**
 * Hero 小愛 2.5D 動態：rig + 地面陰影，僅 transform / opacity。
 * Widget 請使用 XiaoiStaticPet（無動畫）。
 */
export function XiaoiAnimatedPet({
  state,
  imageName,
  title,
  className = '',
  style,
}: XiaoiAnimatedPetProps) {
  const profile = getXiaoiStateProfile(state);
  const resolvedImageName = imageName ?? profile.imageName;

  return (
    <>
      <span
        className={`lq-xiaoi-stage-ground-shadow ${SHADOW_CLASS[state]}`}
        aria-hidden
      />
      <div className={`lq-xiaoi-pet-rig ${profile.animationClass}`}>
        <img
          src={resolveXiaoiImage(resolvedImageName)}
          alt={title}
          decoding="async"
          draggable={false}
          className={className}
          style={style}
        />
      </div>
    </>
  );
}
