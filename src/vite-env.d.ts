/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_VERCEL_ENV?: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
  readonly VITE_VERCEL_GIT_COMMIT_REF?: string;
  readonly VITE_ENABLE_TEST_CONTROLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
