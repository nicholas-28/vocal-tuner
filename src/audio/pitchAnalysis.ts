import type { RawPitchDetection } from '../types/pitch';
import { detectPitchYin } from './pitchDetector';

export const pitchAnalysisConfig = {
  fftSize: 4096,
  analysisIntervalMs: 1000 / 30,
  publishIntervalMs: 1000 / 15,
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
): PitchAnalysisHandle {
  const AudioContextClass = getAudioContextConstructor();
  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = pitchAnalysisConfig.fftSize;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  let samples: Float32Array | null = new Float32Array(analyser.fftSize);
  let centeredBuffer: Float32Array | null = new Float32Array(analyser.fftSize);
  let differenceBuffer: Float64Array | null = new Float64Array(
    Math.floor(context.sampleRate / 65) + 1,
  );
  let animationFrame: number | null = null;
  let lastAnalysisAt = -pitchAnalysisConfig.analysisIntervalMs;
  let lastPublishedAt = -pitchAnalysisConfig.publishIntervalMs;
  let stopped = false;

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    source.disconnect();
    analyser.disconnect();
    samples = null;
    centeredBuffer = null;
    differenceBuffer = null;
    if (context.state !== 'closed') await context.close();
  };

  if (context.state === 'suspended') {
    void context.resume().catch(() => {
      onError();
      void stop();
    });
  }

  const analyze = (timestamp: number) => {
    if (stopped || samples === null) return;

    try {
      if (
        timestamp - lastAnalysisAt >=
        pitchAnalysisConfig.analysisIntervalMs
      ) {
        analyser.getFloatTimeDomainData(samples);
        const detection = detectPitchYin(
          samples,
          context.sampleRate,
          performance.now(),
          {
            differenceBuffer: differenceBuffer ?? undefined,
            centeredBuffer: centeredBuffer ?? undefined,
          },
        );
        lastAnalysisAt = timestamp;
        if (
          timestamp - lastPublishedAt >=
          pitchAnalysisConfig.publishIntervalMs
        ) {
          onDetection(detection);
          lastPublishedAt = timestamp;
        }
      }
      animationFrame = requestAnimationFrame(analyze);
    } catch {
      onError();
      void stop();
    }
  };

  animationFrame = requestAnimationFrame(analyze);
  return {
    stop,
    diagnostics: Object.freeze({
      contextState: String(context.state),
      sampleRate: Number.isFinite(context.sampleRate)
        ? context.sampleRate
        : null,
      destinationChannelCount: Number.isFinite(context.destination.channelCount)
        ? context.destination.channelCount
        : null,
      destinationConnected: false,
    }),
  };
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
