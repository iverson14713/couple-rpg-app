import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export type DailyMemoryPickResult =
  | { ok: true; file: File }
  | { ok: false; reason: 'cancelled' | 'denied' | 'unavailable' | 'error' };

const PHOTO_OPTIONS = {
  resultType: CameraResultType.Uri,
  quality: 80,
  allowEditing: false,
  saveToGallery: false,
  width: 1200,
} as const;

export function isNativeDailyMemoryCameraAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

function isUserCancelled(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const lower = msg.toLowerCase();
  return (
    lower.includes('cancel') ||
    lower.includes('user cancelled') ||
    lower.includes('user canceled') ||
    lower.includes('no image')
  );
}

function isPermissionDenied(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const lower = msg.toLowerCase();
  return (
    lower.includes('permission') ||
    lower.includes('denied') ||
    lower.includes('not authorized') ||
    lower.includes('access')
  );
}

async function photoUriToFile(webPath: string, format?: string): Promise<File> {
  const res = await fetch(webPath);
  const blob = await res.blob();
  const ext = format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg';
  const type = blob.type || (ext === 'png' ? 'image/png' : 'image/jpeg');
  return new File([blob], `daily-memory.${ext}`, { type });
}

async function pickWithSource(source: CameraSource): Promise<DailyMemoryPickResult> {
  try {
    const photo = await Camera.getPhoto({
      ...PHOTO_OPTIONS,
      source,
    });
    if (!photo.webPath) return { ok: false, reason: 'error' };
    const file = await photoUriToFile(photo.webPath, photo.format);
    return { ok: true, file };
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false, reason: 'cancelled' };
    if (isPermissionDenied(err)) return { ok: false, reason: 'denied' };
    console.warn('[daily-memory camera]', err);
    return { ok: false, reason: 'error' };
  }
}

/** Gallery / photo library — never uses CameraSource.Prompt. */
export async function pickDailyMemoryFromPhotos(): Promise<DailyMemoryPickResult> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const current = await Camera.checkPermissions();
    if (current.photos !== 'granted' && current.photos !== 'limited') {
      const next = await Camera.requestPermissions({ permissions: ['photos'] });
      if (next.photos !== 'granted' && next.photos !== 'limited') {
        return { ok: false, reason: 'denied' };
      }
    }
  } catch (err) {
    console.warn('[daily-memory photos permission]', err);
  }

  return pickWithSource(CameraSource.Photos);
}

/** Device camera — never uses CameraSource.Prompt. */
export async function pickDailyMemoryFromCamera(): Promise<DailyMemoryPickResult> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const current = await Camera.checkPermissions();
    if (current.camera !== 'granted') {
      const next = await Camera.requestPermissions({ permissions: ['camera'] });
      if (next.camera !== 'granted') {
        return { ok: false, reason: 'denied' };
      }
    }
  } catch (err) {
    console.warn('[daily-memory camera permission]', err);
    return { ok: false, reason: 'denied' };
  }

  return pickWithSource(CameraSource.Camera);
}
