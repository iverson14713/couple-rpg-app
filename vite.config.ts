import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const assistantTarget = env.ASSISTANT_SERVER_URL || 'http://127.0.0.1:8788';

  return {
    /**
     * Web (Vercel): '/' — nested routes like /auth/callback must load /assets/*, not /auth/assets/*.
     * Capacitor: npm run build:capacitor uses --mode capacitor → base './' for file:// WebView.
     */
    base: mode === 'capacitor' ? './' : '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: assistantTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
