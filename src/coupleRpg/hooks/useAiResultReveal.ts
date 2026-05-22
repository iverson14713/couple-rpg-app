import { useCallback, useEffect, useRef, useState } from 'react';

/** 成功取得 AI 結果後：捲動至結果區 + 短暫 highlight */
export function useAiResultReveal() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    []
  );

  const revealResult = useCallback(() => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    requestAnimationFrame(() => {
      const target = resultRef.current;
      if (!target) return;

      const scrollParent = scrollRef.current;
      if (scrollParent) {
        const parentTop = scrollParent.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        const offset = targetTop - parentTop + scrollParent.scrollTop - 12;
        scrollParent.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setHighlight(true);
      highlightTimerRef.current = setTimeout(() => {
        setHighlight(false);
        highlightTimerRef.current = null;
      }, 2200);
    });
  }, []);

  return { scrollRef, resultRef, highlight, revealResult };
}
