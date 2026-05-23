import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppErrorBoundary } from './AppErrorBoundary.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { initAuthDebug } from './services/auth/authDebug.ts';
import { initCapacitorAuthBridge } from './native/capacitorAuthBridge.ts';
import { repairCorruptedLocalStorage } from './safeStorage.ts';
import { Root } from './Root.tsx';
import { SupabaseAuthProvider } from './useSupabaseAuth.ts';
import './index.css';

repairCorruptedLocalStorage();
initCapacitorAuthBridge();
initAuthDebug();

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[App] #root element missing — cannot mount React');
} else {
  /** 一律經 Root 路由，確保 appUrlOpen → /auth/callback 能切換到 AuthCallbackPage */
  const tree = (
    <AppErrorBoundary>
      <ToastProvider>
        <SupabaseAuthProvider>
          <Root />
        </SupabaseAuthProvider>
      </ToastProvider>
    </AppErrorBoundary>
  );

  createRoot(rootEl).render(<StrictMode>{tree}</StrictMode>);
}
