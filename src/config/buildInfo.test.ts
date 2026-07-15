import { describe, expect, it } from 'vitest';
import {
  createBuildInfo,
  deriveDeploymentEnvironment,
  formatCompactBuildInfo,
} from './buildInfo';

describe('build info', () => {
  it.each([
    ['development', '', 'development'],
    ['test', '', 'test'],
    ['production', 'preview', 'preview'],
    ['production', 'production', 'production'],
    ['production', '', 'unknown'],
    ['staging', 'production', 'unknown'],
  ] as const)(
    'derives mode %s and Vercel environment %s as %s',
    (mode, vercelEnvironment, expected) => {
      expect(deriveDeploymentEnvironment(mode, vercelEnvironment)).toBe(
        expected,
      );
    },
  );

  it('validates safe metadata and formats a compact developer label', () => {
    const info = createBuildInfo({
      mode: 'production',
      vercelEnvironment: 'preview',
      applicationVersion: '0.1.0',
      gitCommitSha: 'abcdef1234567890',
      gitRef: 'issue-018-vercel-deployment',
    });

    expect(info).toEqual({
      applicationVersion: '0.1.0',
      deploymentEnvironment: 'preview',
      gitCommitSha: 'abcdef1234567890',
      gitRef: 'issue-018-vercel-deployment',
      testControlsEnabled: false,
    });
    expect(formatCompactBuildInfo(info)).toBe('v0.1.0 · preview · abcdef1');
    expect(Object.isFrozen(info)).toBe(true);
  });

  it('uses safe fallbacks for missing and malformed values', () => {
    expect(
      createBuildInfo({
        mode: 'production',
        vercelEnvironment: 'staging',
        applicationVersion: '/Users/private/project',
        gitCommitSha: 'token-value',
        gitRef: 'invalid ref with spaces',
        enableTestControls: 'TRUE',
      }),
    ).toEqual({
      applicationVersion: '0.0.0',
      deploymentEnvironment: 'unknown',
      gitCommitSha: null,
      gitRef: null,
      testControlsEnabled: false,
    });
  });

  it('allows explicit test controls outside production but never in production', () => {
    expect(
      createBuildInfo({
        mode: 'production',
        vercelEnvironment: 'preview',
        enableTestControls: 'true',
      }).testControlsEnabled,
    ).toBe(true);
    expect(
      createBuildInfo({
        mode: 'production',
        vercelEnvironment: 'production',
        enableTestControls: 'true',
      }).testControlsEnabled,
    ).toBe(false);
  });
});
