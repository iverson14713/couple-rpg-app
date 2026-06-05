import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getAuthCallbackUrl } from './services/auth/authRedirect';
import {
  isAppleOAuthEnabled,
  isAppleSignInNativeUi,
  signInWithApple as runAppleSignIn,
} from './services/auth/appleSignIn';
import { signInWithGoogleOAuth } from './services/auth/googleSignIn';
import { authLog } from './services/auth/authDebug';
import { clearAuthGrace, isWithinAuthGracePeriod, markAuthGraceStart } from './services/auth/authGrace';
import { subscribeAuthStateChange } from './services/auth/authListenerSingleton';
import { AUTH_ROUTE_EVENT, AUTH_SESSION_SYNC_EVENT } from './services/auth/authRoute';
import { confirmSignedOutAfterRetries, recoverAuthSession } from './services/auth/authSession';
import { getSupabaseClient } from './supabaseClient';
import {
  clearLoveQuestUserData,
  prepareLoveQuestStorageForLogin,
} from './coupleRpg/storage/clearLoveQuestStorage';
import {
  getActiveStorageUserId,
  setActiveStorageUserId,
} from './coupleRpg/storage/storageSession';
import { flushAiFavoritesBeforeLogout } from './coupleRpg/services/aiFavoritesSyncService';
import { isAccountDeletionInProgress } from './coupleRpg/lib/accountDeletionGuard';

export type UserProfile = {
  id: string;
  display_name: string | null;
};

function resolveAuthProvider(user: User): string {
  const meta = user.app_metadata?.provider;
  if (typeof meta === 'string' && meta.trim()) return meta;
  const identity = user.identities?.find((i) => i.provider)?.provider;
  return identity ?? 'unknown';
}

function logActiveAuthSession(user: User, event: string): void {
  authLog('auth.session.active', {
    event,
    userId: user.id,
    provider: resolveAuthProvider(user),
    email: user.email ?? null,
  });
}

export type SupabaseAuthValue = {
  supabase: SupabaseClient | null;
  configured: boolean;
  session: Session | null;
  user: Session['user'] | null;
  profile: UserProfile | null;
  authReady: boolean;
  appleOAuthEnabled: boolean;
  appleSignInNativeUi: boolean;
  loadProfile: (userId: string) => Promise<UserProfile | null>;
  updateDisplayName: (displayName: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => ReturnType<SupabaseClient['auth']['signInWithPassword']>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => ReturnType<SupabaseClient['auth']['signUp']>;
  signInWithGoogle: () => Promise<{ data: null; error: Error | null }>;
  signInWithApple: () => Promise<
    | { data: null; error: Error | null }
    | Awaited<ReturnType<SupabaseClient['auth']['signInWithOAuth']>>
  >;
  signOut: () => ReturnType<SupabaseClient['auth']['signOut']>;
};

const SupabaseAuthContext = createContext<SupabaseAuthValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const explicitSignOutRef = useRef(false);
  const bootReadyRef = useRef(false);
  const bootSessionResolvedRef = useRef(false);
  const signedOutHandlingRef = useRef(false);
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitSession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const applySessionSideEffects = useCallback(
    (s: Session | null, event: string) => {
      if (event === 'SIGNED_OUT') {
        if (isAccountDeletionInProgress()) {
          authLog('auth.onAuthStateChange.accountDelete', { event });
          setActiveStorageUserId(null);
          setProfile(null);
        } else {
          const signedOutUserId = getActiveStorageUserId();
          if (signedOutUserId) {
            void flushAiFavoritesBeforeLogout(supabase!, signedOutUserId).catch((e) => {
              console.warn('[ai-favorites] logout flush failed:', e);
            });
          }
          clearLoveQuestUserData(signedOutUserId);
          setActiveStorageUserId(null);
        }
        return;
      }

      if (s?.user?.id) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          prepareLoveQuestStorageForLogin(s.user.id);
        }
        setActiveStorageUserId(s.user.id);
      }
    },
    [supabase]
  );

  const handleSignedOut = useCallback(
    (s: Session | null) => {
      applySessionSideEffects(s, 'SIGNED_OUT');
      commitSession(s);
      setReady(true);
    },
    [applySessionSideEffects, commitSession]
  );

  const loadProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('[profiles]', error.message);
        return null;
      }
      if (data) return data as UserProfile;
      const { error: upErr } = await supabase.from('profiles').upsert(
        { id: userId, display_name: null },
        { onConflict: 'id' }
      );
      if (upErr) {
        console.warn('[profiles upsert]', upErr.message);
        return null;
      }
      const { data: again, error: e2 } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', userId)
        .maybeSingle();
      if (e2 || !again) return null;
      return again as UserProfile;
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) {
      commitSession(null);
      setProfile(null);
      setReady(true);
      return;
    }

    let cancelled = false;

    const markBootReady = (reason: string) => {
      if (cancelled || bootReadyRef.current) return;
      bootReadyRef.current = true;
      authLog('auth.boot.ready', { reason });
      setReady(true);
    };

    const handleSpuriousSignedOut = async () => {
      if (explicitSignOutRef.current || isAccountDeletionInProgress()) {
        explicitSignOutRef.current = false;
        handleSignedOut(null);
        return;
      }

      const recovered = await confirmSignedOutAfterRetries(supabase, sessionRef.current, {
        retries: 3,
        delayMs: 650,
      });

      if (cancelled) return;

      if (recovered?.access_token) {
        authLog('auth.onAuthStateChange.recovered_after_signed_out', {
          userId: recovered.user.id,
        });
        applySessionSideEffects(recovered, 'SIGNED_IN');
        commitSession(recovered);
        setReady(true);
        return;
      }

      if (isWithinAuthGracePeriod() && sessionRef.current?.access_token) {
        authLog('auth.signed_out.ignored_during_grace', {
          userId: sessionRef.current.user.id,
        });
        return;
      }

      if (isWithinAuthGracePeriod()) {
        authLog('auth.signed_out.ignored_during_grace', { userId: null });
        return;
      }

      handleSignedOut(null);
    };

    const onAuthEvent = (event: AuthChangeEvent, s: Session | null) => {
      authLog('auth.onAuthStateChange', { event, hasSession: Boolean(s) });

      if (event === 'TOKEN_REFRESHED') {
        if (s?.access_token && !sessionRef.current?.access_token) {
          applySessionSideEffects(s, event);
          commitSession(s);
        }
        setReady(true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        if (!bootSessionResolvedRef.current && !explicitSignOutRef.current) {
          authLog('auth.signed_out.defer_until_boot', {});
          return;
        }
        if (signedOutHandlingRef.current) {
          authLog('auth.signed_out.skip_duplicate', {});
          return;
        }
        signedOutHandlingRef.current = true;
        void handleSpuriousSignedOut().finally(() => {
          signedOutHandlingRef.current = false;
        });
        return;
      }

      if (s?.access_token) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          logActiveAuthSession(s.user, event);
        }
        if (event === 'SIGNED_IN') {
          explicitSignOutRef.current = false;
          markAuthGraceStart('auth.onAuthStateChange.SIGNED_IN', s.user.id);
        }
        applySessionSideEffects(s, event);
        commitSession(s);
      } else {
        authLog('auth.onAuthStateChange.ignore_null_session', { event });
      }

      if (event === 'INITIAL_SESSION') {
        if (s?.access_token) {
          bootSessionResolvedRef.current = true;
          markBootReady('INITIAL_SESSION');
        } else {
          authLog('auth.INITIAL_SESSION.null_recovering', {});
          void recoverAuthSession(supabase, { allowRefresh: false, attempts: 20, intervalMs: 150 }).then(
            (recovered) => {
              if (cancelled) return;
              if (recovered?.access_token) {
                logActiveAuthSession(recovered.user, 'INITIAL_SESSION_recover');
                applySessionSideEffects(recovered, 'INITIAL_SESSION_recover');
                commitSession(recovered);
                authLog('auth.INITIAL_SESSION.recovered', { userId: recovered.user.id });
              } else if (!sessionRef.current?.access_token) {
                authLog('auth.INITIAL_SESSION.no_session', {});
                commitSession(null);
              }
              bootSessionResolvedRef.current = true;
              markBootReady('INITIAL_SESSION_recover');
            }
          );
        }
        return;
      }

      setReady(true);
    };

    const unsubscribe = subscribeAuthStateChange(supabase, onAuthEvent);

    const fallbackTimer = window.setTimeout(() => {
      if (!bootSessionResolvedRef.current) {
        bootSessionResolvedRef.current = true;
      }
      markBootReady('fallback_timeout');
    }, 5000);

    void recoverAuthSession(supabase, { allowRefresh: false, attempts: 8, intervalMs: 150 }).then(
      (s) => {
        if (cancelled) return;
        if (s?.access_token) {
          applySessionSideEffects(s, 'getSession_boot');
          commitSession(s);
          authLog('auth.getSession.boot.ok', { userId: s.user.id });
        } else if (sessionRef.current?.access_token) {
          authLog('auth.getSession.boot.preserve_existing', {
            userId: sessionRef.current.user.id,
          });
        } else {
          authLog('auth.getSession.boot.defer_until_initial_session', {});
        }
        if (bootSessionResolvedRef.current && !bootReadyRef.current) {
          markBootReady('getSession_boot');
        }
      }
    );

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [supabase, applySessionSideEffects, commitSession, handleSignedOut]);

  useEffect(() => {
    if (!supabase) return;

    const refreshFromStorage = (reason: string) => {
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
      }
      refreshDebounceRef.current = window.setTimeout(() => {
        void recoverAuthSession(supabase, {
          knownSession: sessionRef.current,
          allowRefresh: false,
          attempts: 2,
          intervalMs: 80,
        }).then((s) => {
          if (s?.access_token) {
            applySessionSideEffects(s, `refresh:${reason}`);
            commitSession(s);
            setReady(true);
            authLog('auth.refreshSession', { hasSession: true, reason });
            return;
          }
          if (sessionRef.current?.access_token) {
            authLog('auth.refreshSession.preserve_existing', {
              reason,
              userId: sessionRef.current.user.id,
            });
            return;
          }
          if (!isWithinAuthGracePeriod()) {
            authLog('auth.refreshSession', { hasSession: false, reason });
          }
        });
      }, 120);
    };

    const onAuthRoute = () => refreshFromStorage('auth_route');
    const onSessionSync = () => refreshFromStorage('auth_session_sync');
    window.addEventListener(AUTH_ROUTE_EVENT, onAuthRoute);
    window.addEventListener(AUTH_SESSION_SYNC_EVENT, onSessionSync);
    return () => {
      window.removeEventListener(AUTH_ROUTE_EVENT, onAuthRoute);
      window.removeEventListener(AUTH_SESSION_SYNC_EVENT, onSessionSync);
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
      }
    };
  }, [supabase, applySessionSideEffects, commitSession]);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void loadProfile(session.user.id).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, session?.user?.id, loadProfile]);

  const signInWithEmail = useCallback(
    (email: string, password: string) => {
      if (!supabase) return Promise.resolve({ data: null, error: new Error('not_configured') });
      return supabase.auth.signInWithPassword({ email, password });
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    (email: string, password: string, displayName?: string) => {
      if (!supabase) return Promise.resolve({ data: null, error: new Error('not_configured') });
      return supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            display_name: displayName?.trim() || undefined,
          },
        },
      });
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return { error: null };
    explicitSignOutRef.current = true;
    clearAuthGrace();
    const userId = session?.user?.id ?? getActiveStorageUserId();
    if (userId) {
      try {
        await flushAiFavoritesBeforeLogout(supabase, userId);
      } catch (e) {
        console.warn('[ai-favorites] logout flush failed:', e);
      }
    }
    clearLoveQuestUserData(userId);
    setActiveStorageUserId(null);
    const result = await supabase.auth.signOut();
    explicitSignOutRef.current = false;
    return result;
  }, [supabase, session?.user?.id]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error('not_configured') };
    const { error } = await signInWithGoogleOAuth(supabase);
    return { data: null, error };
  }, [supabase]);

  const signInWithApple = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error('not_configured') };
    if (!isAppleSignInNativeUi()) {
      return { data: null, error: new Error('apple_web_coming_soon') };
    }
    const { error } = await runAppleSignIn(supabase);
    return { data: null, error };
  }, [supabase]);

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<{ error: Error | null }> => {
      if (!supabase || !session?.user) return { error: new Error('not_authenticated') };
      const trimmed = displayName.trim();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed || null })
        .eq('id', session.user.id);
      if (error) return { error: new Error(error.message) };
      const p = await loadProfile(session.user.id);
      if (p) setProfile(p);
      return { error: null };
    },
    [supabase, session?.user, loadProfile]
  );

  const value = useMemo<SupabaseAuthValue>(
    () => ({
      supabase,
      configured: supabase !== null,
      session,
      user: session?.user ?? null,
      profile,
      authReady: ready,
      appleOAuthEnabled: isAppleOAuthEnabled(),
      appleSignInNativeUi: isAppleSignInNativeUi(),
      loadProfile,
      updateDisplayName,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }),
    [
      supabase,
      session,
      profile,
      ready,
      loadProfile,
      updateDisplayName,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
    ]
  );

  return createElement(SupabaseAuthContext.Provider, { value }, children);
}

export function useSupabaseAuth(): SupabaseAuthValue {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return ctx;
}
