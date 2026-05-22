/** OAuth / email callback path — keep free of CoupleRpg / LoveQuestContext imports. */
export function isAuthCallbackPath(pathname: string = window.location.pathname): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '/auth/callback' || p.startsWith('/auth/callback/');
}
