import type { LoveQuestOAuthPlugin } from './loveQuestOAuth';

const LoveQuestOAuthWeb: LoveQuestOAuthPlugin = {
  async authenticate() {
    throw new Error('LoveQuestOAuth is only available on native iOS/Android');
  },
};

export default LoveQuestOAuthWeb;
