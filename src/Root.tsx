import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { AuthCallbackPage } from './AuthCallbackPage.tsx';
import { isAuthCallbackPath } from './authCallbackEntry.ts';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';
import { getShowcaseSlideById } from './showcase/lovequest/slides.ts';

/** Heavy routes — not loaded on /auth/callback. */
const AppLaunchGate = lazy(() =>
  import('./AppLaunchGate.tsx').then((m) => ({ default: m.AppLaunchGate }))
);
const AppStoreScreenshotMode = lazy(() =>
  import('./pages/AppStoreScreenshotMode.tsx').then((m) => ({ default: m.AppStoreScreenshotMode }))
);
const LoveQuestShowcaseHub = lazy(() =>
  import('./showcase/lovequest/LoveQuestShowcaseHub.tsx').then((m) => ({
    default: m.LoveQuestShowcaseHub,
  }))
);
const LoveQuestShowcaseSingle = lazy(() =>
  import('./showcase/lovequest/LoveQuestShowcaseSingle.tsx').then((m) => ({
    default: m.LoveQuestShowcaseSingle,
  }))
);

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-rose-50/95 to-pink-50/90 text-[14px] font-semibold text-[#8a7a84]">
      載入中…
    </div>
  );
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}

function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/auth/callback' || p.startsWith('/auth/callback/')) return '/auth/callback';
  if (p === '/privacy') return '/privacy';
  if (p === '/terms') return '/terms';
  if (p === '/app-store-screenshots') return '/app-store-screenshots';
  return p;
}

export function Root() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const sync = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (path === '/auth/callback' || isAuthCallbackPath(window.location.pathname)) {
    return <AuthCallbackPage />;
  }

  if (path === '/privacy') {
    return <PrivacyPolicyPage />;
  }

  if (path === '/terms') {
    return <TermsPage />;
  }

  if (path === '/app-store-screenshots') {
    return (
      <LazyRoute>
        <AppStoreScreenshotMode />
      </LazyRoute>
    );
  }

  if (path === '/showcase' || path === '/appstore-preview') {
    return (
      <LazyRoute>
        <LoveQuestShowcaseHub />
      </LazyRoute>
    );
  }

  const singleMatch = path.match(/^\/showcase\/([a-z0-9-]+)$/);
  if (singleMatch) {
    const slideId = singleMatch[1]!;
    if (getShowcaseSlideById(slideId)) {
      return (
        <LazyRoute>
          <LoveQuestShowcaseSingle slideId={slideId} />
        </LazyRoute>
      );
    }
  }

  return (
    <LazyRoute>
      <AppLaunchGate />
    </LazyRoute>
  );
}
