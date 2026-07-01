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
  appId: 'com.wayne.lovequest',
  appName: 'LoveQuest',
  webDir: 'dist',
  // Local plugins (OAuth / Apple Sign-In / IAP) live in ios/App/App.
  // npm run build:ios loads .env.capacitor (VITE_ENABLE_DEV_MODE=true for device testing).
  // App Store Archive: npm run build:ios:release (dev mode forced off).
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
    backgroundColor: '#fff5f8',
  },
};

export default config;
