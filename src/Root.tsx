import { useEffect, useState } from 'react';
import { AppLaunchGate } from './AppLaunchGate.tsx';
import { AuthCallbackPage } from './AuthCallbackPage.tsx';
import { AppStoreScreenshotMode } from './pages/AppStoreScreenshotMode.tsx';
import { LoveQuestShowcaseHub } from './showcase/lovequest/LoveQuestShowcaseHub.tsx';
import { LoveQuestShowcaseSingle } from './showcase/lovequest/LoveQuestShowcaseSingle.tsx';
import { getShowcaseSlideById } from './showcase/lovequest/slides.ts';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { TermsPage } from './pages/TermsPage.tsx';

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

  if (path === '/auth/callback') {
    return <AuthCallbackPage />;
  }

  if (path === '/privacy') {
    return <PrivacyPolicyPage />;
  }

  if (path === '/terms') {
    return <TermsPage />;
  }

  if (path === '/app-store-screenshots') {
    return <AppStoreScreenshotMode />;
  }

  if (path === '/showcase' || path === '/appstore-preview') {
    return <LoveQuestShowcaseHub />;
  }

  const singleMatch = path.match(/^\/showcase\/([a-z0-9-]+)$/);
  if (singleMatch) {
    const slideId = singleMatch[1]!;
    if (getShowcaseSlideById(slideId)) {
      return <LoveQuestShowcaseSingle slideId={slideId} />;
    }
  }

  return <AppLaunchGate />;
}
