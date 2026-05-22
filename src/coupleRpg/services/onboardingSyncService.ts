import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isOnboardingDone as isOnboardingDoneLocal,
  markOnboardingDone as markOnboardingDoneLocal,
} from '../storage/onboardingStore';

type ProfileOnboardingRow = {
  has_completed_onboarding: boolean | null;
};

export async function fetchProfileOnboardingDone(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('has_completed_onboarding')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[onboarding-sync] fetch failed:', error.message);
    return isOnboardingDoneLocal();
  }

  return Boolean((data as ProfileOnboardingRow | null)?.has_completed_onboarding);
}

export async function setProfileOnboardingDone(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ has_completed_onboarding: true })
    .eq('id', userId);

  if (error) {
    console.warn('[onboarding-sync] profile update failed:', error.message);
  }
}

/** 本機已完成但雲端尚未標記時，登入後上傳一次 */
export async function syncLocalOnboardingToProfileIfNeeded(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!isOnboardingDoneLocal()) return false;

  const remote = await fetchProfileOnboardingDone(supabase, userId);
  if (remote) return true;

  await setProfileOnboardingDone(supabase, userId);
  return true;
}

export async function resolveShouldShowOnboarding(input: {
  supabase: SupabaseClient | null;
  userId: string | null;
  authReady: boolean;
  configured: boolean;
}): Promise<boolean> {
  if (!input.configured || !input.authReady) {
    return false;
  }

  if (input.userId && input.supabase) {
    const synced = await syncLocalOnboardingToProfileIfNeeded(input.supabase, input.userId);
    if (synced) return false;
    const done = await fetchProfileOnboardingDone(input.supabase, input.userId);
    return !done;
  }

  return !isOnboardingDoneLocal();
}

export async function persistOnboardingComplete(input: {
  supabase: SupabaseClient | null;
  userId: string | null;
}): Promise<void> {
  markOnboardingDoneLocal();
  if (input.userId && input.supabase) {
    await setProfileOnboardingDone(input.supabase, input.userId);
  }
}
