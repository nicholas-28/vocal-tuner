import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { midiNoteToFrequency } from '../music/noteFrequency';
import { frequencyToMusicalPitch } from '../music/pitchConversion';
import { useTargetPracticeSession } from './useTargetPracticeSession';

const pitchAtMidi = (midi: number) =>
  frequencyToMusicalPitch(midiNoteToFrequency(midi, 440))!;

describe('useTargetPracticeSession', () => {
  let currentNow = 0;
  const now = () => currentNow;

  beforeEach(() => {
    currentNow = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enforces target and microphone preconditions', () => {
    const { result, rerender } = renderHook(
      ({ selectedMidi, microphoneActive }) =>
        useTargetPracticeSession(
          {
            selectedMidi,
            microphoneActive,
            detectedPitch: null,
            continuityStatus: 'unvoiced',
            observationTimestampMs: null,
          },
          now,
        ),
      {
        initialProps: {
          selectedMidi: null as number | null,
          microphoneActive: false,
        },
      },
    );
    expect(result.current.controls.canStart).toBe(false);
    rerender({ selectedMidi: 69, microphoneActive: false });
    expect(result.current.controls.canStart).toBe(false);
    rerender({ selectedMidi: 69, microphoneActive: true });
    expect(result.current.controls.canStart).toBe(true);
  });

  it('uses raw target-relative observations and keeps the target locked', () => {
    const { result, rerender } = renderHook(
      ({ selectedMidi, pitch, status, timestamp }) =>
        useTargetPracticeSession(
          {
            selectedMidi,
            microphoneActive: true,
            detectedPitch: pitch,
            continuityStatus: status,
            observationTimestampMs: timestamp,
          },
          now,
        ),
      {
        initialProps: {
          selectedMidi: 69,
          pitch: null as ReturnType<typeof pitchAtMidi> | null,
          status: 'unvoiced' as 'voiced' | 'uncertain' | 'unvoiced',
          timestamp: null as number | null,
        },
      },
    );
    act(() => result.current.start());
    rerender({
      selectedMidi: 60,
      pitch: pitchAtMidi(69),
      status: 'voiced',
      timestamp: 100,
    });
    rerender({
      selectedMidi: 60,
      pitch: pitchAtMidi(69.2),
      status: 'voiced',
      timestamp: 167,
    });
    expect(result.current.state).toMatchObject({
      status: 'running',
      session: {
        target: { midiNote: 69, label: 'A4' },
        measurableVoicedMs: 67,
        onTargetMs: 67,
        currentObservation: {
          kind: 'off-target',
        },
      },
    });
    if (result.current.state.status === 'running')
      expect(
        result.current.state.session.currentObservation.kind === 'off-target'
          ? result.current.state.session.currentObservation.targetRelativeCents
          : null,
      ).toBeCloseTo(20, 8);
    expect(result.current.selectedTarget?.midiNote).toBe(60);
    expect(result.current.targetSelectionLocked).toBe(true);
  });

  it('accounts uncertainty and no pitch separately from measured voice', () => {
    const { result, rerender } = renderHook(
      ({ status, timestamp }) =>
        useTargetPracticeSession(
          {
            selectedMidi: 69,
            microphoneActive: true,
            detectedPitch: pitchAtMidi(69),
            continuityStatus: status,
            observationTimestampMs: timestamp,
          },
          now,
        ),
      {
        initialProps: {
          status: 'voiced' as 'voiced' | 'uncertain' | 'unvoiced',
          timestamp: null as number | null,
        },
      },
    );
    act(() => result.current.start());
    rerender({ status: 'voiced', timestamp: 100 });
    rerender({ status: 'uncertain', timestamp: 167 });
    rerender({ status: 'unvoiced', timestamp: 234 });
    rerender({ status: 'voiced', timestamp: 301 });
    expect(result.current.state).toMatchObject({
      session: {
        measurableVoicedMs: 67,
        onTargetMs: 67,
        uncertainMs: 67,
        noPitchMs: 67,
      },
    });
  });

  it('auto-pauses on microphone Stop and requires explicit resume', () => {
    const { result, rerender } = renderHook(
      ({ microphoneActive }) =>
        useTargetPracticeSession(
          {
            selectedMidi: 69,
            microphoneActive,
            detectedPitch: null,
            continuityStatus: 'unvoiced',
            observationTimestampMs: null,
          },
          now,
        ),
      { initialProps: { microphoneActive: true } },
    );
    act(() => result.current.start());
    currentNow = 200;
    rerender({ microphoneActive: false });
    expect(result.current.state).toMatchObject({
      status: 'paused',
      paused: { reason: 'microphone-stopped' },
    });
    currentNow = 300;
    rerender({ microphoneActive: true });
    expect(result.current.state.status).toBe('paused');
    act(() => result.current.resume());
    expect(result.current.state).toMatchObject({
      status: 'running',
      session: {
        lastProcessedAtMs: 300,
        currentObservation: { kind: 'unobserved' },
      },
    });
  });

  it('uses one display-only timer and cleans it through lifecycle changes', () => {
    const { result, unmount } = renderHook(() =>
      useTargetPracticeSession(
        {
          selectedMidi: 69,
          microphoneActive: true,
          detectedPitch: null,
          continuityStatus: 'unvoiced',
          observationTimestampMs: null,
        },
        now,
      ),
    );
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.start());
    expect(vi.getTimerCount()).toBe(1);
    currentNow = 250;
    act(() => vi.advanceTimersByTime(250));
    expect(result.current.displaySession).toMatchObject({
      activeElapsedMs: 250,
      measurableVoicedMs: 0,
      unobservedMs: 250,
    });
    act(() => result.current.pause());
    expect(vi.getTimerCount()).toBe(0);
    currentNow = 500;
    act(() => result.current.resume());
    expect(vi.getTimerCount()).toBe(1);
    act(() => result.current.finish());
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.reset());
    expect(vi.getTimerCount()).toBe(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
