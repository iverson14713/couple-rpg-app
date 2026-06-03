import { useLoveQuest } from '../context/LoveQuestContext';
import { lq } from '../theme';

/** Lv.3 完成 2/2 後的連擊加成提示 */
export function Level3ComboNotice() {
  const { level3ComboNotice, clearLevel3ComboNotice } = useLoveQuest();
  if (!level3ComboNotice) return null;

  const { coins, expGranted } = level3ComboNotice;

  return (
    <section
      className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/95 via-white to-rose-50/80 px-4 py-3.5 shadow-sm ring-1 ring-violet-100/80"
      role="status"
    >
      <p className="text-[15px] font-extrabold text-violet-900">甜蜜連擊完成！</p>
      <p className="mt-1 text-[13px] font-bold text-rose-700">額外獲得 LoveCoin +{coins}</p>
      {expGranted > 0 ? (
        <p className="mt-0.5 text-[12px] font-semibold text-violet-700">EXP +{expGranted}</p>
      ) : null}
      <button
        type="button"
        onClick={clearLevel3ComboNotice}
        className={`mt-2.5 w-full ${lq.btnSecondary} !min-h-9 !text-[12px]`}
      >
        知道了
      </button>
    </section>
  );
}
