import { registerPlugin } from '@capacitor/core';

export interface LoveQuestOAuthAuthenticateResult {
  url: string;
}

export interface LoveQuestOAuthPlugin {
  authenticate(options: {
    url: string;
    /** Custom URL scheme, default lovequest */
    callbackScheme?: string;
  }): Promise<LoveQuestOAuthAuthenticateResult>;
}

const LoveQuestOAuth = registerPlugin<LoveQuestOAuthPlugin>('LoveQuestOAuth', {
  web: () => import('./loveQuestOAuth.web').then((m) => m.default),
});

export default LoveQuestOAuth;
