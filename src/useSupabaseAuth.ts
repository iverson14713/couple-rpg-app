import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { getAuthCallbackUrl, getOAuthRedirectUrl, saveAuthReturnPath } from './services/auth/authRedirect';
import { isAppleOAuthEnabled } from './services/auth/appleSignIn';
import { signInWithGoogleOAuth } from './services/auth/googleSignIn';
import { authLog, isAuthNativeClient } from './services/auth/authDebug';
import { openOAuthInExternalBrowser } from './services/auth/oauthNative';
import { getSupabaseClient } from './supabaseClient';

export type UserProfile = {
  id: string;
  display_name: string | null;
};

export function useSupabaseAuth() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

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
      setSession(null);
      setProfile(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) setSession(s);
      if (!cancelled) setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

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

  const signOut = useCallback(() => {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.signOut();
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error('not_configured') };
    const { error } = await signInWithGoogleOAuth(supabase);
    return { data: null, error };
  }, [supabase]);

  const signInWithApple = useCallback(async () => {
    if (!supabase) return { data: null, error: new Error('not_configured') };
    if (!isAppleOAuthEnabled()) {
      return { data: null, error: new Error('apple_not_enabled') };
    }
    saveAuthReturnPath();
    const redirectTo = getOAuthRedirectUrl();
    const isNative = isAuthNativeClient();
    authLog('apple.click', { isNative, redirectTo, skipBrowserRedirect: isNative });
    if (isNative) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'name email',
        },
      });
      if (error) return { data: null, error };
      if (!data?.url) return { data: null, error: new Error('no_oauth_url') };
      authLog('apple.signInWithOAuth.response', { oauthUrl: data.url });
      try {
        await openOAuthInExternalBrowser(data.url);
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
      }
      return { data: null, error: null };
    }
    return supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        scopes: 'name email',
      },
    });
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

  return {
    supabase,
    configured: supabase !== null,
    session,
    user: session?.user ?? null,
    profile,
    authReady: ready,
    appleOAuthEnabled: isAppleOAuthEnabled(),
    loadProfile,
    updateDisplayName,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
}
