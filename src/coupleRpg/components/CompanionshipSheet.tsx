import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import {
  AI_COMPANIONSHIP_PICK_PRESET,
  buildDailyFeaturedPreset,
  COMPANIONSHIP_PRESETS,
  pickAiCompanionshipLine,
  pickCompanionshipSuccessLine,
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
import { lightCompanionshipHaptic } from '../lib/companionshipTime';
import { lq } from '../theme';
import { getCompanionshipSendsRemaining } from '../storage/companionshipQuotaStore';
import { ProBadgeIfNeeded } from './ProBadge';
import { CompanionshipSuccessOverlay } from './CompanionshipSuccessOverlay';

const SEND_UI_DELAY_MS = 280;
const SUCCESS_DISPLAY_MS = 1000;
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

type CompanionCardProps = {
  preset: CompanionshipPreset;
  disabled: boolean;
  sending: boolean;
  sent: boolean;
  featured?: boolean;
  ai?: boolean;
  proBadge?: boolean;
  onPress: () => void;
};

function CompanionCard({
  preset,
  disabled,
  sending,
  sent,
  featured,
  ai,
  proBadge,
  onPress,
}: CompanionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      className={`lq-companion-card text-left transition active:scale-[0.985] disabled:opacity-45 ${
        featured ? 'lq-companion-card--featured' : ''
      } ${ai ? 'lq-companion-card--ai' : ''} ${sent ? 'lq-companion-card--sent' : ''}`}
    >
      {featured ? (
        <span className="lq-companion-card__badge">❤️ 今日推薦</span>
      ) : null}
      <div className="lq-companion-card__row">
        <span className="lq-companion-card__emoji" aria-hidden>
          {sending ? <span className="lq-companionship-sending-dot" /> : preset.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="lq-companion-card__title">{preset.label}</p>
            {proBadge ? (
              <ProBadgeIfNeeded
                show
                feature="companionship_premium"
                size="sm"
                className={PRO_BADGE_MUTED}
              />
            ) : null}
          </div>
          {sent ? (
            <p className="lq-companion-card__status">已送出 ❤️</p>
          ) : sending ? (
            <p className="lq-companion-card__status lq-companion-card__status--muted">送出中…</p>
          ) : ai && preset.hint ? (
            <p className="lq-companion-card__hint">{preset.hint}</p>
          ) : preset.message ? (
            <p className="lq-companion-card__quote">「{preset.message}」</p>
          ) : null}
        </div>
      </div>
    </button>
  );
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

  const dailyFeatured = useMemo(() => buildDailyFeaturedPreset(), [open]);

  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customHint, setCustomHint] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sendCooldown, setSendCooldown] = useState(false);
  const [successBurst, setSuccessBurst] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sentPresetKey, setSentPresetKey] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const customInputRef = useRef<HTMLInputElement>(null);
  const customPanelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeActiveRef = useRef(false);

  const sendLocked = sendingKey !== null || sendCooldown || successBurst;

  const clearSendTimers = useCallback(() => {
    if (cooldownTimerRef.current != null) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (successTimerRef.current != null) {
      clearTimeout(successTimerRef.current);
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
      lightCompanionshipHaptic();
      setSuccessMessage(pickCompanionshipSuccessLine());
      setSuccessBurst(true);
      setSentPresetKey(presetKey);
      console.log(`${LOG} remaining count`, remaining);
      setSendCooldown(true);
      cooldownTimerRef.current = window.setTimeout(() => {
        setSendCooldown(false);
        cooldownTimerRef.current = null;
      }, SEND_COOLDOWN_MS);
      successTimerRef.current = window.setTimeout(() => {
        setSuccessBurst(false);
        setSuccessMessage('');
        setSentPresetKey(null);
        clearSendFeedback();
        onClose();
        successTimerRef.current = null;
      }, SUCCESS_DISPLAY_MS);
    },
    [clearSendFeedback, clearSendTimers, onClose]
  );

  const showSendFail = useCallback(
    (reason: string) => {
      const message = sendErrorMessage(reason);
      console.log(`${LOG} send fail`, reason);
      showToast(message, 'error', { position: 'top', durationMs: 2000 });
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
      setSuccessMessage('');
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

  const runSend = async (preset: CompanionshipPreset, sendingId: string) => {
    if (!canUseCompanionship || sendLocked) return;

    const gate = checkPresetCompanionshipSend(preset, isPro, currentUserId, coupleId);
    if (!gate.allowed) {
      showUpgrade(gate.hint);
      return;
    }

    console.log(`${LOG} sendCompanion start`, { preset: preset.type });
    setSendingKey(sendingId);
    await new Promise((resolve) => window.setTimeout(resolve, SEND_UI_DELAY_MS));

    const result = await sendCompanionship(preset);
    setSendingKey(null);

    if (result === 'ok') {
      const remaining = getCompanionshipSendsRemaining(currentUserId, coupleId, isPro);
      showSendSuccess(sendingId, remaining);
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

  const handleSend = (preset: CompanionshipPreset) => {
    void runSend(preset, preset.type);
  };

  const handleAiPick = () => {
    if (!canUseCompanionship || sendLocked) return;

    const gate = checkPresetCompanionshipSend(AI_COMPANIONSHIP_PICK_PRESET, isPro, currentUserId, coupleId);
    if (!gate.allowed) {
      showUpgrade(gate.hint);
      return;
    }

    const picked = pickAiCompanionshipLine();
    void runSend(picked, 'ai_pick');
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
    showSendSuccess('custom', remaining);
  };

  if (!open) return null;

  const presetDisabled = !canUseCompanionship || sendLocked;

  return createPortal(
    <>
      <CompanionshipSuccessOverlay open={successBurst} message={successMessage} />

      <div className="fixed inset-0 z-[110] flex flex-col justify-end" role="presentation">
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-[#3d3539]/25 backdrop-blur-[4px]"
          aria-label="關閉"
          onClick={onClose}
        />
        <div
          ref={sheetRef}
          className="lq-companionship-sheet relative z-10 flex w-full max-h-[min(92dvh,100%)] flex-col overflow-hidden rounded-t-[28px] shadow-2xl"
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
            className="shrink-0 touch-pan-y px-5 pt-3"
            onTouchStart={(e) => onSwipeStart(e.touches[0]?.clientY ?? 0)}
            onTouchMove={(e) => onSwipeMove(e.touches[0]?.clientY ?? 0)}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeEnd}
          >
            <div className="mx-auto h-1 w-9 rounded-full bg-rose-200/60" aria-hidden />
            <header className="pb-4 pt-5 text-center">
              <p className="text-[22px] font-extrabold tracking-tight text-[#3d3539]">
                💕 今天想怎麼陪他？
              </p>
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#b07a8f]">
                不用打字，
                <br />
                一秒把陪伴送給對方。
              </p>
              {canUseCompanionship && freeSendsRemaining !== null ? (
                <p className="mt-3 text-[11px] font-bold tracking-wide text-[#d08ba5]/90">
                  今天還可送 {freeSendsRemaining} 次
                </p>
              ) : null}
            </header>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 [-webkit-overflow-scrolling:touch]">
            <div className="space-y-3.5">
              <CompanionCard
                preset={dailyFeatured}
                disabled={presetDisabled}
                sending={sendingKey === 'featured'}
                sent={sentPresetKey === 'featured'}
                featured
                onPress={() => handleSend(dailyFeatured)}
              />

              {COMPANIONSHIP_PRESETS.map((preset) => (
                <CompanionCard
                  key={preset.type}
                  preset={preset}
                  disabled={presetDisabled}
                  sending={sendingKey === preset.type}
                  sent={sentPresetKey === preset.type}
                  onPress={() => handleSend(preset)}
                />
              ))}

              <CompanionCard
                preset={AI_COMPANIONSHIP_PICK_PRESET}
                disabled={presetDisabled}
                sending={sendingKey === 'ai_pick'}
                sent={sentPresetKey === 'ai_pick'}
                ai
                proBadge={companionshipPro.showProBadge}
                onPress={handleAiPick}
              />

              <button
                type="button"
                disabled={!canUseCompanionship || sendLocked}
                onClick={handleCustomToggle}
                className={`lq-companion-card w-full text-left transition active:scale-[0.985] disabled:opacity-45 ${
                  customOpen ? 'ring-2 ring-rose-200/50' : ''
                } ${sentPresetKey === 'custom' ? 'lq-companion-card--sent' : ''}`}
              >
                <div className="lq-companion-card__row">
                  <span className="lq-companion-card__emoji" aria-hidden>
                    ✍️
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="lq-companion-card__title">自訂一句</p>
                      <ProBadgeIfNeeded
                        show={companionshipPro.showProBadge}
                        feature="companionship_premium"
                        size="sm"
                        className={PRO_BADGE_MUTED}
                      />
                    </div>
                    {sentPresetKey === 'custom' ? (
                      <p className="lq-companion-card__status">已送出 ❤️</p>
                    ) : (
                      <p className="lq-companion-card__quote">寫一句專屬的短句給對方</p>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {customOpen ? (
              <div ref={customPanelRef} className="lq-companionship-custom mt-3 rounded-2xl p-3">
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
                    className="lq-companionship-custom-input w-full rounded-xl border border-rose-100/80 bg-white/95 px-3.5 py-3 text-[15px] font-semibold text-[#3d3539] placeholder:text-[#d0c4cb] outline-none ring-rose-200/60 focus:ring-2"
                  />
                </label>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#c4a0ad]">
                    {customText.trim().length}/{COMPANIONSHIP_CUSTOM_MAX_LEN}
                  </span>
                  <button
                    type="button"
                    disabled={!canUseCompanionship || sendLocked || !customText.trim()}
                    onClick={() => void handleCustomSend()}
                    className={`shrink-0 ${lq.btnPrimary} !min-h-9 !px-4 !py-1.5 !text-[13px] disabled:opacity-40`}
                  >
                    {sendingKey === 'custom' ? '送出中…' : '送出'}
                  </button>
                </div>
                {customHint ? (
                  <p className="mt-2 text-[12px] font-semibold text-amber-700/90" role="alert">
                    {customHint}
                  </p>
                ) : null}
              </div>
            ) : null}

            {!canUseCompanionship && bindHint ? (
              <p className="mt-4 text-center text-[12px] font-semibold text-[#c4a0ad]">{bindHint}</p>
            ) : null}
          </div>

          <div className="shrink-0 px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="mx-auto block rounded-full px-5 py-2 text-[13px] font-semibold text-[#b07a8f] transition active:scale-[0.98] active:text-[#9d174d]"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
