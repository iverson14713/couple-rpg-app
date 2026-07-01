import { useEffect, useState } from 'react';
import { DEV_MODE_CHANGED_EVENT } from '../lib/devModeOverride';

/** Re-render when dev overrides change (localStorage). */
export function useDevModeRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const onChange = () => setRevision((n) => n + 1);
    window.addEventListener(DEV_MODE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(DEV_MODE_CHANGED_EVENT, onChange);
  }, []);
  return revision;
}
