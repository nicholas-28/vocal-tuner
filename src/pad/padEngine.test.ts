import { afterEach, describe, expect, it, vi } from 'vitest';
import { PAD_ENVELOPE, PAD_GAIN_BUDGET } from './padConfig';
import { createPadEngine } from './padEngine';
import {
  selectTestPadContext,
  TestPadAudioContext,
  type TestPadAudioParam,
} from './test/padAudioMock';
import type { Chord, PadTarget } from './types';

const chord = (
  id: string,
  voiceCents: readonly [number, number, number],
): Chord => ({
  id,
  degree: 1,
  rootPitchClass: 0,
  quality: 'major',
  voiceCents,
});

const C_MAJOR = chord('c-major', [4800, 5200, 5500]);
const F_MAJOR = chord('f-major', [4800, 5300, 5700]);

const target = (
  harmonyChord: Chord | null = C_MAJOR,
  changed = true,
  shimmerCents: number | null = 6900,
): PadTarget => ({
  shimmerCents,
  harmony: { chord: harmonyChord, changed },
});

const rampEvents = (parameter: TestPadAudioParam) =>
  parameter.events.filter((event) => event.method === 'ramp');

const automationCount = (context: TestPadAudioContext) =>
  context.gains.reduce((count, gain) => count + gain.gain.events.length, 0) +
  context.oscillators.reduce(
    (count, oscillator) => count + oscillator.frequency.events.length,
    0,
  );

describe('PadEngine', () => {
  afterEach(() => {
    vi.useRealTimers();
    TestPadAudioContext.reset();
  });

  it('constructs, connects, and starts the complete graph before awaiting resume', async () => {
    TestPadAudioContext.nextState = 'suspended';
    TestPadAudioContext.nextResumeMode = 'deferred';
    const engine = createPadEngine({ selectContext: selectTestPadContext });

    const starting = engine.start();
    const context = TestPadAudioContext.instances[0]!;
    expect(engine.state).toBe('starting');
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(7);
    expect(context.gains).toHaveLength(8);
    expect(context.filters).toHaveLength(1);
    expect(
      context.oscillators.every(
        (oscillator) => oscillator.start.mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(context.connections).toEqual([
      'gain-0->destination',
      'filter-0->gain-0',
      'oscillator-0->gain-1',
      'gain-1->filter-0',
      'oscillator-1->gain-2',
      'gain-2->filter-0',
      'oscillator-2->gain-3',
      'gain-3->filter-0',
      'oscillator-3->gain-4',
      'gain-4->filter-0',
      'oscillator-4->gain-5',
      'gain-5->filter-0',
      'oscillator-5->gain-6',
      'gain-6->filter-0',
      'oscillator-6->gain-7',
      'gain-7->gain-0',
    ]);
    expect(
      context.oscillators
        .slice(0, 6)
        .every((oscillator) => oscillator.type === 'triangle'),
    ).toBe(true);
    expect(context.oscillators[6]?.type).toBe('sine');
    expect(context.filters[0]).toMatchObject({ type: 'lowpass' });
    expect(context.filters[0]?.frequency.value).toBe(1200);
    expect(engine.state).toBe('starting');

    context.resolveResume();
    await starting;
    expect(engine.state).toBe('running');
  });

  it('does not report running when resume resolves without a running context', async () => {
    TestPadAudioContext.nextState = 'suspended';
    TestPadAudioContext.nextResumeMode = 'stays-suspended';
    const engine = createPadEngine({ selectContext: selectTestPadContext });

    await expect(engine.start()).rejects.toThrow(
      'AudioContext did not reach the running state.',
    );
    const context = TestPadAudioContext.instances[0]!;
    expect(engine.state).toBe('idle');
    expect(
      context.oscillators.every(
        (oscillator) =>
          oscillator.stop.mock.calls.length === 1 &&
          oscillator.disconnect.mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('keeps simultaneous chord and shimmer peaks within the total budget', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);

    const activeChordGains = context.gains
      .slice(1, 4)
      .map((gain) => rampEvents(gain.gain).at(-1)?.value ?? 0);
    const shimmerGain = rampEvents(context.gains[7]!.gain).at(-1)?.value ?? 0;
    expect(activeChordGains).toEqual([
      PAD_GAIN_BUDGET.chordBody / 3,
      PAD_GAIN_BUDGET.chordBody / 3,
      PAD_GAIN_BUDGET.chordBody / 3,
    ]);
    expect(
      activeChordGains.reduce((sum, gain) => sum + gain, 0) + shimmerGain,
    ).toBeCloseTo(PAD_GAIN_BUDGET.totalPeak);
    expect(
      PAD_GAIN_BUDGET.chordBody + PAD_GAIN_BUDGET.shimmer,
    ).toBeLessThanOrEqual(PAD_GAIN_BUDGET.totalPeak);

    context.currentTime = 11;
    engine.render(target(F_MAJOR, true), 16);
    const outgoing = context.gains
      .slice(1, 4)
      .map((gain) => rampEvents(gain.gain).at(-1));
    const incoming = context.gains
      .slice(4, 7)
      .map((gain) => rampEvents(gain.gain).at(-1));
    expect(
      outgoing.every((event) => event?.value === 0 && event.time === 11.12),
    ).toBe(true);
    expect(
      incoming.every(
        (event) =>
          event?.value === PAD_GAIN_BUDGET.chordBody / 3 &&
          event.time === 11.12,
      ),
    ).toBe(true);
  });

  it('mutes and unmutes only the chord body over the crossfade envelope', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);
    const shimmerEvents = context.gains[7]!.gain.events.length;

    context.currentTime = 12;
    engine.setChordMuted(true);
    expect(
      context.gains.slice(1, 7).every((gain) => {
        const event = rampEvents(gain.gain).at(-1);
        return event?.value === 0 && event.time === 12.12;
      }),
    ).toBe(true);
    expect(context.gains[7]!.gain.events).toHaveLength(shimmerEvents);
    expect(
      context.oscillators.every(
        (oscillator) => oscillator.stop.mock.calls.length === 0,
      ),
    ).toBe(true);

    context.currentTime = 13;
    engine.setChordMuted(false);
    expect(
      context.gains.slice(1, 4).every((gain) => {
        const event = rampEvents(gain.gain).at(-1);
        return (
          event?.value === PAD_GAIN_BUDGET.chordBody / 3 && event.time === 13.12
        );
      }),
    ).toBe(true);
    expect(
      context.gains
        .slice(4, 7)
        .every((gain) => rampEvents(gain.gain).at(-1)?.value === 0),
    ).toBe(true);
    expect(context.gains[7]!.gain.events).toHaveLength(shimmerEvents);
  });

  it('does not allocate nodes or reschedule automation for identical 60 Hz targets', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    const sameTarget = target();
    engine.render(sameTarget, 0);
    const count = automationCount(context);
    for (let frame = 1; frame <= 60; frame += 1) {
      context.currentTime += 1 / 60;
      engine.render(
        {
          shimmerCents: sameTarget.shimmerCents,
          harmony: { chord: sameTarget.harmony.chord, changed: false },
        },
        frame * (1000 / 60),
      );
    }
    expect(context.oscillators).toHaveLength(7);
    expect(context.gains).toHaveLength(8);
    expect(context.filters).toHaveLength(1);
    expect(automationCount(context)).toBe(count);
  });

  it('schedules one reusable-bank transition for one changed chord identity', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);
    const before = automationCount(context);

    context.currentTime = 14;
    engine.render(target(F_MAJOR, true), 16);
    const afterTransition = automationCount(context);
    expect(afterTransition).toBeGreaterThan(before);
    expect(
      context.gains
        .slice(1, 4)
        .every((gain) => rampEvents(gain.gain).at(-1)?.value === 0),
    ).toBe(true);
    expect(
      context.gains
        .slice(4, 7)
        .every(
          (gain) =>
            rampEvents(gain.gain).at(-1)?.value ===
            PAD_GAIN_BUDGET.chordBody / 3,
        ),
    ).toBe(true);

    engine.render(target(F_MAJOR, false), 32);
    engine.render(target(F_MAJOR, true), 48);
    expect(automationCount(context)).toBe(afterTransition);
    expect(context.oscillators).toHaveLength(7);
  });

  it('releases shimmer without stopping its oscillator', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);

    context.currentTime = 15;
    engine.render(target(C_MAJOR, false, null), 16);
    const release = rampEvents(context.gains[7]!.gain).at(-1)!;
    expect(release).toMatchObject({ value: 0, time: 15.3 });
    expect(context.oscillators[6]?.stop).not.toHaveBeenCalled();
  });

  it('releases the chord body over the configured release', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);

    context.currentTime = 16;
    engine.render(target(null, true), 16);
    expect(
      context.gains.slice(1, 7).every((gain) => {
        const release = rampEvents(gain.gain).at(-1);
        return release?.value === 0 && release.time === 17.5;
      }),
    ).toBe(true);
    expect(
      context.oscillators
        .slice(0, 6)
        .every((oscillator) => oscillator.stop.mock.calls.length === 0),
    ).toBe(true);
  });

  it('preserves the gain ceiling when a chord returns during release', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);
    context.currentTime = 16;
    engine.render(target(F_MAJOR, true), 16);
    context.currentTime = 16.05;
    engine.render(target(null, true), 32);

    context.currentTime = 16.1;
    engine.render(target(C_MAJOR, true), 48);
    const inactive = context.gains
      .slice(1, 4)
      .map((gain) => rampEvents(gain.gain).at(-1));
    const active = context.gains
      .slice(4, 7)
      .map((gain) => rampEvents(gain.gain).at(-1));
    expect(
      inactive.every((event) => event?.value === 0 && event.time === 16.19),
    ).toBe(true);
    expect(
      active.every(
        (event) =>
          event?.value === PAD_GAIN_BUDGET.chordBody / 3 &&
          event.time === 16.19,
      ),
    ).toBe(true);
  });

  it('becomes unavailable without Web Audio and safely ignores commands', async () => {
    const engine = createPadEngine({ selectContext: () => null });
    await expect(engine.start()).resolves.toBeUndefined();
    expect(engine.state).toBe('unavailable');
    expect(() => engine.render(target(), 0)).not.toThrow();
    expect(() => engine.setChordMuted(true)).not.toThrow();
    await expect(engine.stop()).resolves.toBeUndefined();
    expect(() => engine.dispose()).not.toThrow();
    expect(engine.state).toBe('unavailable');
  });

  it('stops idempotently after both releases, disconnects, and closes once', async () => {
    vi.useFakeTimers();
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);
    context.currentTime = 20;

    const stopping = engine.stop();
    const repeated = engine.stop();
    expect(stopping).toBe(repeated);
    expect(engine.state).toBe('stopping');
    expect(
      context.oscillators.every(
        (oscillator) => oscillator.stop.mock.calls[0]?.[0] === 21.5,
      ),
    ).toBe(true);
    expect(rampEvents(context.gains[7]!.gain).at(-1)).toMatchObject({
      value: 0,
      time: 20 + PAD_ENVELOPE.shimmerReleaseMs / 1000,
    });
    await vi.advanceTimersByTimeAsync(PAD_ENVELOPE.chordReleaseMs);
    await stopping;
    expect(engine.state).toBe('idle');
    expect(context.close).toHaveBeenCalledOnce();
    expect(
      context.gains.every((gain) => gain.disconnect.mock.calls.length === 1),
    ).toBe(true);
    expect(
      context.oscillators.every(
        (oscillator) => oscillator.disconnect.mock.calls.length === 1,
      ),
    ).toBe(true);

    await engine.stop();
    engine.dispose();
    engine.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    expect(engine.state).toBe('unavailable');
  });

  it('disposes a running graph synchronously and closes its context once', async () => {
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.dispose();
    engine.dispose();
    expect(engine.state).toBe('unavailable');
    expect(
      context.oscillators.every(
        (oscillator) =>
          oscillator.stop.mock.calls.length === 1 &&
          oscillator.disconnect.mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(
      context.gains.every((gain) => gain.disconnect.mock.calls.length === 1),
    ).toBe(true);
    expect(context.close).toHaveBeenCalledOnce();
    await expect(engine.start()).resolves.toBeUndefined();
    expect(TestPadAudioContext.instances).toHaveLength(1);
  });

  it('disposes an in-progress Stop immediately without duplicate cleanup', async () => {
    vi.useFakeTimers();
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    await engine.start();
    const context = TestPadAudioContext.instances[0]!;
    engine.render(target(), 0);

    const stopping = engine.stop();
    engine.dispose();
    expect(engine.state).toBe('unavailable');
    expect(
      context.gains.every((gain) => gain.disconnect.mock.calls.length === 1),
    ).toBe(true);
    expect(context.close).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(PAD_ENVELOPE.chordReleaseMs);
    await stopping;
    expect(
      context.gains.every((gain) => gain.disconnect.mock.calls.length === 1),
    ).toBe(true);
    expect(context.close).toHaveBeenCalledOnce();
  });

  it('does not duplicate cleanup when dispose interrupts a rejected start', async () => {
    TestPadAudioContext.nextState = 'suspended';
    TestPadAudioContext.nextResumeMode = 'deferred';
    const engine = createPadEngine({ selectContext: selectTestPadContext });
    const starting = engine.start();
    const context = TestPadAudioContext.instances[0]!;

    engine.dispose();
    context.rejectResume();
    await expect(starting).resolves.toBeUndefined();
    expect(
      context.oscillators.every(
        (oscillator) =>
          oscillator.stop.mock.calls.length === 1 &&
          oscillator.disconnect.mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(context.close).toHaveBeenCalledOnce();
  });
});
