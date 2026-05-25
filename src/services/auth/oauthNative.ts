import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import LoveQuestOAuth from '../../native/loveQuestOAuth';
import { handleOAuthCallbackUrl } from '../../native/capacitorAuthBridge';
import { NATIVE_OAUTH_URL_SCHEME } from './authRedirect';
import { authLog, isAuthNativeClient } from './authDebug';

/**
 * Open OAuth authorize URL outside the app WebView.
 * iOS: ASWebAuthenticationSession (lovequest:// callback). Android: Capacitor Browser.
 */
export async function openOAuthInExternalBrowser(url: string): Promise<void> {
  const isNative = isAuthNativeClient();
  authLog('oauth.open.request', {
    isNative,
    platform: Capacitor.getPlatform(),
    urlLength: url.length,
    oauthUrl: url,
    callbackScheme: NATIVE_OAUTH_URL_SCHEME,
  });

  if (!isNative) {
    authLog('oauth.open.blocked', { reason: 'not_native_client' });
    throw new Error('openOAuthInExternalBrowser is only for native platforms');
  }

  if (Capacitor.getPlatform() === 'ios') {
    try {
      const { url: callbackUrl } = await LoveQuestOAuth.authenticate({
        url,
        callbackScheme: NATIVE_OAUTH_URL_SCHEME,
      });
      authLog('LoveQuestOAuth.authenticate.success', { callbackUrl });
      console.log('[LQ_AUTH] appUrlOpen', callbackUrl);
      handleOAuthCallbackUrl(callbackUrl, 'appUrlOpen');
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code?: string }).code) : '';
      if (code === 'CANCELED' || msg.toLowerCase().includes('cancel')) {
        authLog('LoveQuestOAuth.authenticate.canceled', {});
        throw new Error('oauth_cancelled');
      }
      authLog('LoveQuestOAuth.authenticate.error', { message: msg, code });
      throw e instanceof Error ? e : new Error(msg);
    }
  }

  try {
    await Browser.open({
      url,
      presentationStyle: 'fullscreen',
      toolbarColor: '#ffffff',
    });
    authLog('Browser.open.success', { platform: Capacitor.getPlatform() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    authLog('Browser.open.error', { message: msg });
    throw e;
  }

  void Browser.addListener('browserFinished', () => {
    authLog('Browser.browserFinished', { platform: Capacitor.getPlatform() });
  }).catch((err) => {
    authLog('Browser.addListener.error', { message: String(err) });
  });
}

/** Close system browser after redirect back to the app via custom URL scheme. */
export async function closeOAuthBrowserIfOpen(): Promise<void> {
  if (!isAuthNativeClient()) return;
  try {
    await Browser.close();
    authLog('Browser.close.success', {});
  } catch (e) {
    authLog('Browser.close.skip', { message: e instanceof Error ? e.message : String(e) });
  }
}
