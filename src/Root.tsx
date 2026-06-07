import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { AuthCallbackPage } from './AuthCallbackPage.tsx';
import { AUTH_ROUTE_EVENT, shouldRenderAuthCallback } from './services/auth/authRoute.ts';
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
const LoveQuestIpadAppStoreScreenshotPage = lazy(() =>
  import('./showcase/lovequest/LoveQuestIpadAppStoreScreenshotPage.tsx').then((m) => ({
    default: m.LoveQuestIpadAppStoreScreenshotPage,
  }))
);

const LoveQuestAppStoreScreenshotPage = lazy(() =>
  import('./showcase/lovequest/LoveQuestAppStoreScreenshotPage.tsx').then((m) => ({
    default: m.LoveQuestAppStoreScreenshotPage,
  }))
);
const LoveQuestAppStoreScreenshotIndex = lazy(() =>
  import('./showcase/lovequest/LoveQuestAppStoreScreenshotIndex.tsx').then((m) => ({
    default: m.LoveQuestAppStoreScreenshotIndex,
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
  if (p === '/privacy' || p.startsWith('/privacy/')) return '/privacy';
  if (p === '/terms' || p.startsWith('/terms/')) return '/terms';
  if (p === '/app-store-screenshots') return '/app-store-screenshots';
  if (p === '/app-store-screenshot/lovequest') return '/app-store-screenshot/lovequest';
  if (p === '/app-store-screenshot/lovequest-ipad') return '/app-store-screenshot/lovequest-ipad';
  return p;
}

function readAppPath(): string {
  if (shouldRenderAuthCallback()) return '/auth/callback';
  return normalizePath(window.location.pathname);
}

export function Root() {
  const [path, setPath] = useState(() => readAppPath());

  useEffect(() => {
    const sync = () => setPath(readAppPath());
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener(AUTH_ROUTE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(AUTH_ROUTE_EVENT, sync);
    };
  }, []);

  if (shouldRenderAuthCallback()) {
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

  const appStoreIpadMatch = path.match(/^\/app-store-screenshot\/lovequest-ipad\/(\d+)$/);
  if (appStoreIpadMatch) {
    const slideIndex = parseInt(appStoreIpadMatch[1]!, 10);
    if (slideIndex >= 1 && slideIndex <= 5) {
      return (
        <LazyRoute>
          <LoveQuestIpadAppStoreScreenshotPage slideIndex={slideIndex} />
        </LazyRoute>
      );
    }
  }

  const appStoreShotMatch = path.match(/^\/app-store-screenshot\/lovequest\/(\d+)$/);
  if (appStoreShotMatch) {
    const slideIndex = parseInt(appStoreShotMatch[1]!, 10);
    if (slideIndex >= 1 && slideIndex <= 5) {
      return (
        <LazyRoute>
          <LoveQuestAppStoreScreenshotPage slideIndex={slideIndex} />
        </LazyRoute>
      );
    }
  }

  if (path === '/app-store-screenshot/lovequest') {
    return (
      <LazyRoute>
        <LoveQuestAppStoreScreenshotIndex />
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
