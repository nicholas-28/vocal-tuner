import { describe, expect, it } from 'vitest';
import { createBuildInfo } from '../config/buildInfo';
import { createInitialReferenceDroneDiagnostics } from './referenceDroneConfig';
import { formatAudioDiagnosticReport } from './referenceDroneDiagnosticReport';

describe('audio diagnostic report', () => {
  it('formats safe build, lifecycle, and Web Audio state without microphone content', () => {
    const diagnostics = createInitialReferenceDroneDiagnostics(
      'webkitAudioContext',
      4,
    );
    diagnostics.contextState = 'interrupted';
    diagnostics.contextGenerationId = 2;
    diagnostics.lifecycleLog = [
      {
        sequence: 1,
        relativeTimeMs: 12.5,
        name: 'resume requested',
        detail: 'interrupted',
      },
    ];
    const report = formatAudioDiagnosticReport(
      diagnostics,
      createBuildInfo({
        mode: 'production',
        vercelEnvironment: 'production',
        applicationVersion: '0.0.0',
        gitCommitSha: 'abcdef1234567',
      }),
    );

    expect(report).toContain('v0.0.0 · production · abcdef1');
    expect(report).toContain('Constructor: webkitAudioContext');
    expect(report).toContain('Context state: interrupted');
    expect(report).toContain('1. +12.5 ms — resume requested — interrupted');
    expect(report).toContain('No microphone audio or samples are included.');
    expect(report).not.toMatch(/token|secret|microphone sample:/i);
  });
});
