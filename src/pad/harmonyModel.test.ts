import { describe, expect, it } from 'vitest';
import { createHarmonyModel } from './harmonyModel';
import { DEFAULT_VOICING_FLOOR_CENTS } from './padConfig';
import { voicedFrame } from './test/pitchHarness';
import type { Chord } from './types';

const majorTriads = [
  [0, 4, 7],
  [2, 5, 9],
  [4, 7, 11],
  [5, 9, 0],
  [7, 11, 2],
  [9, 0, 4],
  [11, 2, 5],
];

// Independent exhaustive oracle with a deliberately wider register than production.
function minimumMotion(previous: Chord, pitchClass: number, floor: number) {
  let minimum = Infinity;
  for (const pcs of majorTriads.filter((triad) => triad.includes(pitchClass))) {
    for (
      let low = Math.ceil(floor / 100);
      low <= previous.voiceCents[2] / 100 + 24;
      low++
    ) {
      for (let mid = low + 1; mid <= previous.voiceCents[2] / 100 + 24; mid++) {
        for (
          let high = mid + 1;
          high <= previous.voiceCents[2] / 100 + 24;
          high++
        ) {
          const notes = [low, mid, high];
          const classes = new Set(notes.map((note) => ((note % 12) + 12) % 12));
          if (classes.size !== 3 || !pcs.every((pc) => classes.has(pc)))
            continue;
          const cost = notes.reduce(
            (sum, note, i) =>
              sum + Math.abs(note * 100 - previous.voiceCents[i]),
            0,
          );
          minimum = Math.min(minimum, cost);
        }
      }
    }
  }
  return minimum;
}

describe('major-key harmony model', () => {
  it('keeps chord identity and voicing when the accepted class is already contained', () => {
    const model = createHarmonyModel();
    const initial = model.next(voicedFrame(0));
    expect(initial).toMatchObject({
      changed: true,
      chord: { degree: 1, quality: 'major', voiceCents: [4800, 5200, 5500] },
    });
    for (const pc of [4, 7, 0, 7]) {
      const next = model.next(voicedFrame(pc));
      expect(next.chord).toBe(initial.chord);
      expect(next.changed).toBe(false);
    }
  });

  it.each([1, 3, 6, 8, 10])(
    'holds on chromatic class %s, including before the first chord',
    (pc) => {
      const model = createHarmonyModel();
      expect(model.next(voicedFrame(pc))).toEqual({
        chord: null,
        changed: false,
      });
      const initial = model.next(voicedFrame(0));
      expect(model.next(voicedFrame(pc))).toEqual({
        chord: initial.chord,
        changed: false,
      });
    },
  );

  it('selects deterministic compatible triads with minimum-motion three-voice voicings', () => {
    const sequence = [0, 2, 4, 5, 7, 9, 11, 0, 5, 2, 7];
    const model = createHarmonyModel();
    const replay = createHarmonyModel();
    let previous: Chord | null = null;
    const degrees: number[] = [];
    for (const pc of sequence) {
      const state = model.next(voicedFrame(pc));
      expect(state).toEqual(replay.next(voicedFrame(pc)));
      const chord = state.chord!;
      expect(chord.voiceCents).toHaveLength(3);
      expect(
        chord.voiceCents.every((v) => v >= DEFAULT_VOICING_FLOOR_CENTS),
      ).toBe(true);
      expect([...chord.voiceCents].sort((a, b) => a - b)).toEqual(
        chord.voiceCents,
      );
      const pcs = chord.voiceCents.map((v) => (v / 100) % 12);
      expect(pcs).toContain(pc);
      expect(new Set(pcs)).toEqual(new Set(majorTriads[chord.degree - 1]));
      if (previous && state.changed) {
        const cost = chord.voiceCents.reduce(
          (sum, v, i) => sum + Math.abs(v - previous!.voiceCents[i]),
          0,
        );
        expect(cost).toBe(
          minimumMotion(previous, pc, DEFAULT_VOICING_FLOOR_CENTS),
        );
      }
      expect(state.changed).toBe(previous?.id !== chord.id);
      degrees.push(chord.degree);
      previous = chord;
    }
    expect(degrees).toEqual([1, 2, 6, 4, 1, 6, 7, 4, 4, 2, 5]);
  });

  it('breaks equal-motion ties by degree deterministically', () => {
    const model = createHarmonyModel();
    for (const pc of [0, 11, 4]) model.next(voicedFrame(pc));
    // E G B -> F A C and E G B -> D F B both cost four semitones.
    // IV precedes vii; all voices are at or above the C3 floor.
    const next = model.next(voicedFrame(5));
    expect(next.chord).toMatchObject({
      degree: 4,
      voiceCents: [5300, 5700, 6000],
    });
  });

  it('transposes the fixed key and respects an injected fractional voicing floor', () => {
    const model = createHarmonyModel({
      key: { tonicPitchClass: 2, mode: 'major' },
      voicingFloorCents: 4910,
    });
    const first = model.next(voicedFrame(2)).chord!;
    expect(first).toMatchObject({
      degree: 1,
      rootPitchClass: 2,
      quality: 'major',
      voiceCents: [5000, 5400, 5700],
    });
    expect(model.next(voicedFrame(0))).toEqual({
      chord: first,
      changed: false,
    });
    expect(model.next(voicedFrame(6))).toEqual({
      chord: first,
      changed: false,
    });
  });

  it('holds through grace, clears once on release or idle, and resets explicitly', () => {
    const model = createHarmonyModel();
    const initial = model.next(voicedFrame(0)).chord;
    expect(
      model.next({ ...voicedFrame(2), phase: 'grace', evidence: 'none' }),
    ).toEqual({ chord: initial, changed: false });
    const release = {
      ...voicedFrame(0),
      phase: 'releasing' as const,
      pitchClass: null,
    };
    expect(model.next(release)).toEqual({ chord: null, changed: true });
    expect(model.next(release)).toEqual({ chord: null, changed: false });
    model.next(voicedFrame(2));
    expect(model.next({ ...release, phase: 'idle' })).toEqual({
      chord: null,
      changed: true,
    });
    model.next(voicedFrame(2));
    model.reset();
    expect(model.next(voicedFrame(0))).toMatchObject({
      changed: true,
      chord: { degree: 1 },
    });
  });

  it('ignores missing or malformed pitch classes', () => {
    const model = createHarmonyModel();
    const initial = model.next(voicedFrame(0)).chord;
    for (const pc of [null, NaN, Infinity, -1, 12, 2.5]) {
      expect(model.next({ ...voicedFrame(0), pitchClass: pc })).toEqual({
        chord: initial,
        changed: false,
      });
    }
  });
});
