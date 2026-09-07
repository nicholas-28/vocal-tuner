// Synthetic data only. Run: node scripts/pitch-performance-baseline.mjs
// Vite loads the existing TS modules; no server listens and no new dependency is used.
import { arch, cpus, platform } from 'node:os';
import { createServer } from 'vite';

const loader = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: 'error',
  server: { middlewareMode: true, watch: null, ws: false },
  appType: 'custom',
});
try {
  const { detectPitchYin, pitchDetectorConfig } = await loader.ssrLoadModule(
    '/src/audio/pitchDetector.ts',
  );
  const { pitchAnalysisConfig } = await loader.ssrLoadModule(
    '/src/audio/pitchAnalysis.ts',
  );
  const { createAnalysisDurationProbe } = await loader.ssrLoadModule(
    '/src/pitch/analysisDurationProbe.ts',
  );
  const cases = [];
  const sampleRates = process.argv.includes('--reverse')
    ? [96000, 48000, 44100]
    : [44100, 48000, 96000];
  for (const sampleRate of sampleRates) {
    for (const signal of [82.41, 220, 880, 'silence', 'noise']) {
      let seed = 12345;
      const windows = Array.from({ length: 8 }, (_, frame) =>
        Float32Array.from(
          { length: pitchAnalysisConfig.fftSize },
          (_, index) => {
            if (signal === 'silence') return 0;
            if (signal === 'noise') {
              seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
              return 0.2 * (seed / 2 ** 32 - 0.5);
            }
            const phase =
              2 * Math.PI * signal * (index / sampleRate + frame / 30);
            return (
              0.3 * Math.sin(phase) +
              0.1 * Math.sin(2 * phase) +
              0.05 * Math.sin(3 * phase)
            );
          },
        ),
      );
      const options = {
        centeredBuffer: new Float32Array(pitchAnalysisConfig.fftSize),
        differenceBuffer: new Float64Array(
          Math.ceil(sampleRate / pitchDetectorConfig.minimumFrequencyHz) + 1,
        ),
      };
      const analyze = (index) =>
        detectPitchYin(
          windows[index % windows.length],
          sampleRate,
          (index * 1000) / 30,
          options,
        );
      // Warm the code before measuring; input creation and summaries are outside timing.
      for (let index = 0; index < 64; index += 1) analyze(index);
      const runs = [];
      for (let run = 0; run < 3; run += 1) {
        const probe = createAnalysisDurationProbe();
        let accepted = 0;
        let maximumAbsoluteErrorCents = null;
        for (let index = 0; index < 128; index += 1) {
          const result = analyze(index);
          probe.record(result.analysisDurationMs);
          if (result.frequencyHz !== null) {
            accepted += 1;
            if (typeof signal === 'number')
              maximumAbsoluteErrorCents = Math.max(
                maximumAbsoluteErrorCents ?? 0,
                Math.abs(1200 * Math.log2(result.frequencyHz / signal)),
              );
          }
        }
        runs.push({
          ...probe.getSummary(),
          accepted,
          maximumAbsoluteErrorCents,
        });
      }
      cases.push({ sampleRate, signal, runs });
    }
  }
  console.log(
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        environment: {
          node: process.version,
          platform: platform(),
          arch: arch(),
          cpu: cpus()[0]?.model,
        },
        policy: {
          sampleRates,
          warmupPerCase: 64,
          observationsPerRun: 128,
          runsPerCase: 3,
          fftSize: pitchAnalysisConfig.fftSize,
          timing:
            'detector analysisDurationMs only; reusable buffers; unpaced desktop Node, not iPhone or end-to-end latency',
        },
        cases,
      },
      null,
      2,
    ),
  );
} finally {
  await loader.close();
}
