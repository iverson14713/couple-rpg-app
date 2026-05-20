import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** Bottom bar tabs */
export type CoupleNavTabId = 'home' | 'dinner' | 'housework' | 'rewards' | 'profile';

/** Home cards can open these without a bottom tab */
export type CoupleDeepTabId = 'tasks' | 'dates';

export type CoupleTabId = CoupleNavTabId | CoupleDeepTabId;

export type ProfileSectionFocus = 'status' | 'settings';

type NavContextValue = {
  tab: CoupleTabId;
  profileSection: ProfileSectionFocus;
  navigateTo: (tab: CoupleTabId, opts?: { profileSection?: ProfileSectionFocus }) => void;
  isNavTab: (id: CoupleTabId) => id is CoupleNavTabId;
};

const CoupleRpgNavContext = createContext<NavContextValue | null>(null);

const NAV_TABS: CoupleNavTabId[] = ['home', 'dinner', 'housework', 'rewards', 'profile'];

export function CoupleRpgNavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<CoupleTabId>('home');
  const [profileSection, setProfileSection] = useState<ProfileSectionFocus>('status');

  const navigateTo = useCallback((next: CoupleTabId, opts?: { profileSection?: ProfileSectionFocus }) => {
    setTab(next);
    if (opts?.profileSection) setProfileSection(opts.profileSection);
    else if (next === 'profile') setProfileSection('status');
  }, []);

  const isNavTab = useCallback((id: CoupleTabId): id is CoupleNavTabId => {
    return NAV_TABS.includes(id as CoupleNavTabId);
  }, []);

  const value = useMemo(
    () => ({ tab, profileSection, navigateTo, isNavTab }),
    [tab, profileSection, navigateTo, isNavTab]
  );

  return <CoupleRpgNavContext.Provider value={value}>{children}</CoupleRpgNavContext.Provider>;
}

export function useCoupleRpgNav() {
  const ctx = useContext(CoupleRpgNavContext);
  if (!ctx) throw new Error('useCoupleRpgNav must be used within CoupleRpgNavProvider');
  return ctx;
}

/** Active icon on bottom bar when on a deep-linked screen */
export function bottomNavHighlight(tab: CoupleTabId): CoupleNavTabId {
  if (tab === 'tasks' || tab === 'dates') return 'home';
  return tab;
}
