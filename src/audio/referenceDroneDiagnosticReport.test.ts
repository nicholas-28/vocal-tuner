import { describe, expect, it } from 'vitest';
import { createBuildInfo } from '../config/buildInfo';
import { createInitialReferenceDroneDiagnostics } from './referenceDroneConfig';
import {
  formatAudioDiagnosticReport,
  summarizeAppleMobileBrowser,
} from './referenceDroneDiagnosticReport';

describe('audio diagnostic report', () => {
  it('formats safe build, lifecycle, and Web Audio state without microphone content', () => {
    const diagnostics = createInitialReferenceDroneDiagnostics(
      'webkitAudioContext',
      4,
    );
    diagnostics.contextState = 'interrupted';
    diagnostics.contextGenerationId = 2;
    diagnostics.userAgentSummary =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.4 Mobile/15E148 Safari/604.1';
    diagnostics.persistentSignal = {
      ...diagnostics.persistentSignal,
      classification: 'digitally-active',
      rms: 0.08,
      peak: 0.12,
    };
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
      {
        manualResults: {
          persistentDrone: 'no',
          directWebAudio: 'no',
          constantGainWebAudio: 'not-recorded',
          nativeAudio: 'yes',
          recreatedContext: 'not-recorded',
        },
        nativeAudio: {
          status: 'succeeded',
          playResult: 'resolved',
          playingEventReceived: true,
          timeUpdateReceived: true,
          currentTime: 1,
          endedEventReceived: true,
          paused: true,
          errorCode: null,
          errorMessage: null,
          events: ['playing', 'ended'],
        },
      },
    );

    expect(report).toContain('v0.0.0 · production · abcdef1');
    expect(report).toContain('Constructor: webkitAudioContext');
    expect(report).toContain('Context state: interrupted');
    expect(report).toContain('Apple mobile browser: iOS 18.4.1; Safari 18.4');
    expect(report).toContain('Persistent RMS: 0.08');
    expect(report).toContain('Persistent drone: no');
    expect(report).toContain('Native audio: yes');
    expect(report).toContain('Status: succeeded');
    expect(report).toContain('1. +12.5 ms — resume requested — interrupted');
    expect(report).toContain('No microphone audio or samples are included.');
    expect(report).not.toMatch(/token|secret|microphone sample:/i);
  });

  it('does not invent Apple versions for unrelated user agents', () => {
    expect(summarizeAppleMobileBrowser('Mozilla/5.0 Chrome/140')).toBe(
      'not detected',
    );
  });
});
