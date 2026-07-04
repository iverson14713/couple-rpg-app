import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { DAILY_NOTE_MAX_LENGTH } from '../lib/dailyNoteDates';
import {
  isNativeDailyMemoryCameraAvailable,
  pickDailyMemoryFromCamera,
  pickDailyMemoryFromPhotos,
} from '../lib/dailyMemoryCamera';
import { useDailyNotes } from '../context/DailyNotesContext';
import { useToast } from '../../context/ToastContext';
import { lq } from '../theme';

const CAMERA_DENIED_HINT = '需要開啟相機權限，才能拍下今日小回憶。';
const PHOTOS_DENIED_HINT = '需要開啟相簿權限，才能選擇今日小回憶照片。';

/** Native camera capture; set false to ship gallery-only if camera remains unstable. */
const ENABLE_NATIVE_CAMERA_CAPTURE = true;

export function DailyNotePromptSheet() {
  const { showToast } = useToast();
  const {
    promptOpen,
    promptMode,
    promptRequest,
    promptInitialContent,
    promptInitialPhotoUrl,
    dismissPrompt,
    openSupplementEdit,
    saveNote,
  } = useDailyNotes();

  const [content, setContent] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const galleryFallbackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCameraAvailable(ENABLE_NATIVE_CAMERA_CAPTURE && isNativeDailyMemoryCameraAvailable());
  }, []);

  useEffect(() => {
    if (!promptOpen) return;
    setContent(promptInitialContent);
    setPhotoFile(null);
    setPhotoPreview(promptInitialPhotoUrl);
    setRemovePhoto(false);
  }, [promptOpen, promptInitialContent, promptInitialPhotoUrl, promptMode]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  if (!promptOpen || !promptRequest) return null;

  if (promptMode === 'supplement') {
    const title = promptRequest.supplementTitle ?? '❤️ 今天已經留下回憶了';
    const body = promptRequest.supplementBody ?? '要不要補充一下？';
    return (
      <div
        className="fixed inset-0 z-[130] flex flex-col justify-end bg-black/40"
        role="dialog"
        aria-modal="true"
        onClick={dismissPrompt}
      >
        <div
          className="relative z-10 w-full rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className={`text-[17px] font-extrabold ${lq.text}`}>{title}</h2>
          <p className="mt-1.5 text-[13px] font-semibold text-stone-600">{body}</p>
          <button
            type="button"
            onClick={openSupplementEdit}
            className={`mt-4 w-full rounded-2xl py-3 text-[15px] font-extrabold text-white shadow-md active:scale-[0.99] ${lq.btnPrimary}`}
          >
            查看/編輯今天回憶
          </button>
          <button
            type="button"
            onClick={dismissPrompt}
            className="mt-2 w-full py-2 text-center text-[14px] font-bold text-stone-500 active:opacity-70"
          >
            先不用
          </button>
        </div>
      </div>
    );
  }

  const title = promptRequest.title ?? '❤️ 留下今天';
  const body =
    promptRequest.body ??
    (promptMode === 'edit'
      ? '可以補充文字或照片。'
      : '要不要把今天的小回憶留下來？');

  const applyPickedFile = (file: File) => {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const openGallery = async () => {
    if (picking) return;
    setPicking(true);
    try {
      if (isNativeDailyMemoryCameraAvailable()) {
        const result = await pickDailyMemoryFromPhotos();
        if (result.ok) {
          applyPickedFile(result.file);
          return;
        }
        if (result.reason === 'denied') {
          showToast(PHOTOS_DENIED_HINT, 'info', { position: 'top' });
          return;
        }
        if (result.reason === 'cancelled') return;
        // Fall through to web input if plugin fails unexpectedly
      }
      if (galleryFallbackRef.current) {
        galleryFallbackRef.current.value = '';
        galleryFallbackRef.current.click();
      }
    } finally {
      setPicking(false);
    }
  };

  const openCamera = async () => {
    if (picking || !cameraAvailable) return;
    setPicking(true);
    try {
      const result = await pickDailyMemoryFromCamera();
      if (result.ok) {
        applyPickedFile(result.file);
        return;
      }
      if (result.reason === 'denied') {
        showToast(CAMERA_DENIED_HINT, 'info', { position: 'top' });
        return;
      }
      if (result.reason === 'cancelled') return;
      // Camera unstable / failed — hide button for this session and keep gallery only
      setCameraAvailable(false);
      showToast('目前無法使用相機，請改從相簿選擇照片。', 'info', { position: 'top' });
    } finally {
      setPicking(false);
    }
  };

  const onRemovePhoto = () => {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
  };

  const onSave = async () => {
    if (saving) return;
    const trimmed = content.trim();
    const hasPhoto = Boolean(photoFile) || (Boolean(photoPreview) && !removePhoto);
    if (!trimmed && !hasPhoto) {
      showToast('留下一句話或一張照片再儲存喔', 'info', { position: 'top' });
      return;
    }

    setSaving(true);
    const result = await saveNote({
      noteDate: promptRequest.noteDate,
      content: trimmed,
      photoFile: photoFile ?? undefined,
      removePhoto,
      sourceType: promptRequest.sourceType,
      sourceId: promptRequest.sourceId,
      sourceMeta: promptRequest.sourceMeta,
    });
    setSaving(false);

    if (result === 'ok') {
      showToast(promptMode === 'edit' ? '已更新今天的小回憶' : '已留下今天的小回憶', 'success', {
        position: 'top',
      });
      return;
    }
    if (result === 'ok_photo_failed') {
      showToast('照片上傳失敗，稍後再試', 'info', { position: 'top' });
      return;
    }
    if (result === 'empty') {
      showToast('留下一句話或一張照片再儲存喔', 'info', { position: 'top' });
      return;
    }
    if (result === 'offline') {
      showToast('目前離線，請連線後再試', 'info', { position: 'top' });
      return;
    }
    if (result === 'no_couple') {
      showToast('請先建立或加入情侶空間', 'info', { position: 'top' });
      return;
    }
    if (result === 'quota_free') return;
    if (result === 'quota_pro') {
      showToast('❤️ 這個月的故事書已經寫滿了。下個月可以繼續留下新的回憶。', 'info', {
        position: 'top',
      });
      return;
    }
    showToast('暫時無法儲存，請稍後再試', 'error', { position: 'top' });
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex flex-col justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-memory-prompt-title"
      onClick={dismissPrompt}
    >
      <div
        className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 id="daily-memory-prompt-title" className={`text-[17px] font-extrabold ${lq.text}`}>
              {title}
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-stone-600">{body}</p>
          </div>
          <button
            type="button"
            onClick={dismissPrompt}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 active:bg-stone-100"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          ref={galleryFallbackRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file?.type.startsWith('image/')) applyPickedFile(file);
          }}
        />

        {photoPreview ? (
          <div className="relative mb-3 overflow-hidden rounded-2xl">
            <img src={photoPreview} alt="" className="max-h-48 w-full object-cover" />
            <button
              type="button"
              onClick={onRemovePhoto}
              className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white"
            >
              移除照片
            </button>
          </div>
        ) : (
          <div className={`mb-3 grid gap-2 ${cameraAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              type="button"
              disabled={picking}
              onClick={() => void openGallery()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 py-5 text-[12px] font-bold text-rose-600 active:bg-rose-50 disabled:opacity-60"
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              {picking ? '開啟中…' : '從相簿選擇'}
            </button>
            {cameraAvailable ? (
              <button
                type="button"
                disabled={picking}
                onClick={() => void openCamera()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 py-5 text-[12px] font-bold text-rose-600 active:bg-rose-50 disabled:opacity-60"
              >
                <Camera className="h-5 w-5" aria-hidden />
                {picking ? '開啟中…' : '拍照'}
              </button>
            ) : null}
          </div>
        )}

        {photoPreview ? (
          <div className="mb-3 flex gap-3">
            <button
              type="button"
              disabled={picking}
              onClick={() => void openGallery()}
              className="text-[12px] font-bold text-rose-600 active:opacity-70 disabled:opacity-50"
            >
              從相簿更換
            </button>
            {cameraAvailable ? (
              <button
                type="button"
                disabled={picking}
                onClick={() => void openCamera()}
                className="text-[12px] font-bold text-rose-600 active:opacity-70 disabled:opacity-50"
              >
                重新拍照
              </button>
            ) : null}
          </div>
        ) : null}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, DAILY_NOTE_MAX_LENGTH))}
          placeholder="今天想記住的一句話…"
          rows={3}
          className="w-full resize-none rounded-2xl border border-rose-100 bg-rose-50/40 px-3.5 py-3 text-[15px] leading-relaxed text-stone-800 outline-none ring-rose-200 focus:ring-2"
          maxLength={DAILY_NOTE_MAX_LENGTH}
        />
        <p className="mt-1 text-[11px] text-stone-400">
          照片和文字至少要有一個 · {content.length}/{DAILY_NOTE_MAX_LENGTH}
        </p>

        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className={`mt-3 w-full rounded-2xl py-3 text-[15px] font-extrabold text-white shadow-md active:scale-[0.99] disabled:opacity-60 ${lq.btnPrimary}`}
        >
          {saving ? '儲存中…' : '❤️ 留下今天'}
        </button>
        <button
          type="button"
          onClick={dismissPrompt}
          className="mt-2 w-full py-2 text-center text-[14px] font-bold text-stone-500 active:opacity-70"
        >
          先不用
        </button>
      </div>
    </div>
  );
}
