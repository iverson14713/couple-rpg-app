import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type AiToastKind = 'success' | 'error';

type AiToastState = {
  kind: AiToastKind;
  message: string;
} | null;

type AiToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showAiGenerated: () => void;
};

const AiToastContext = createContext<AiToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3200;

export function AiToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<AiToastState>(null);

  const showSuccess = useCallback((message: string) => {
    setToast({ kind: 'success', message });
  }, []);

  const showError = useCallback((message: string) => {
    setToast({ kind: 'error', message });
  }, []);

  const showAiGenerated = useCallback(() => {
    showSuccess('AI 內容已產生完成');
  }, [showSuccess]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo(
    () => ({ showSuccess, showError, showAiGenerated }),
    [showSuccess, showError, showAiGenerated]
  );

  return (
    <AiToastContext.Provider value={value}>
      {children}
      <AiToastView toast={toast} onDismiss={() => setToast(null)} />
    </AiToastContext.Provider>
  );
}

export function useAiToast(): AiToastContextValue {
  const ctx = useContext(AiToastContext);
  if (!ctx) {
    throw new Error('useAiToast must be used within AiToastProvider');
  }
  return ctx;
}

function AiToastView({
  toast,
  onDismiss,
}: {
  toast: AiToastState;
  onDismiss: () => void;
}) {
  if (!toast || typeof document === 'undefined') return null;

  const isSuccess = toast.kind === 'success';

  return createPortal(
    <div
      className="pointer-events-none fixed left-4 right-4 top-4 z-[110] mx-auto max-w-md"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onDismiss}
        className={`pointer-events-auto w-full rounded-2xl px-4 py-3.5 text-center text-[14px] font-bold shadow-lg ring-1 active:opacity-90 ${
          isSuccess
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 ring-emerald-100'
            : 'border-red-200 bg-red-50 text-red-900 ring-red-100'
        }`}
      >
        {isSuccess ? '✓ ' : '⚠ '}
        {toast.message}
      </button>
    </div>,
    document.body
  );
}
