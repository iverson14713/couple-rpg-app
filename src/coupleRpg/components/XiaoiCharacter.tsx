import { resolveXiaoiImage } from '../../assets/xiaoi';
import type { XiaoiStateResult } from '../lib/xiaoiState';

type XiaoiCharacterProps = {
  xiaoi: Pick<XiaoiStateResult, 'imageName' | 'title'>;
  message?: string;
  className?: string;
  imageClassName?: string;
  wrapClassName?: string;
  captionClassName?: string;
  showMessage?: boolean;
};

/** 小愛角色圖 */
export function XiaoiCharacter({
  xiaoi,
  message,
  className = '',
  imageClassName = '',
  wrapClassName = '',
  captionClassName = '',
  showMessage = true,
}: XiaoiCharacterProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`lq-xiaoi-figure-wrap ${wrapClassName}`}>
        <img
          src={resolveXiaoiImage(xiaoi.imageName)}
          alt={xiaoi.title}
          decoding="async"
          draggable={false}
          className={
            imageClassName.includes('lq-xiaoi-figure-img--hero')
              ? imageClassName
              : `lq-xiaoi-figure-img ${imageClassName}`
          }
        />
      </div>
      {showMessage && message ? (
        <p
          className={`lq-xiaoi-caption mt-1 max-w-full truncate text-center text-[11px] font-semibold text-white/90 ${captionClassName}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
