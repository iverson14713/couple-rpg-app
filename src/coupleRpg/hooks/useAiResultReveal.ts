import { useCallback, useEffect, useRef, useState } from 'react';

const HIGHLIGHT_MS = 2200;
const MAX_SCROLL_ATTEMPTS = 12;

/** 成功取得 AI 結果後：在 scroll 容器內捲動至結果區 + 短暫 highlight */
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

  const scrollToResult = useCallback((attempt = 0) => {
    const target = resultRef.current;
    const scrollParent = scrollRef.current;

    if (!target || target.offsetHeight < 4) {
      if (attempt < MAX_SCROLL_ATTEMPTS) {
        requestAnimationFrame(() => scrollToResult(attempt + 1));
      }
      return;
    }

    if (scrollParent) {
      const parentTop = scrollParent.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      const offset = targetTop - parentTop + scrollParent.scrollTop - 8;
      scrollParent.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const revealResult = useCallback(() => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    requestAnimationFrame(() => {
      scrollToResult(0);
      setHighlight(true);
      highlightTimerRef.current = setTimeout(() => {
        setHighlight(false);
        highlightTimerRef.current = null;
      }, HIGHLIGHT_MS);
    });
  }, [scrollToResult]);

  return { scrollRef, resultRef, highlight, revealResult };
}
