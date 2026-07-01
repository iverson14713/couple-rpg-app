import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DEV_MODE_PASSWORD } from '../lib/devModeOverride';
import { useDevMode } from '../context/DevModeContext';

export function DevModePasswordModal() {
  const { passwordOpen, closePasswordModal, openPanel } = useDevMode();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!passwordOpen) return null;

  const reset = () => {
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    closePasswordModal();
  };

  const handleConfirm = () => {
    if (password !== DEV_MODE_PASSWORD) {
      setError('密碼錯誤');
      return;
    }
    reset();
    openPanel();
  };

  const dialog = (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-mode-password-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(80,30,50,0.35)] backdrop-blur-[2px]"
        aria-label="關閉"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-t-[28px] border border-[rgba(244,114,182,0.22)] bg-gradient-to-b from-[#fff7fb] to-[#fff1f6] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-16px_48px_-12px_rgba(244,114,182,0.32)] ring-1 ring-white/55 backdrop-blur-md sm:rounded-3xl sm:pb-5 sm:pt-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-rose-200/55 sm:hidden" aria-hidden />
        <p id="dev-mode-password-title" className="text-[18px] font-extrabold tracking-tight text-[#3a2e34]">
          開發模式
        </p>
        <label className="mt-4 block">
          <span className="sr-only">密碼</span>
          <input
            type="password"
            autoComplete="off"
            autoFocus
            value={password}
            placeholder="輸入密碼"
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            className="w-full rounded-[16px] border border-rose-200/55 bg-[#fffcfd] px-3.5 py-3 text-[15px] text-[#3a2e34] placeholder:text-[#d4c4cc] focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200/55"
          />
        </label>
        {error ? (
          <p className="mt-2 text-[12px] font-semibold text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full border border-rose-200/60 bg-white px-4 text-[15px] font-semibold text-[#3a2e34] active:scale-[0.98]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 px-4 text-[15px] font-semibold text-white active:scale-[0.98]"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
}
