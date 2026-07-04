import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, Heart } from 'lucide-react';
import { MemoryDetailCard } from './MemoryDetailCard';
import { MemoryShareCard } from './MemoryShareCard';
import { formatMemoryDisplayDate } from '../lib/dailyMemoryLabels';
import {
  buildMemorySharePayload,
  captureMemoryShareCard,
  shareMemoryCard,
  type MemorySharePayload,
} from '../lib/dailyMemoryShareExport';
import type { CoupleDailyNote } from '../storage/dailyNotesTypes';
import { useToast } from '../../context/ToastContext';
import { lq } from '../theme';

type Props = {
  note: CoupleDailyNote;
  nameA: string;
  nameB: string;
  relationshipStart: string;
  onBack: () => void;
};

export function DailyMemoryDetail({ note, nameA, nameB, relationshipStart, onBack }: Props) {
  const { showToast } = useToast();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharePayload, setSharePayload] = useState<MemorySharePayload | null>(null);
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const payload = await buildMemorySharePayload(note, nameA, nameB, relationshipStart);
      flushSync(() => {
        setSharePayload(payload);
      });

      await new Promise((r) => window.setTimeout(r, 120));

      const el = shareCardRef.current;
      if (!el) {
        showToast('分享失敗，請稍後再試。', 'error', { position: 'top' });
        return;
      }

      const blob = await captureMemoryShareCard(el);
      const result = await shareMemoryCard(blob, payload);

      if (result === 'shared') {
        showToast('已開啟分享', 'success', { position: 'top' });
      } else if (result === 'downloaded') {
        showToast('已下載分享卡', 'success', { position: 'top' });
      } else if (result === 'cancelled') {
        /* user cancelled — silent */
      } else {
        showToast('分享失敗，請稍後再試。', 'error', { position: 'top' });
      }
    } catch (e) {
      console.error('[memory-share]', e);
      showToast('分享失敗，請稍後再試。', 'error', { position: 'top' });
    } finally {
      setSharing(false);
      setSharePayload(null);
    }
  };

  return (
    <div className="px-1 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-0.5 text-[12px] font-bold text-stone-600 active:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        返回
      </button>

      <header className="mb-4 px-1 text-center">
        <p className="text-[11px] font-bold tracking-[0.18em] text-rose-400">LOVEQUEST</p>
        <h1 className={`mt-1 text-[22px] font-extrabold ${lq.text}`}>❤️ 今日小回憶</h1>
        <p className="mt-1.5 text-[13px] font-semibold text-stone-400">
          {formatMemoryDisplayDate(note.noteDate)}
        </p>
      </header>

      <MemoryDetailCard
        note={note}
        nameA={nameA}
        nameB={nameB}
        relationshipStart={relationshipStart}
      />

      <button
        type="button"
        disabled={sharing}
        onClick={() => void onShare()}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold text-white shadow-md active:scale-[0.99] disabled:opacity-60 ${lq.btnPrimary}`}
      >
        <Heart className="h-4 w-4" aria-hidden />
        {sharing ? '產生分享卡…' : '❤️ 分享回憶'}
      </button>

      {/* Reserved for future AI daily summary */}
      <div
        className="mt-6 min-h-[4.5rem] rounded-2xl border border-dashed border-rose-100/80 bg-rose-50/20 px-4 py-3"
        aria-hidden
        data-memory-ai-summary-slot
      />

      {/* Off-screen IG Story share card — separate from detail UI */}
      {sharePayload ? (
        <div className="lq-memory-share-card-host" aria-hidden>
          <MemoryShareCard ref={shareCardRef} payload={sharePayload} />
        </div>
      ) : null}
    </div>
  );
}
