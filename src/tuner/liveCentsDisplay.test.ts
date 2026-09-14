import { expect, it } from 'vitest';
import { createPitchSource } from '../pitch/pitchSource';
import { createPitchDetection } from '../test/pitchFixture';
import { transitionLiveCentsDisplay } from './liveCentsDisplay';

it('acquires fresh evidence immediately, animates at display refresh, resets notes/session, and preserves raw truth', () => {
  const producer = createPitchSource();
  producer.beginSession(1);
  const raw = createPitchDetection({
    frequencyHz: 440 * 2 ** (-30 / 1200),
    timestampMs: 100,
  });
  producer.publish(raw, 1);
  const first = producer.source.getLatest();
  const initial = transitionLiveCentsDisplay(null, first, 100, false);
  expect(initial?.cents).toBeCloseTo(-30, 8);
  producer.publish(
    createPitchDetection({ frequencyHz: 440, timestampMs: 133 }),
    1,
  );
  const sample = producer.source.getLatest();
  const next = transitionLiveCentsDisplay(initial, sample, 133, false);
  const animation = transitionLiveCentsDisplay(next, sample, 150, false);
  expect(animation!.cents).toBeGreaterThan(next!.cents);
  expect(sample?.cents).toBe(0);
  expect(producer.source.getLatest()).toBe(sample);
  expect(first?.raw?.frequencyHz).toBe(raw.frequencyHz);
  producer.publish(
    createPitchDetection({ frequencyHz: 466.16, timestampMs: 167 }),
    1,
  );
  expect(
    transitionLiveCentsDisplay(
      animation,
      producer.source.getLatest(),
      167,
      false,
    )?.cents,
  ).toBe(producer.source.getLatest()?.cents);
  producer.beginSession(2);
  producer.publish(
    createPitchDetection({ frequencyHz: 440, timestampMs: 200 }),
    2,
  );
  expect(
    transitionLiveCentsDisplay(initial, producer.source.getLatest(), 200, false)
      ?.cents,
  ).toBe(0);
});
it.each([
  'silence',
  'low-confidence',
  'yin-threshold',
  'detector-error',
] as const)(
  'clears %s instead of inventing or holding live geometry',
  (rejectionReason) => {
    const producer = createPitchSource();
    producer.beginSession(1);
    producer.publish(createPitchDetection({ timestampMs: 100 }), 1);
    const initial = transitionLiveCentsDisplay(
      null,
      producer.source.getLatest(),
      100,
      false,
    );
    producer.publish(
      createPitchDetection({
        timestampMs: 134,
        rejectionReason,
        frequencyHz: null,
      }),
      1,
    );
    expect(
      transitionLiveCentsDisplay(
        initial,
        producer.source.getLatest(),
        134,
        false,
      ),
    ).toBeNull();
  },
);
it('hides stale, future, inactive, and cleared samples; reduced motion uses raw cents', () => {
  const producer = createPitchSource();
  producer.beginSession(1);
  producer.publish(createPitchDetection({ timestampMs: 100 }), 1);
  const sample = producer.source.getLatest();
  const initial = transitionLiveCentsDisplay(null, sample, 100, false);
  expect(transitionLiveCentsDisplay(initial, sample, 351, false)).toBeNull();
  expect(transitionLiveCentsDisplay(initial, sample, 99, false)).toBeNull();
  expect(
    transitionLiveCentsDisplay({ ...initial!, cents: 20 }, sample, 120, true)
      ?.cents,
  ).toBe(sample?.cents);
  producer.invalidate();
  expect(
    transitionLiveCentsDisplay(
      initial,
      producer.source.getLatest(),
      120,
      false,
    ),
  ).toBeNull();
  producer.clear();
  expect(
    transitionLiveCentsDisplay(
      initial,
      producer.source.getLatest(),
      120,
      false,
    ),
  ).toBeNull();
});

it.each([10, 30])(
  'preserves ±%s-cent vibrato with actual 30 Hz evidence and 60 Hz display reads',
  (amplitude) => {
    const producer = createPitchSource();
    producer.beginSession(1);
    let display: ReturnType<typeof transitionLiveCentsDisplay> = null;
    const outputs: number[] = [];
    for (let frame = 0; frame < 180; frame++) {
      const now = (frame * 1000) / 60;
      if (frame % 2 === 0) {
        const cents = amplitude * Math.sin((2 * Math.PI * 5 * now) / 1000);
        producer.publish(
          createPitchDetection({
            timestampMs: now,
            frequencyHz: 440 * 2 ** (cents / 1200),
          }),
          1,
        );
      }
      const sample = producer.source.getLatest();
      display = transitionLiveCentsDisplay(display, sample, now, false);
      if (frame > 60) outputs.push(display!.cents);
      expect(producer.source.getLatest()).toBe(sample);
    }
    expect(Math.max(...outputs)).toBeGreaterThan(amplitude * 0.6);
    expect(Math.max(...outputs)).toBeLessThanOrEqual(amplitude);
  },
);
