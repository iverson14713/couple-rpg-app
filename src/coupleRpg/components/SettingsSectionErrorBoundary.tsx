import { Component, type ErrorInfo, type ReactNode } from 'react';
import { lq } from '../theme';

type Props = {
  children: ReactNode;
  sectionName: string;
};

type State = {
  hasError: boolean;
  message: string;
  stack: string;
};

const isDev = import.meta.env.DEV;

/** 設定頁單一區塊錯誤隔離，避免整個 App 白屏 */
export class SettingsSectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', stack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[LoveQuest settings] ${this.props.sectionName} crashed:`, error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: '', stack: '' });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className={`mb-4 p-4 ${lq.card}`} role="alert">
        <p className="text-[13px] font-bold text-amber-900">「{this.props.sectionName}」暫時無法顯示</p>
        <p className={`mt-1 text-[12px] leading-relaxed ${lq.textSecondary}`}>
          其他設定仍可正常使用。請稍後再試，或重新整理頁面。
        </p>
        {isDev ? (
          <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-red-50/90 p-2 text-left font-mono text-[10px] leading-snug text-red-900">
            {this.state.message}
            {this.state.stack ? `\n\n${this.state.stack}` : ''}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={this.handleRetry}
          className={`mt-3 min-h-[40px] rounded-xl px-4 text-[13px] font-bold ${lq.btnSecondary}`}
        >
          重試此區塊
        </button>
      </section>
    );
  }
}
