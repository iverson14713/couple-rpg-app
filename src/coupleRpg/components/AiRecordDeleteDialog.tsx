import { createPortal } from 'react-dom';
import { lq } from '../theme';

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AiRecordDeleteDialog({ open, onConfirm, onCancel }: Props) {
  if (!open) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ai-delete-title"
      aria-describedby="ai-delete-desc"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/45"
        aria-label="取消"
        onClick={onCancel}
      />
      <div className={`relative z-10 w-full max-w-sm p-5 ${lq.cardElevated}`}>
        <p id="ai-delete-title" className={`text-[16px] font-bold ${lq.text}`}>
          刪除 AI 紀錄
        </p>
        <p id="ai-delete-desc" className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>
          確定要刪除這筆 AI 紀錄嗎？
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className={`flex-1 ${lq.btnSecondary}`}>
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 inline-flex h-11 min-h-[44px] items-center justify-center rounded-[14px] bg-rose-600 px-4 text-[15px] font-semibold text-white active:scale-[0.98]"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
}
