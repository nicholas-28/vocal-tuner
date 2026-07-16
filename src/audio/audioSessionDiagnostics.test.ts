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

  it('prepares supported session types, restores the prior value, and fails safely', () => {
    const audioSession = { type: 'auto', state: 'inactive' };
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: audioSession,
    });
    const timeline = createAudioSessionDiagnosticTimeline();
    expect(timeline.prepare('playback')).toBe('succeeded');
    expect(audioSession.type).toBe('playback');
    expect(timeline.getSnapshot().preparation).toMatchObject({
      priorType: 'auto',
      requestedType: 'playback',
      result: 'succeeded',
    });
    expect(timeline.restore()).toBe('restored');
    expect(audioSession.type).toBe('auto');
    expect(timeline.getSnapshot().preparation.priorType).toBeNull();

    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: undefined,
    });
    const unavailable = createAudioSessionDiagnosticTimeline();
    expect(unavailable.prepare('play-and-record')).toBe('unavailable');
  });

  it('reports rejected and throwing type setters without escaping errors', () => {
    let ignoredType = 'auto';
    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        get type() {
          return ignoredType;
        },
        set type(_value: string) {
          ignoredType = 'auto';
        },
        state: 'inactive',
      },
    });
    expect(createAudioSessionDiagnosticTimeline().prepare('playback')).toBe(
      'rejected',
    );

    Object.defineProperty(navigator, 'audioSession', {
      configurable: true,
      value: {
        get type() {
          return 'auto';
        },
        set type(_value: string) {
          throw new Error('setter blocked');
        },
        state: 'inactive',
      },
    });
    const throwing = createAudioSessionDiagnosticTimeline();
    expect(throwing.prepare('play-and-record')).toBe('failed');
    expect(throwing.getSnapshot().preparation.errorMessage).toBe(
      'setter blocked',
    );
  });

  it('keeps snapshots bounded and includes local phase annotations', () => {
    const timeline = createAudioSessionDiagnosticTimeline();
    for (let index = 0; index < 50; index += 1)
      timeline.capture(`event ${index}`);
    timeline.setPhaseAudibility('beforeMicrophone', 'silent');
    expect(timeline.getSnapshot().snapshots).toHaveLength(40);
    expect(timeline.getSnapshot().phaseAudibility.beforeMicrophone).toBe(
      'silent',
    );
    expect(
      timeline.getSnapshot().snapshots.at(-1)?.dronePhysicalAnnotation,
    ).toBe('silent');
  });
});
