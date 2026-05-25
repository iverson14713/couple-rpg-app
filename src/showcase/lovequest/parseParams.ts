import type { ShowcaseDeviceId } from './constants';

export type ShowcaseParams = {
  screenshotMode: boolean;
  device: ShowcaseDeviceId;
  view: 'marketing' | 'app';
};

export function parseShowcaseParams(search = window.location.search): ShowcaseParams {
  const q = new URLSearchParams(search);
  const viewRaw = q.get('view');
  return {
    screenshotMode: q.get('screenshotMode') === 'true',
    device: '6.5',
    view: viewRaw === 'app' ? 'app' : 'marketing',
  };
}

export function buildShowcaseUrl(
  path: string,
  opts?: Partial<{ screenshotMode: boolean; device: ShowcaseDeviceId; view: 'marketing' | 'app' }>
): string {
  const q = new URLSearchParams();
  if (opts?.screenshotMode) q.set('screenshotMode', 'true');
  if (opts?.view) q.set('view', opts.view);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}
