import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = {
  hasError: boolean;
  message: string;
  stack: string;
};

const isDev = import.meta.env.DEV;

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', stack: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[App] render crash:', error.message, error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetStorage = (): void => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k?.startsWith('cat-calendar-') ||
          k?.startsWith('cat-ai-') ||
          k?.startsWith('weekly-ai-') ||
          k?.startsWith('lovequest-')
        ) {
          keys.push(k);
        }
      }
      keys.forEach((k) => localStorage.removeItem(k));
      console.warn('[App] cleared local keys:', keys);
    } catch (e) {
      console.error('[App] reset storage failed', e);
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center bg-orange-50 px-6 py-10 text-center"
        style={{ minHeight: '100dvh' }}
      >
        <p className="text-5xl" aria-hidden>
          🐱
        </p>
        <h1 className="mt-4 text-lg font-semibold text-stone-900">應用程式暫時無法顯示</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
          請重新整理，若仍失敗可清除本機快取後再試。
        </p>
        {isDev ? (
          <pre className="mt-3 max-h-48 w-full max-w-md overflow-auto rounded-lg bg-white/90 px-3 py-2 text-left font-mono text-[10px] leading-snug text-red-900">
            {this.state.message}
            {this.state.stack ? `\n\n${this.state.stack}` : ''}
          </pre>
        ) : (
          <p className="mt-3 max-w-md break-all rounded-lg bg-white/80 px-3 py-2 text-[11px] text-stone-500">
            {this.state.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow"
          >
            重新整理
          </button>
          <button
            type="button"
            onClick={this.handleResetStorage}
            className="rounded-full border border-orange-300 bg-white px-5 py-2.5 text-sm font-semibold text-orange-800"
          >
            清除 LoveQuest 本機資料並重試
          </button>
        </div>
      </div>
    );
  }
}
