import { createServer } from 'vite';
import { webkit } from '@playwright/test';

// Local synthetic metadata only. No microphone or audio capture.
const server = await createServer({
  server: { host: '127.0.0.1', port: 4181, strictPort: true },
});
let browser;
try {
  await server.listen();
  browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4181');
  const results = await page.evaluate(async () => {
    const { drawPitchCurve } =
      await import('/src/visualization/drawPitchCurve.ts');
    const { createPitchGridViewport } =
      await import('/src/visualization/pitchGridViewport.ts');
    const { DEFAULT_PITCH_CURVE_CONFIG } =
      await import('/src/visualization/pitchCurveConfig.ts');
    const cases = [];
    for (const [width, height, dpr] of [
      [250, 480, 3],
      [1100, 720, 2],
    ]) {
      const viewport = createPitchGridViewport({
        widthCssPx: width,
        heightCssPx: height,
        devicePixelRatio: dpr,
        lowMidi: 48,
        highMidi: 72,
        labelGutterCssPx: 0,
        rightPaddingCssPx: 8,
        topPaddingCssPx: 8,
        bottomPaddingCssPx: 8,
        presentTimeXRatio: 0.96,
      });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.backingWidthPx;
      canvas.height = viewport.backingHeightPx;
      const context = canvas.getContext('2d');
      for (const [seconds, hz] of [
        [5, 15],
        [15, 15],
        [30, 15],
        [30, 30],
      ]) {
        const points = Array.from({ length: seconds * hz + 1 }, (_, i) => ({
          timestampMs: 30000 - seconds * 1000 + (i * 1000) / hz,
          midi: 60 + Math.sin(i / 2) * 0.3 + Math.sin(i / 27) * 4,
          frequencyHz: 261.6,
          confidence: 0.95,
          kind: 'pitch',
        }));
        const config = {
          ...DEFAULT_PITCH_CURVE_CONFIG,
          visibleDurationMs: seconds * 1000,
        };
        for (let i = 0; i < 60; i++)
          drawPitchCurve(context, viewport, points, 30000, config);
        const durations = [];
        for (let i = 0; i < 40; i++) {
          const start = performance.now();
          for (let frame = 0; frame < 50; frame++)
            drawPitchCurve(context, viewport, points, 30000, config);
          durations.push((performance.now() - start) / 50);
        }
        durations.sort((a, b) => a - b);
        cases.push({
          width,
          height,
          dpr,
          seconds,
          hz,
          points: points.length,
          metadataJsonBytes: new TextEncoder().encode(JSON.stringify(points))
            .length,
          medianMs: durations[19],
          p95Ms: durations[37],
          maximumMs: durations.at(-1),
        });
      }
    }
    return cases;
  });
  console.log(
    JSON.stringify(
      {
        engine:
          'desktop WebKit, 50-frame batch averages, synthetic Canvas command submission; not physical iPhone or GPU presentation timing',
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
