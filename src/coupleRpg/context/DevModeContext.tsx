import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isDevModeFeatureEnabled } from '../lib/devModeOverride';

type DevModeContextValue = {
  enabled: boolean;
  passwordOpen: boolean;
  panelOpen: boolean;
  openPasswordModal: () => void;
  closePasswordModal: () => void;
  openPanel: () => void;
  closePanel: () => void;
};

const DevModeContext = createContext<DevModeContextValue | null>(null);

export function DevModeProvider({ children }: { children: ReactNode }) {
  const enabled = isDevModeFeatureEnabled();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const openPasswordModal = useCallback(() => {
    if (!enabled) return;
    setPasswordOpen(true);
  }, [enabled]);

  const closePasswordModal = useCallback(() => setPasswordOpen(false), []);

  const openPanel = useCallback(() => {
    if (!enabled) return;
    setPasswordOpen(false);
    setPanelOpen(true);
  }, [enabled]);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  const value = useMemo(
    () => ({
      enabled,
      passwordOpen,
      panelOpen,
      openPasswordModal,
      closePasswordModal,
      openPanel,
      closePanel,
    }),
    [enabled, passwordOpen, panelOpen, openPasswordModal, closePasswordModal, openPanel, closePanel]
  );

  return <DevModeContext.Provider value={value}>{children}</DevModeContext.Provider>;
}

export function useDevMode() {
  const ctx = useContext(DevModeContext);
  if (!ctx) throw new Error('useDevMode must be used within DevModeProvider');
  return ctx;
}

export function useDevModeOptional() {
  return useContext(DevModeContext);
}
