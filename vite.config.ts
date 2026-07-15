import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.npm_package_version ?? '0.0.0',
    ),
    'import.meta.env.VITE_VERCEL_ENV': JSON.stringify(
      process.env.VERCEL_ENV ?? '',
    ),
    'import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA': JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA ?? '',
    ),
    'import.meta.env.VITE_VERCEL_GIT_COMMIT_REF': JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_REF ?? '',
    ),
  },
});
