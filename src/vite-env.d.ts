/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Set to "true" when Supabase Auth → Apple provider is configured */
  readonly VITE_APPLE_OAUTH_ENABLED?: string;
  /** Capacitor iOS/Android: absolute origin for `/api/assistant/*` (defaults to Vercel) */
  readonly VITE_LOVEQUEST_API_ORIGIN?: string;
  /** Dev: local assistant server (also used on native when set) */
  readonly VITE_ASSISTANT_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
