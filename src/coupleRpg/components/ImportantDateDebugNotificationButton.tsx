import { useState } from 'react';
import { isLoveQuestNotificationDebugEnabled } from '../lib/loveQuestNotificationDebug';
import {
  isLoveQuestNativeNotificationsAvailable,
  scheduleLoveQuestDebugTestNotification,
} from '../../services/notificationService';
import { lq } from '../theme';

export function ImportantDateDebugNotificationButton() {
  if (!isLoveQuestNotificationDebugEnabled()) return null;

  const native = isLoveQuestNativeNotificationsAvailable();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onTest = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      if (!native) {
        setFeedback('網頁版無法測試本機推播，請用 iOS 真機 App');
        return;
      }
      const result = await scheduleLoveQuestDebugTestNotification();
      setFeedback(result.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`mb-3 rounded-xl border border-dashed border-violet-300/70 bg-violet-50/50 p-3 ${lq.cardSoft}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700/90">開發模式</p>
      <p className={`mt-1 text-[11px] leading-relaxed ${lq.textSecondary}`}>
        排程 10 秒後的測試推播；可關閉 App 等待通知。正式上架不會顯示此區塊。
      </p>
      <button
        type="button"
        onClick={() => void onTest()}
        disabled={busy}
        className={`mt-2.5 ${lq.btnSecondary} !h-9 !min-h-9 w-full !text-[13px] !text-violet-800`}
      >
        {busy ? '處理中…' : '測試推播（10 秒後）'}
      </button>
      {feedback ? (
        <p
          className={`mt-2 text-center text-[11px] font-semibold ${
            feedback.includes('已排程') ? 'text-emerald-700' : 'text-amber-800'
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
