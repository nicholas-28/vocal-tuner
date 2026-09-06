import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createPitchDetection } from '../test/pitchFixture';
import { createStubPitchSource } from '../test/stubPitchSource';
import {
  createPitchSource,
  isFreshPitchSample,
  PITCH_SOURCE_CAPACITY,
} from './pitchSource';

const detection = (timestampMs: number) =>
  createPitchDetection({ timestampMs, frequencyHz: 440 });

describe('PitchSource', () => {
  it('starts empty and publishes accepted musical evidence without subscribers', () => {
    const producer = createPitchSource(() => 100);
    const { source } = producer;
    expect(source.getLatest()).toBeNull();
    expect(producer.publish(detection(100), 1)).toBe(false);
    producer.beginSession(1);
    expect(source.getLatest()).toMatchObject({
      timestampMs: null,
      freshness: 'inactive',
      sessionGeneration: 1,
    });
    expect(producer.publish(detection(100), 1)).toBe(true);
    expect(source.getLatest()).toMatchObject({
      timestampMs: 100,
      frequencyHz: 440,
      fractionalMidi: 69,
      nearestMidi: 69,
      cents: 0,
      freshness: 'fresh',
      voicing: 'voiced',
    });
  });

  it('delivers to multiple subscribers, isolates errors, and honors unsubscribe', () => {
    const producer = createPitchSource();
    producer.beginSession(1);
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = producer.source.subscribe(first);
    producer.source.subscribe(() => {
      throw new Error('consumer failed');
    });
    producer.source.subscribe(second);
    producer.publish(detection(1), 1);
    expect(first).toHaveBeenCalledWith(producer.source.getLatest());
    expect(second).toHaveBeenCalledOnce();
    unsubscribe();
    unsubscribe();
    producer.publish(detection(2), 1);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('handles subscriber removal/addition and reentrant session changes safely', () => {
    const producer = createPitchSource();
    producer.beginSession(1);
    const second = vi.fn();
    const added = vi.fn();
    let removeSecond = () => {};
    const removeFirst = producer.source.subscribe(() => {
      removeSecond();
      producer.source.subscribe(added);
    });
    removeSecond = producer.source.subscribe(second);
    producer.publish(detection(1), 1);
    expect(second).not.toHaveBeenCalled();
    expect(added).not.toHaveBeenCalled();
    removeFirst();
    producer.publish(detection(2), 1);
    expect(added).toHaveBeenCalledOnce();
    const next = createPitchSource();
    next.beginSession(1);
    next.source.subscribe((sample) => {
      if (sample?.freshness === 'fresh') next.beginSession(2);
    });
    const observer = vi.fn();
    next.source.subscribe(observer);
    next.publish(detection(1), 1);
    expect(observer).toHaveBeenCalledOnce();
    expect(observer.mock.calls[0][0].sessionGeneration).toBe(2);
    expect(next.source.getLatest()?.sessionGeneration).toBe(2);
  });

  it('returns the same immutable sample on repeated reads, without clock reads or notifications', () => {
    const now = vi.fn(() => 100);
    const producer = createPitchSource(now);
    producer.beginSession(1);
    const input = detection(100);
    producer.publish(input, 1);
    const latest = producer.source.getLatest()!;
    const listener = vi.fn();
    producer.source.subscribe(listener);
    input.frequencyHz = 880;
    expect(latest.frequencyHz).toBe(440);
    expect(Object.isFrozen(latest)).toBe(true);
    expect(Object.isFrozen(latest.raw)).toBe(true);
    expect(Object.isFrozen(latest.raw?.settings)).toBe(true);
    for (let index = 0; index < 120; index += 1)
      expect(producer.source.getLatest()).toBe(latest);
    expect(listener).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    expect(producer.source.getRecent(100)).toEqual([latest]);
  });

  it('bounds chronological recent retention and filters against the supplied clock', () => {
    let now = 1000;
    const producer = createPitchSource(() => now);
    producer.beginSession(1);
    for (let timestamp = 1; timestamp <= 1000; timestamp += 1)
      producer.publish(detection(timestamp), 1);
    const retained = producer.source.getRecent(10000);
    expect(retained).toHaveLength(PITCH_SOURCE_CAPACITY);
    expect(retained[0]?.timestampMs).toBe(1001 - PITCH_SOURCE_CAPACITY);
    expect(
      producer.source.getRecent(2).map((sample) => sample.timestampMs),
    ).toEqual([998, 999, 1000]);
    now = 2000;
    expect(producer.source.getRecent(100)).toEqual([]);
    expect(producer.source.getRecent(Number.NaN)).toEqual([]);
    expect(producer.source.getRecent(-1)).toEqual([]);
  });

  it('never carries accepted pitch into rejected frames or manufactures observation times on invalidation', () => {
    const producer = createPitchSource(() => 200);
    producer.beginSession(1);
    producer.publish(detection(100), 1);
    producer.publish(
      createPitchDetection({
        timestampMs: 150,
        frequencyHz: null,
        rejectionReason: 'low-confidence',
        rawCandidateFrequencyHz: 440,
      }),
      1,
    );
    expect(producer.source.getLatest()).toMatchObject({
      frequencyHz: null,
      fractionalMidi: null,
      nearestMidi: null,
      cents: null,
      freshness: 'fresh',
      voicing: 'uncertain',
    });
    producer.publish(
      createPitchDetection({
        timestampMs: 200,
        frequencyHz: null,
        rejectionReason: 'silence',
      }),
      1,
    );
    expect(producer.source.getLatest()?.voicing).toBe('unvoiced');
    producer.invalidate('stale');
    expect(producer.source.getLatest()).toMatchObject({
      timestampMs: 200,
      freshness: 'stale',
      frequencyHz: null,
    });
    expect(producer.source.getRecent(1000)).toEqual([]);
    expect(producer.publish(detection(300), 1)).toBe(false);
    producer.invalidate();
    expect(producer.source.getLatest()?.freshness).toBe('inactive');
  });

  it('rejects obsolete sessions, duplicate/regressing times, and clear revokes the current session', () => {
    const producer = createPitchSource();
    producer.beginSession(1);
    producer.publish(detection(100), 1);
    producer.beginSession(3);
    expect(producer.beginSession(1)).toBe(false);
    expect(producer.publish(detection(1000), 1)).toBe(false);
    producer.publish(detection(200), 3);
    const latest = producer.source.getLatest();
    for (const time of [200, 199, Number.NaN, Infinity])
      expect(producer.publish(detection(time), 3)).toBe(false);
    expect(producer.source.getLatest()).toBe(latest);
    const listener = vi.fn();
    producer.source.subscribe(listener);
    producer.clear();
    expect(listener).toHaveBeenCalledWith(null);
    expect(producer.source.getLatest()).toBeNull();
    expect(producer.source.getRecent(1000)).toEqual([]);
    expect(producer.publish(detection(300), 3)).toBe(false);
    expect(producer.beginSession(3)).toBe(false);
    expect(producer.beginSession(4)).toBe(true);
  });

  it('requires an age check when delivery of browser lifecycle events is delayed', () => {
    const producer = createPitchSource();
    producer.beginSession(1);
    producer.publish(detection(100), 1);
    const sample = producer.source.getLatest();
    expect(isFreshPitchSample(sample, 200)).toBe(true);
    expect(isFreshPitchSample(sample, 351)).toBe(false);
    expect(isFreshPitchSample(sample, 99)).toBe(false);
    expect(isFreshPitchSample(sample, NaN)).toBe(false);
    producer.invalidate('stale');
    expect(isFreshPitchSample(producer.source.getLatest(), 200)).toBe(false);
    expect(isFreshPitchSample(null, 200)).toBe(false);
  });

  it('steps a deterministic C4 D4 E4 silence G4 fixture with no timers', () => {
    const notes = [261.6255653, 293.6647679, 329.6275569, null, 391.995436];
    const stub = createStubPitchSource(
      notes.map((frequencyHz, index) =>
        createPitchDetection({
          timestampMs: index * 100,
          frequencyHz,
          confidence: frequencyHz === null ? 0 : 0.95,
          rejectionReason: frequencyHz === null ? 'silence' : 'detected',
        }),
      ),
    );
    expectTypeOf<keyof typeof stub.source>().toEqualTypeOf<
      'subscribe' | 'getLatest' | 'getRecent'
    >();
    expect(Object.keys(stub.source).sort()).toEqual([
      'getLatest',
      'getRecent',
      'subscribe',
    ]);
    const observed = notes.map(() => stub.step());
    expect(observed.map((sample) => sample?.nearestMidi)).toEqual([
      60,
      62,
      64,
      null,
      67,
    ]);
    expect(observed[3]?.voicing).toBe('unvoiced');
    expect(stub.source.getRecent(1000)).toEqual(observed);
    expect(stub.step()).toBeNull();
    expect(stub.source.getLatest()?.freshness).toBe('inactive');
    stub.reset();
    expect(stub.step()).toMatchObject({
      timestampMs: 0,
      nearestMidi: 60,
      sessionGeneration: 2,
    });
    expect(() => createStubPitchSource([detection(2), detection(1)])).toThrow();
    expect(() => createStubPitchSource([detection(-0.5)])).toThrow();
  });
});
