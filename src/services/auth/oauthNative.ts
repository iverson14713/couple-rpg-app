import { Browser } from '@capacitor/browser';
import { authLog, isAuthNativeClient } from './authDebug';

/**
 * Open OAuth authorize URL outside the app WebView (SFSafariViewController on iOS).
 * Required for Google — embedded WebView returns 403 disallowed_useragent.
 */
export async function openOAuthInExternalBrowser(url: string): Promise<void> {
  const isNative = isAuthNativeClient();
  authLog('Browser.open.request', {
    isNative,
    urlLength: url.length,
    oauthUrl: url,
    presentationStyle: 'fullscreen',
    note: 'iOS 應開 SFSafariViewController；若無此 log 代表未走 native 分支',
  });

  if (!isNative) {
    authLog('Browser.open.blocked', {
      reason: 'not_native_client',
      hint: '仍在 WebView／瀏覽器分支，Google 會 disallowed_useragent',
    });
    throw new Error('openOAuthInExternalBrowser is only for native platforms');
  }

  try {
    await Browser.open({
      url,
      presentationStyle: 'fullscreen',
      toolbarColor: '#ffffff',
    });
    authLog('Browser.open.success', {
      message: '已呼叫 Capacitor Browser.open（iOS 應為 SFSafariViewController，非 App WebView）',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    authLog('Browser.open.error', { message: msg });
    throw e;
  }

  void Browser.addListener('browserFinished', () => {
    authLog('Browser.browserFinished', {});
  }).catch((e) => {
    authLog('Browser.addListener.error', { message: String(e) });
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
