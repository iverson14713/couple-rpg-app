import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native WebView origin: https://lovequest.app
 * Add to Supabase → Authentication → URL Configuration → Redirect URLs:
 *   https://lovequest.app/auth/callback
 *   lovequest://auth/callback
 *
 * Google OAuth on iOS must use external browser (see oauthNative.ts), not WebView.
 */
const config: CapacitorConfig = {
  appId: 'com.lovequest.app',
  appName: 'LoveQuest',
  webDir: 'dist',
  server: {
    hostname: 'lovequest.app',
    iosScheme: 'https',
    androidScheme: 'https',
    allowNavigation: [
      '*.supabase.co',
      '*.supabase.in',
      'accounts.google.com',
      'appleid.apple.com',
    ],
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'LoveQuest',
  },
};

export default config;
