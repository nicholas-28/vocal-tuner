export type InputLevelMonitorHandle = {
  stop: () => Promise<void>;
};

type AudioContextConstructor = new () => AudioContext;

const publishIntervalMs = 100;

export function startInputLevelMonitor(
  stream: MediaStream,
  onLevel: (level: number) => void,
): InputLevelMonitorHandle {
  const AudioContextClass = getAudioContextConstructor();
  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined);
  }

  const samples = new Float32Array(analyser.fftSize);
  let animationFrame: number | null = null;
  let lastPublishedAt = -publishIntervalMs;
  let stopped = false;

  const measure = (timestamp: number) => {
    if (stopped) return;

    analyser.getFloatTimeDomainData(samples);

    if (timestamp - lastPublishedAt >= publishIntervalMs) {
      let sumSquares = 0;
      for (const sample of samples) sumSquares += sample * sample;
      onLevel(Math.min(1, Math.sqrt(sumSquares / samples.length)));
      lastPublishedAt = timestamp;
    }

    animationFrame = requestAnimationFrame(measure);
  };

  animationFrame = requestAnimationFrame(measure);

  return {
    async stop() {
      if (stopped) return;
      stopped = true;

      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      source.disconnect();
      analyser.disconnect();
      onLevel(0);

      if (context.state !== 'closed') await context.close();
    },
  };
}

function getAudioContextConstructor(): AudioContextConstructor {
  const webkitWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  const AudioContextClass =
    window.AudioContext ?? webkitWindow.webkitAudioContext;

  if (!AudioContextClass) {
    throw new DOMException('Web Audio is unavailable', 'NotSupportedError');
  }

  return AudioContextClass;
}
