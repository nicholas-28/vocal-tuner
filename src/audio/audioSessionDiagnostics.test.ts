import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialReferenceDroneDiagnostics } from './referenceDroneConfig';
import { createAudioSessionDiagnosticTimeline } from './audioSessionDiagnostics';

describe('audio-session diagnostic timeline', () => {
  afterEach(() => vi.restoreAllMocks());

  it('captures ordered cross-context snapshots without audio samples', () => {
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: { type: 'auto', state: 'inactive' },
    });
    const timeline = createAudioSessionDiagnosticTimeline();
    const drone = createInitialReferenceDroneDiagnostics('AudioContext', 1);
    drone.contextGenerationId = 2;
    drone.contextState = 'running';
    drone.contextSampleRate = 48_000;
    drone.destinationChannelCount = 2;
    drone.persistentSignal = {
      ...drone.persistentSignal,
      rms: 0.113,
      peak: 0.16,
    };
    timeline.captureDrone('after drone resume', drone);
    timeline.captureMicrophone({
      label: 'after getUserMedia resolved',
      microphoneState: 'requesting',
      contextState: 'unavailable',
      sampleRate: null,
      destinationChannelCount: null,
      destinationConnected: false,
      activeTrackCount: 1,
      trackReadyState: 'live',
    });
    const snapshots = timeline.getSnapshot().snapshots;
    expect(snapshots.map((entry) => entry.label)).toEqual([
      'page load',
      'after drone resume',
      'after getUserMedia resolved',
    ]);
    expect(snapshots.at(-1)).toMatchObject({
      activeMicrophoneTrackCount: 1,
      microphoneTrackReadyState: 'live',
      outputRms: 0.113,
      outputPeak: 0.16,
    });
    expect(JSON.stringify(snapshots)).not.toContain('samples');
  });

  it('keeps snapshots bounded', () => {
    const timeline = createAudioSessionDiagnosticTimeline();
    for (let index = 0; index < 50; index += 1)
      timeline.capture(`event ${index}`);
    expect(timeline.getSnapshot().snapshots).toHaveLength(40);
    expect(timeline.getSnapshot().snapshots.at(-1)?.label).toBe('event 49');
  });
});
