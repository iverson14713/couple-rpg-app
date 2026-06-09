import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  COMPANIONSHIP_PRESETS,
  companionshipSendSuccessMessage,
  type CompanionshipPreset,
} from '../data/companionshipPresets';
import { useCompanionship } from '../context/CompanionshipContext';
import { useUserPlan } from '../context/UserPlanContext';
import { useProFeature } from '../hooks/useProFeature';
import {
  COMPANIONSHIP_CUSTOM_MAX_LEN,
  validateCompanionshipCustomMessage,
} from '../lib/companionshipCustomMessage';
import {
  checkCustomCompanionshipSend,
  checkPresetCompanionshipSend,
  COMPANIONSHIP_CUSTOM_PRO_HINT,
  COMPANIONSHIP_DAILY_LIMIT_PRO_HINT,
  COMPANIONSHIP_RANDOM_PRO_HINT,
} from '../lib/companionshipEntitlement';
import { lq } from '../theme';
import { getCompanionshipSendsRemaining } from '../storage/companionshipQuotaStore';
import { ProBadgeIfNeeded } from './ProBadge';

const SEND_UI_DELAY_MS = 280;
const SUCCESS_DISPLAY_MS = 1500;
const SEND_COOLDOWN_MS = 1000;
const SEND_FAIL_MSG = '送出失敗，請稍後再試';
const SWIPE_DISMISS_PX = 72;

const PRO_BADGE_MUTED =
  '!from-rose-300/55 !to-fuchsia-300/55 !text-rose-900/80 !opacity-85 !shadow-none !ring-1 !ring-rose-200/60';

const LOG = '[companionship]';

type Props = {
  open: boolean;
  onClose: () => void;
};

function sendErrorMessage(result: string): string {
  switch (result) {
    case 'not_logged_in':
      return '請先登入後再送陪伴';
    case 'not_bound':
      return '請先綁定另一半';
    case 'no_partner':
      return '等待另一半加入情侶空間';
    case 'save_failed':
    case 'sync_failed':
      return SEND_FAIL_MSG;
    default:
      return SEND_FAIL_MSG;
  }
}

export function CompanionshipSheet({ open, onClose }: Props) {
  const { showToast } = useToast();
  const auth = useSupabaseAuth();
  const { isPro, openUpgradeModal } = useUserPlan();
  const companionshipPro = useProFeature('companionship_premium');
  const {
    sendCompanionship,
    sendCustomCompanionship,
    clearSendFeedback,
    canUseCompanionship,
    bindHint,
    activeCouple,
    freeSendsRemaining,
  } = useCompanionship();
  const coupleId = activeCouple.coupleId;
  const currentUserId = auth.user?.id ?? null;
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customHint, setCustomHint] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sendCooldown, setSendCooldown] = useState(false);
  const [successBurst, setSuccessBurst] = useState(false);
  const [sentPresetKey, setSentPresetKey] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const customInputRef = useRef<HTMLInputElement>(null);
  const customPanelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeActiveRef = useRef(false);

  const sendLocked = sendingKey !== null || sendCooldown || successBurst;

  const clearSendTimers = useCallback(() => {
    if (cooldownTimerRef.current != null) {
      window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (successTimerRef.current != null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const showUpgrade = useCallback(
    (hint: string) => {
      openUpgradeModal(hint);
    },
    [openUpgradeModal]
  );

  const showSendSuccess = useCallback(
    (presetKey: string, remaining: number | null) => {
      clearSendTimers();
      setSuccessBurst(true);
      setSentPresetKey(presetKey);
      const successMsg = companionshipSendSuccessMessage(presetKey);
      console.log(`${LOG} remaining count`, remaining);
      showToast(successMsg, 'success', { position: 'top', durationMs: SUCCESS_DISPLAY_MS });
      setSendCooldown(true);
      cooldownTimerRef.current = window.setTimeout(() => {
        setSendCooldown(false);
        cooldownTimerRef.current = null;
      }, SEND_COOLDOWN_MS);
      successTimerRef.current = window.setTimeout(() => {
        setSuccessBurst(false);
        setSentPresetKey(null);
        clearSendFeedback();
        onClose();
        successTimerRef.current = null;
      }, SUCCESS_DISPLAY_MS);
    },
    [clearSendFeedback, clearSendTimers, onClose, showToast]
  );

  const showSendFail = useCallback(
    (reason: string) => {
      const message = sendErrorMessage(reason);
      console.log(`${LOG} send fail`, reason);
      showToast(message, 'error', { position: 'top', durationMs: SUCCESS_DISPLAY_MS });
    },
    [showToast]
  );

  useEffect(() => {
    if (!open) {
      setCustomOpen(false);
      setCustomText('');
      setCustomHint(null);
      setSendingKey(null);
      setSendCooldown(false);
      setSuccessBurst(false);
      setSentPresetKey(null);
      setDragY(0);
      swipeStartYRef.current = null;
      swipeActiveRef.current = false;
      clearSendTimers();
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      clearSendTimers();
    };
  }, [clearSendTimers, open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset > 40 ? inset : 0);
    };
    updateInset();
    vv.addEventListener('resize', updateInset);
    vv.addEventListener('scroll', updateInset);
    return () => {
      vv.removeEventListener('resize', updateInset);
      vv.removeEventListener('scroll', updateInset);
      setKeyboardInset(0);
    };
  }, [open, customOpen]);

  useEffect(() => {
    if (!customOpen) return;
    const t = window.setTimeout(() => {
      customInputRef.current?.focus();
      customPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [customOpen]);

  const onSwipeStart = (clientY: number) => {
    swipeStartYRef.current = clientY;
    swipeActiveRef.current = true;
  };

  const onSwipeMove = (clientY: number) => {
    if (!swipeActiveRef.current || swipeStartYRef.current == null) return;
    const delta = Math.max(0, clientY - swipeStartYRef.current);
    setDragY(delta);
  };

  const onSwipeEnd = () => {
    if (dragY >= SWIPE_DISMISS_PX) {
      onClose();
    }
    setDragY(0);
    swipeStartYRef.current = null;
    swipeActiveRef.current = false;
  };

  if (!open) return null;

  const handleSend = async (preset: CompanionshipPreset) => {
    if (!canUseCompanionship || sendLocked) return;

    const gate = checkPresetCompanionshipSend(preset, isPro, currentUserId, coupleId);
    if (!gate.allowed) {
      showUpgrade(gate.hint);
      return;
    }

    console.log(`${LOG} sendCompanion start`, { preset: preset.type });
    setSendingKey(preset.type);
    await new Promise((resolve) => window.setTimeout(resolve, SEND_UI_DELAY_MS));

    const result = await sendCompanionship(preset);
    setSendingKey(null);

    if (result === 'ok') {
      const remaining = getCompanionshipSendsRemaining(currentUserId, coupleId, isPro);
      console.log(`${LOG} send success`, { remaining });
      showSendSuccess(preset.type, remaining);
    } else if (result === 'pro_required') {
      showUpgrade(
        preset.type === 'random' ? COMPANIONSHIP_RANDOM_PRO_HINT : COMPANIONSHIP_CUSTOM_PRO_HINT
      );
    } else if (result === 'daily_limit') {
      showUpgrade(COMPANIONSHIP_DAILY_LIMIT_PRO_HINT);
    } else {
      showSendFail(result);
    }
  };

  const handleCustomToggle = () => {
    if (!canUseCompanionship) return;

    const gate = checkCustomCompanionshipSend(isPro);
    if (!gate.allowed) {
      showUpgrade(gate.hint);
      return;
    }

    setCustomOpen((v) => !v);
  };

  const handleCustomChange = (value: string) => {
    const noBreaks = value.replace(/[\r\n\u2028\u2029]/g, '');
    setCustomText(noBreaks.slice(0, COMPANIONSHIP_CUSTOM_MAX_LEN));
    if (customHint) setCustomHint(null);
  };

  const handleCustomSend = async () => {
    if (!canUseCompanionship || sendLocked) return;

    const gate = checkCustomCompanionshipSend(isPro);
    if (!gate.allowed) {
      showUpgrade(gate.hint);
      return;
    }

    const preview = validateCompanionshipCustomMessage(customText);
    if (!preview.ok) {
      setCustomHint(preview.hint);
      return;
    }

    console.log(`${LOG} sendCompanion start`, { preset: 'custom' });
    setSendingKey('custom');
    await new Promise((resolve) => window.setTimeout(resolve, SEND_UI_DELAY_MS));

    const result = await sendCustomCompanionship(customText);
    setSendingKey(null);

    if (!result.ok) {
      if (result.reason === 'invalid') setCustomHint(result.hint);
      if (result.reason === 'pro_required' || result.reason === 'daily_limit') {
        showUpgrade(result.hint);
      } else if (
        result.reason === 'not_bound' ||
        result.reason === 'no_partner' ||
        result.reason === 'not_logged_in' ||
        result.reason === 'save_failed' ||
        result.reason === 'sync_failed'
      ) {
        showSendFail(result.reason);
      }
      return;
    }

    setCustomText('');
    setCustomHint(null);
    setCustomOpen(false);
    const remaining = getCompanionshipSendsRemaining(currentUserId, coupleId, isPro);
    console.log(`${LOG} send success`, { remaining });
    showSendSuccess('custom', remaining);
  };

  const presetDisabled = !canUseCompanionship || sendLocked;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[#3d3539]/30 backdrop-blur-[3px]"
        aria-label="關閉"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="lq-companionship-sheet relative z-10 flex w-full max-h-[min(85dvh,100%)] flex-col overflow-hidden rounded-t-[22px] shadow-2xl"
        style={{
          marginBottom: keyboardInset ? `${keyboardInset}px` : undefined,
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: swipeActiveRef.current ? 'none' : 'transform 0.22s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="陪伴一下"
      >
        <div
          className="shrink-0 touch-pan-y px-4 pt-2"
          onTouchStart={(e) => onSwipeStart(e.touches[0]?.clientY ?? 0)}
          onTouchMove={(e) => onSwipeMove(e.touches[0]?.clientY ?? 0)}
          onTouchEnd={onSwipeEnd}
          onTouchCancel={onSwipeEnd}
        >
          <div className="mx-auto h-1 w-8 rounded-full bg-rose-200/70" aria-hidden />
          <header className="pb-1 pt-2 text-center">
            <p className="text-[18px] font-extrabold tracking-tight text-[#3d3539]">💗 陪伴一下</p>
            <p className="mt-0.5 text-[12px] font-semibold text-[#b07a8f]">不用打字，快速傳遞陪伴感</p>
            {canUseCompanionship && freeSendsRemaining !== null ? (
              <p className="mt-1 text-[11px] font-bold text-[#d08ba5]">
                今天還可送 {freeSendsRemaining} 次
              </p>
            ) : null}
          </header>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-2 [-webkit-overflow-scrolling:touch]">
          <div className="grid gap-1.5">
            {COMPANIONSHIP_PRESETS.map((preset) => {
              const isSending = sendingKey === preset.type;
              const justSent = sentPresetKey === preset.type;
              return (
                <button
                  key={preset.type}
                  type="button"
                  disabled={presetDisabled}
                  onClick={() => void handleSend(preset)}
                  className={`lq-companionship-preset flex items-center gap-2 rounded-xl px-3 py-2 text-left transition active:scale-[0.98] disabled:opacity-45 ${
                    justSent ? 'lq-companionship-preset--sent' : ''
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-fuchsia-50 text-[19px] ring-1 ring-rose-100/80">
                    {isSending ? (
                      <span className="lq-companionship-sending-dot" aria-hidden />
                    ) : (
                      preset.icon
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[14px] font-extrabold text-[#3d3539]">{preset.label}</span>
                      {preset.type === 'random' ? (
                        <ProBadgeIfNeeded
                          show={companionshipPro.showProBadge}
                          feature="companionship_premium"
                          size="sm"
                          className={PRO_BADGE_MUTED}
                        />
                      ) : null}
                    </span>
                    {justSent ? (
                      <span className="mt-0.5 block text-[12px] font-bold text-rose-500">
                        已送出 ❤️
                      </span>
                    ) : isSending ? (
                      <span className="mt-0.5 block text-[12px] font-semibold text-[#c4a0ad]">
                        送出中…
                      </span>
                    ) : preset.message ? (
                      <span className="mt-0.5 block text-[12px] font-semibold text-[#b07a8f]">
                        「{preset.message}」
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[12px] font-semibold text-[#b07a8f]">
                        隨機挑一句溫暖的話
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              disabled={!canUseCompanionship || sendLocked}
              onClick={handleCustomToggle}
              className={`lq-companionship-preset flex items-center gap-2 rounded-xl px-3 py-2 text-left transition active:scale-[0.98] disabled:opacity-45 ${
                customOpen ? 'ring-1 ring-rose-200/50' : ''
              } ${sentPresetKey === 'custom' ? 'lq-companionship-preset--sent' : ''}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-fuchsia-50 text-[19px] ring-1 ring-rose-100/80">
                ✍️
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[14px] font-extrabold text-[#3d3539]">自訂一句</span>
                  <ProBadgeIfNeeded
                    show={companionshipPro.showProBadge}
                    feature="companionship_premium"
                    size="sm"
                    className={PRO_BADGE_MUTED}
                  />
                </span>
                {sentPresetKey === 'custom' ? (
                  <span className="mt-0.5 block text-[12px] font-bold text-rose-500">已送出 ❤️</span>
                ) : (
                  <span className="mt-0.5 block text-[12px] font-semibold text-[#b07a8f]">
                    寫一句專屬的短句給對方
                  </span>
                )}
              </span>
            </button>
          </div>

          {customOpen ? (
            <div ref={customPanelRef} className="lq-companionship-custom mt-2 rounded-xl p-2.5">
              <label className="block">
                <span className="sr-only">自訂陪伴句子</span>
                <input
                  ref={customInputRef}
                  type="text"
                  enterKeyHint="send"
                  maxLength={COMPANIONSHIP_CUSTOM_MAX_LEN}
                  value={customText}
                  disabled={!canUseCompanionship || sendLocked}
                  placeholder="輸入想對對方說的一句話…"
                  onChange={(e) => handleCustomChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleCustomSend();
                    }
                  }}
                  className="lq-companionship-custom-input w-full rounded-lg border border-rose-100/80 bg-white/90 px-3 py-2 text-[14px] font-semibold text-[#3d3539] placeholder:text-[#d0c4cb] outline-none ring-rose-200/60 focus:ring-2"
                />
              </label>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-[#c4a0ad]">
                  {customText.trim().length}/{COMPANIONSHIP_CUSTOM_MAX_LEN}
                </span>
                <button
                  type="button"
                  disabled={!canUseCompanionship || sendLocked || !customText.trim()}
                  onClick={() => void handleCustomSend()}
                  className={`shrink-0 ${lq.btnPrimary} !min-h-8 !px-3.5 !py-1 !text-[12px] disabled:opacity-40`}
                >
                  {sendingKey === 'custom' ? '送出中…' : '送出'}
                </button>
              </div>
              {customHint ? (
                <p className="mt-1.5 text-[11px] font-semibold text-amber-700/90" role="alert">
                  {customHint}
                </p>
              ) : null}
            </div>
          ) : null}

          {!canUseCompanionship && bindHint ? (
            <p className="mt-2 text-center text-[11px] font-semibold text-[#c4a0ad]">{bindHint}</p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-rose-100/60 bg-[#fffafb]/95 px-3.5 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="mx-auto block rounded-lg px-4 py-1.5 text-[12px] font-semibold text-[#b07a8f] transition active:scale-[0.98] active:text-[#9d174d]"
          >
            關閉
          </button>
        </div>

        {successBurst ? (
          <div className="lq-companionship-send-burst pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
            <div className="relative">
              <span className="lq-companionship-heart-glow" aria-hidden />
              <span className="lq-companionship-heart-pop text-[56px]" aria-hidden>
                💗
              </span>
            </div>
            <p className="lq-companionship-success-text mt-2.5 text-[16px] font-extrabold">
              {companionshipSendSuccessMessage(sentPresetKey ?? '')}
            </p>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
