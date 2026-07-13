import { describe, expect, it } from 'vitest';
import type {
  PracticeObservation,
  PracticeSessionState,
  PracticeTarget,
} from '../types/practiceSession';
import {
  calculateOnTargetShare,
  createIdlePracticeSession,
  createPracticeObservation,
  derivePracticeControls,
  finishPracticeSession,
  pausePracticeSession,
  practiceMetricsAreCoherent,
  previewPracticeSession,
  processPracticeObservation,
  resetPracticeSession,
  resumePracticeSession,
  startPracticeSession,
} from './practiceSession';

const A4: PracticeTarget = {
  midiNote: 69,
  label: 'A4',
  frequencyHz: 440,
};

function start(timestampMs = 0): PracticeSessionState {
  return startPracticeSession(createIdlePracticeSession(), A4, timestampMs, 1);
}

function observe(
  state: PracticeSessionState,
  kind: PracticeObservation,
  timestampMs: number,
) {
  return processPracticeObservation(state, kind, timestampMs);
}

describe('practice session state machine', () => {
  it('starts idle and locks an immutable target into a fresh session', () => {
    const idle = createIdlePracticeSession();
    expect(idle).toEqual({ status: 'idle' });
    const running = startPracticeSession(idle, A4, 100, 7);
    expect(running).toMatchObject({
      status: 'running',
      session: {
        sessionId: 7,
        target: A4,
        startedAtMs: 100,
        activeElapsedMs: 0,
        measurableVoicedMs: 0,
        currentObservation: { kind: 'unobserved' },
      },
    });
    expect(running).not.toBe(idle);
    expect(startPracticeSession(running, { ...A4, midiNote: 60 }, 200, 8)).toBe(
      running,
    );
  });

  it('rejects invalid targets, timestamps, IDs, and lifecycle transitions', () => {
    const idle = createIdlePracticeSession();
    expect(startPracticeSession(idle, { ...A4, frequencyHz: 0 }, 0, 1)).toBe(
      idle,
    );
    expect(startPracticeSession(idle, A4, Number.NaN, 1)).toBe(idle);
    expect(startPracticeSession(idle, A4, 0, 0)).toBe(idle);
    expect(pausePracticeSession(idle, 1)).toBe(idle);
    expect(resumePracticeSession(idle, 1, true)).toBe(idle);
    expect(finishPracticeSession(idle, 1)).toBe(idle);
    expect(resetPracticeSession(idle)).toBe(idle);
  });

  it('attributes intervals to the previous observation without retroactive credit', () => {
    let state = start();
    state = observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 100);
    expect(state).toMatchObject({
      session: { activeElapsedMs: 100, unobservedMs: 100, onTargetMs: 0 },
    });
    state = observe(
      state,
      { kind: 'off-target', targetRelativeCents: 20 },
      167,
    );
    expect(state).toMatchObject({
      session: {
        activeElapsedMs: 167,
        measurableVoicedMs: 67,
        onTargetMs: 67,
        offTargetMs: 0,
      },
    });
    state = observe(state, { kind: 'uncertain' }, 234);
    state = observe(state, { kind: 'no-pitch' }, 301);
    state = finishPracticeSession(state, 368);
    expect(state).toMatchObject({
      status: 'completed',
      summary: {
        activeElapsedMs: 368,
        measurableVoicedMs: 134,
        onTargetMs: 67,
        offTargetMs: 67,
        uncertainMs: 67,
        noPitchMs: 67,
        unobservedMs: 100,
        onTargetShare: 0.5,
      },
    });
    if (state.status === 'completed')
      expect(practiceMetricsAreCoherent(state.summary)).toBe(true);
  });

  it('caps evidence at 250 ms and makes scheduler excess unobserved', () => {
    let state = start();
    state = observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 1);
    state = observe(
      state,
      { kind: 'off-target', targetRelativeCents: 20 },
      1001,
    );
    expect(state).toMatchObject({
      session: {
        activeElapsedMs: 1001,
        measurableVoicedMs: 250,
        onTargetMs: 250,
        unobservedMs: 751,
      },
    });
    if (state.status === 'running')
      expect(practiceMetricsAreCoherent(state.session)).toBe(true);
  });

  it('accounts an interval exactly at the evidence maximum', () => {
    let state = start();
    state = observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 10);
    state = observe(
      state,
      { kind: 'off-target', targetRelativeCents: 20 },
      260,
    );
    expect(state).toMatchObject({
      session: { onTargetMs: 250, unobservedMs: 10 },
    });
  });

  it('rejects duplicate, backward, invalid, and non-finite observations', () => {
    let state = start();
    state = observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 100);
    expect(
      observe(state, { kind: 'off-target', targetRelativeCents: 20 }, 100),
    ).toBe(state);
    expect(
      observe(state, { kind: 'off-target', targetRelativeCents: 20 }, 99),
    ).toBe(state);
    expect(
      observe(
        state,
        { kind: 'off-target', targetRelativeCents: Number.NaN },
        110,
      ),
    ).toBe(state);
  });

  it('pauses, ignores observations, resumes from an unobserved baseline, and counts pauses', () => {
    let state = start();
    state = observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 100);
    state = pausePracticeSession(state, 200);
    expect(state).toMatchObject({
      status: 'paused',
      paused: {
        session: { activeElapsedMs: 200, onTargetMs: 100, pauseCount: 1 },
      },
    });
    expect(
      observe(state, { kind: 'off-target', targetRelativeCents: 50 }, 500),
    ).toBe(state);
    expect(resumePracticeSession(state, 500, false)).toBe(state);
    state = resumePracticeSession(state, 500, true);
    state = observe(
      state,
      { kind: 'off-target', targetRelativeCents: 50 },
      600,
    );
    state = finishPracticeSession(state, 700);
    expect(state).toMatchObject({
      summary: {
        wallElapsedMs: 700,
        activeElapsedMs: 400,
        onTargetMs: 100,
        offTargetMs: 100,
        unobservedMs: 200,
        pauseCount: 1,
      },
    });
  });

  it('finishes while paused without adding paused time and blocks later updates', () => {
    let state = pausePracticeSession(start(), 100);
    state = finishPracticeSession(state, 1000);
    expect(state).toMatchObject({
      status: 'completed',
      summary: { wallElapsedMs: 1000, activeElapsedMs: 100, pauseCount: 1 },
    });
    expect(
      observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 1100),
    ).toBe(state);
    if (state.status === 'completed') {
      expect(Object.isFrozen(state.summary)).toBe(true);
      expect(Object.isFrozen(state.summary.target)).toBe(true);
    }
  });

  it('resets only a completed session and allows a fresh target afterward', () => {
    const completed = finishPracticeSession(start(), 100);
    const idle = resetPracticeSession(completed);
    const c4 = { midiNote: 60, label: 'C4', frequencyHz: 261.625565 };
    expect(startPracticeSession(idle, c4, 200, 2)).toMatchObject({
      status: 'running',
      session: { sessionId: 2, target: c4, activeElapsedMs: 0 },
    });
  });

  it('previews elapsed accounting without mutating authoritative state', () => {
    let state = start();
    state = observe(state, { kind: 'on-target', targetRelativeCents: 0 }, 10);
    const preview = previewPracticeSession(state, 110);
    expect(preview).toMatchObject({ activeElapsedMs: 110, onTargetMs: 100 });
    expect(state).toMatchObject({
      session: { activeElapsedMs: 10, onTargetMs: 0 },
    });
  });
});

describe('practice tolerance, share, and controls', () => {
  it.each([
    [-10, 'on-target'],
    [10, 'on-target'],
    [-10.001, 'off-target'],
    [10.001, 'off-target'],
  ] as const)('classifies %s raw cents as %s', (cents, kind) => {
    expect(createPracticeObservation(cents)).toEqual({
      kind,
      targetRelativeCents: cents,
    });
  });

  it('uses measurable voice as the only share denominator', () => {
    expect(calculateOnTargetShare(6000, 10_000)).toBe(0.6);
    expect(calculateOnTargetShare(0, 0)).toBeNull();
    expect(calculateOnTargetShare(Number.NaN, 10)).toBeNull();
    expect(calculateOnTargetShare(20, 10)).toBe(1);
  });

  it('derives preconditions independently from drone and history state', () => {
    const idle = createIdlePracticeSession();
    expect(derivePracticeControls(idle, false, false).canStart).toBe(false);
    expect(derivePracticeControls(idle, true, false).canStart).toBe(false);
    expect(derivePracticeControls(idle, true, true).canStart).toBe(true);
    const running = start();
    expect(derivePracticeControls(running, true, true)).toMatchObject({
      canStart: false,
      canPause: true,
      canFinish: true,
    });
  });
});
