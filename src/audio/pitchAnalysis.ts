import type { RawPitchDetection } from '../types/pitch';
import { detectPitchYin, pitchDetectorConfig } from './pitchDetector';

export const pitchAnalysisConfig = {
  fftSize: 4096,
  analysisIntervalMs: 1000 / 30,
  publishIntervalMs: 1000 / 15,
  startupTimeoutMs: 1000,
  clockStallTimeoutMs: 250,
} as const;

export type PitchAnalysisHandle = {
  stop: () => Promise<void>;
  diagnostics: Readonly<{
    contextState: string;
    sampleRate: number | null;
    destinationChannelCount: number | null;
    destinationConnected: false;
  }>;
};

type AudioContextConstructor = new () => AudioContext;

export function startPitchAnalysis(
  stream: MediaStream,
  onDetection: (detection: RawPitchDetection) => void,
  onError: () => void,
  onObservation?: (detection: RawPitchDetection) => void,
): PitchAnalysisHandle {
  const AudioContextClass = getAudioContextConstructor();
  const context = new AudioContextClass();
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let samples: Float32Array<ArrayBuffer> | null = null;
  let centeredBuffer: Float32Array | null = null;
  let differenceBuffer: Float64Array | null = null;
  let animationFrame: number | null = null;
  let lastAnalysisAt = -pitchAnalysisConfig.analysisIntervalMs;
  let lastPublishedAt = -pitchAnalysisConfig.publishIntervalMs;
  let lastAudioTime = context.currentTime;
  let lastProgressAt = performance.now();
  let hasProgressed = false;
  let hasRun = context.state === 'running';
  let stopped = false;
  let stopPromise: Promise<void> | null = null;

  const stop = (): Promise<void> => {
    if (stopped) return stopPromise ?? Promise.resolve();
    stopped = true;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    context.removeEventListener('statechange', onStateChange);
    // Attempt every release even if an individual browser operation fails.
    for (const node of [source, analyser]) {
      try {
        node?.disconnect();
      } catch {
        /* Already disconnected. */
      }
    }
    samples = null;
    centeredBuffer = null;
    differenceBuffer = null;
    stopPromise = (async () => {
      if (context.state !== 'closed') await context.close();
    })();
    // Failure callbacks cannot await cleanup; callers can still await stop().
    void stopPromise.catch(() => undefined);
    return stopPromise;
  };

  const fail = () => {
    if (stopped) return;
    void stop();
    onError();
  };

  function onStateChange() {
    if (stopped) return;
    if (context.state === 'running') hasRun = true;
    else if (hasRun || context.state !== 'suspended') fail();
  }

  const analyze = (timestamp: number) => {
    if (stopped || samples === null || analyser === null) return;
    try {
      onStateChange();
      if (stopped) return;
      const now = performance.now();
      if (context.state !== 'running') {
        if (now - lastProgressAt >= pitchAnalysisConfig.startupTimeoutMs) {
          fail();
          return;
        }
      } else if (
        timestamp - lastAnalysisAt >=
        pitchAnalysisConfig.analysisIntervalMs
      ) {
        lastAnalysisAt = timestamp;
        const audioTime = context.currentTime;
        if (!Number.isFinite(audioTime) || audioTime < lastAudioTime) {
          fail();
          return;
        }
        // A stable note is valid. Freshness comes from the render clock, never
        // from comparing pitches or sample values. Repeated clock ticks do not
        // receive new observation timestamps, even during the jitter allowance.
        if (audioTime > lastAudioTime) {
          lastAudioTime = audioTime;
          lastProgressAt = now;
          hasProgressed = true;
          analyser.getFloatTimeDomainData(samples);
          const detection = detectPitchYin(samples, context.sampleRate, now, {
            differenceBuffer: differenceBuffer ?? undefined,
            centeredBuffer: centeredBuffer ?? undefined,
          });
          // Realtime consumers receive every computed observation before the UI gate.
          onObservation?.(detection);
          if (stopped) return;
          if (
            timestamp - lastPublishedAt >=
            pitchAnalysisConfig.publishIntervalMs
          ) {
            onDetection(detection);
            lastPublishedAt = timestamp;
          }
        } else if (
          now - lastProgressAt >=
          (hasProgressed
            ? pitchAnalysisConfig.clockStallTimeoutMs
            : pitchAnalysisConfig.startupTimeoutMs)
        ) {
          fail();
          return;
        }
      }
      if (!stopped) animationFrame = requestAnimationFrame(analyze);
    } catch {
      fail();
    }
  };

  try {
    source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = pitchAnalysisConfig.fftSize;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser); // Deliberately no microphone destination connection.
    samples = new Float32Array(analyser.fftSize);
    centeredBuffer = new Float32Array(analyser.fftSize);
    differenceBuffer = new Float64Array(
      Math.ceil(context.sampleRate / pitchDetectorConfig.minimumFrequencyHz) +
        1,
    );
    context.addEventListener('statechange', onStateChange);
    if (context.state === 'suspended') {
      void context.resume().catch(fail);
    }
    animationFrame = requestAnimationFrame(analyze);
    return {
      stop,
      diagnostics: Object.freeze({
        contextState: String(context.state),
        sampleRate: Number.isFinite(context.sampleRate)
          ? context.sampleRate
          : null,
        destinationChannelCount: Number.isFinite(
          context.destination.channelCount,
        )
          ? context.destination.channelCount
          : null,
        destinationConnected: false,
      }),
    };
  } catch (error) {
    void stop();
    throw error;
  }
}

function getAudioContextConstructor(): AudioContextConstructor {
  const webkitWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  const AudioContextClass =
    window.AudioContext ?? webkitWindow.webkitAudioContext;
  if (!AudioContextClass)
    throw new DOMException('Web Audio is unavailable', 'NotSupportedError');
  return AudioContextClass;
}
