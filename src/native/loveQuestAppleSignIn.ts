import { registerPlugin } from '@capacitor/core';

export interface LoveQuestAppleSignInResult {
  identityToken: string;
  user?: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}

export interface LoveQuestAppleSignInPlugin {
  signIn(): Promise<LoveQuestAppleSignInResult>;
}

const LoveQuestAppleSignIn = registerPlugin<LoveQuestAppleSignInPlugin>('LoveQuestAppleSignIn', {
  web: () => import('./loveQuestAppleSignIn.web').then((m) => m.default),
});

export default LoveQuestAppleSignIn;
