import type {
  BuildInfo,
  DeploymentEnvironment,
  RawBuildInfo,
} from '../types/buildInfo';

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/i;
const REF_PATTERN = /^[0-9A-Za-z._/-]{1,120}$/;

export function createBuildInfo(raw: RawBuildInfo): BuildInfo {
  const deploymentEnvironment = deriveDeploymentEnvironment(
    raw.mode,
    raw.vercelEnvironment,
  );
  return Object.freeze({
    applicationVersion: VERSION_PATTERN.test(raw.applicationVersion ?? '')
      ? (raw.applicationVersion as string)
      : '0.0.0',
    deploymentEnvironment,
    gitCommitSha: COMMIT_PATTERN.test(raw.gitCommitSha ?? '')
      ? (raw.gitCommitSha as string)
      : null,
    gitRef: REF_PATTERN.test(raw.gitRef ?? '') ? (raw.gitRef as string) : null,
    testControlsEnabled:
      deploymentEnvironment === 'test' ||
      (deploymentEnvironment !== 'production' &&
        raw.enableTestControls === 'true'),
  });
}

export function deriveDeploymentEnvironment(
  mode: string | undefined,
  vercelEnvironment: string | undefined,
): DeploymentEnvironment {
  if (mode === 'test') return 'test';
  if (mode === 'development') return 'development';
  if (mode !== 'production') return 'unknown';
  if (vercelEnvironment === 'preview') return 'preview';
  if (vercelEnvironment === 'production') return 'production';
  return 'unknown';
}

export function formatCompactBuildInfo(info: BuildInfo): string {
  const parts = [`v${info.applicationVersion}`, info.deploymentEnvironment];
  if (info.gitCommitSha) parts.push(info.gitCommitSha.slice(0, 7));
  return parts.join(' · ');
}

export const BUILD_INFO = createBuildInfo({
  mode: import.meta.env.MODE,
  applicationVersion: import.meta.env.VITE_APP_VERSION,
  vercelEnvironment: import.meta.env.VITE_VERCEL_ENV,
  gitCommitSha: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA,
  gitRef: import.meta.env.VITE_VERCEL_GIT_COMMIT_REF,
  enableTestControls: import.meta.env.VITE_ENABLE_TEST_CONTROLS,
});
