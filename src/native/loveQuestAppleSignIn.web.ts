import type { LoveQuestAppleSignInPlugin } from './loveQuestAppleSignIn';

const LoveQuestAppleSignInWeb: LoveQuestAppleSignInPlugin = {
  async signIn(): Promise<never> {
    throw new Error('Native Sign in with Apple is only available on iOS');
  },
};

export default LoveQuestAppleSignInWeb;
