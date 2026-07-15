export type DeploymentEnvironment =
  'development' | 'preview' | 'production' | 'test' | 'unknown';

export type BuildInfo = Readonly<{
  applicationVersion: string;
  deploymentEnvironment: DeploymentEnvironment;
  gitCommitSha: string | null;
  gitRef: string | null;
  testControlsEnabled: boolean;
}>;

export type RawBuildInfo = Readonly<{
  mode?: string;
  applicationVersion?: string;
  vercelEnvironment?: string;
  gitCommitSha?: string;
  gitRef?: string;
  enableTestControls?: string;
}>;
