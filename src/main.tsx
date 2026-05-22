import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './AppErrorBoundary.tsx';
import { AuthCallbackPage } from './AuthCallbackPage.tsx';
import { isAuthCallbackPath } from './authCallbackEntry.ts';
import { ToastProvider } from './context/ToastContext.tsx';
import { initCapacitorAuthBridge } from './native/capacitorAuthBridge.ts';
import { repairCorruptedLocalStorage } from './safeStorage.ts';
import { Root } from './Root.tsx';
import './index.css';

repairCorruptedLocalStorage();
initCapacitorAuthBridge();

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[App] #root element missing — cannot mount React');
} else {
  const tree = isAuthCallbackPath() ? (
    <AppErrorBoundary>
      <AuthCallbackPage />
    </AppErrorBoundary>
  ) : (
    <AppErrorBoundary>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </AppErrorBoundary>
  );

  createRoot(rootEl).render(<StrictMode>{tree}</StrictMode>);
}
