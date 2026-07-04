import type { CSSProperties } from 'react';
import { resolveXiaoiImage } from '../../../assets/xiaoi';
import { getXiaoiStateProfile } from '../../xiaoi/xiaoiStateProfiles';
import type { XiaoiState } from '../../xiaoi/types';

type XiaoiStaticPetProps = {
  state: XiaoiState;
  imageName?: string;
  message?: string | null;
  title?: string;
  className?: string;
  imageClassName?: string;
  captionClassName?: string;
  showCaption?: boolean;
};

/** 靜態小愛：分享卡、設定頁、Widget 預覽等（無絕對定位） */
export function XiaoiStaticPet({
  state,
  imageName,
  message,
  title,
  className = '',
  imageClassName = '',
  captionClassName = '',
  showCaption = true,
}: XiaoiStaticPetProps) {
  const profile = getXiaoiStateProfile(state);
  const resolvedImageName = imageName ?? profile.imageName;
  const resolvedTitle = title ?? profile.displayName;
  const caption = message ?? profile.message;

  return (
    <div className={`flex flex-col items-center ${className}`.trim()}>
      <img
        src={resolveXiaoiImage(resolvedImageName)}
        alt={resolvedTitle}
        decoding="async"
        draggable={false}
        className={imageClassName || 'max-h-24 w-auto object-contain'}
        style={profile.shadowStyle ? { filter: profile.shadowStyle } : undefined}
      />
      {showCaption && caption ? (
        <p
          className={`mt-1 max-w-full truncate text-center text-[11px] font-semibold text-stone-600 ${captionClassName}`.trim()}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
