import { isDevModeFeatureEnabled } from '../lib/devModeOverride';
import { DevModePasswordModal } from './DevModePasswordModal';
import { DevModePanel } from './DevModePanel';

/** Renders dev-mode modals when feature flag allows. */
export function DevModeHost() {
  if (!isDevModeFeatureEnabled()) return null;
  return (
    <>
      <DevModePasswordModal />
      <DevModePanel />
    </>
  );
}
