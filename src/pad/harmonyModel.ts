import { DEFAULT_KEY, DEFAULT_VOICING_FLOOR_CENTS } from './padConfig';
import type {
  Chord,
  ChordQuality,
  HarmonyModel,
  HarmonyModelOptions,
} from './types';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;
const QUALITIES: readonly ChordQuality[] = [
  'major',
  'minor',
  'minor',
  'major',
  'major',
  'minor',
  'diminished',
];
const pc = (semitone: number) => ((semitone % 12) + 12) % 12;

/** Quantization/dwell belong to the interpreter; this model sees accepted classes only. */
export function createHarmonyModel({
  key = DEFAULT_KEY,
  voicingFloorCents = DEFAULT_VOICING_FLOOR_CENTS,
}: HarmonyModelOptions = {}): HarmonyModel {
  if (
    !Number.isInteger(key.tonicPitchClass) ||
    key.tonicPitchClass < 0 ||
    key.tonicPitchClass > 11 ||
    key.mode !== 'major' ||
    !Number.isFinite(voicingFloorCents)
  )
    throw new RangeError(
      'Harmony requires a major key and a finite voicing floor.',
    );
  const triads = MAJOR_SCALE.map((offset, index) => ({
    id: `${key.tonicPitchClass}:major:${index + 1}`,
    degree: index + 1,
    rootPitchClass: pc(key.tonicPitchClass + offset),
    quality: QUALITIES[index],
    pitchClasses: [0, 2, 4].map((step) =>
      pc(key.tonicPitchClass + MAJOR_SCALE[(index + step) % 7]),
    ),
  }));
  let chord: Chord | null = null;

  return {
    next(frame) {
      const previous = chord;
      if (frame.phase === 'idle' || frame.phase === 'releasing') {
        chord = null;
      } else if (
        frame.phase === 'voiced' &&
        frame.pitchClass !== null &&
        Number.isInteger(frame.pitchClass) &&
        frame.pitchClass >= 0 &&
        frame.pitchClass < 12 &&
        !chord?.voiceCents.some((cents) => pc(cents / 100) === frame.pitchClass)
      ) {
        let bestCost = Infinity;
        // All optimal voices fit below max(previous) + an octave: a higher
        // top voice can be lowered an octave to strictly reduce total motion.
        const ceiling = chord
          ? chord.voiceCents[2] + 1200
          : voicingFloorCents + 1200;
        for (const triad of triads) {
          if (!triad.pitchClasses.includes(frame.pitchClass)) continue;
          const notes: number[] = [];
          for (
            let note = Math.ceil(voicingFloorCents / 100);
            note * 100 <= ceiling;
            note++
          ) {
            if (triad.pitchClasses.includes(pc(note))) notes.push(note * 100);
          }
          for (let a = 0; a < notes.length; a++) {
            for (let b = a + 1; b < notes.length; b++) {
              if (pc(notes[a] / 100) === pc(notes[b] / 100)) continue;
              for (let c = b + 1; c < notes.length; c++) {
                if (
                  pc(notes[c] / 100) === pc(notes[a] / 100) ||
                  pc(notes[c] / 100) === pc(notes[b] / 100)
                )
                  continue;
                const voices = [notes[a], notes[b], notes[c]] as const;
                const cost = previous
                  ? voices.reduce(
                      (sum, value, i) =>
                        sum + Math.abs(value - previous.voiceCents[i]),
                      0,
                    )
                  : 0;
                // Enumeration breaks ties by scale degree, then ascending
                // lexicographic voicing. Initial harmony uses the same order.
                if (cost < bestCost) {
                  bestCost = cost;
                  chord = {
                    id: triad.id,
                    degree: triad.degree,
                    rootPitchClass: triad.rootPitchClass,
                    quality: triad.quality,
                    voiceCents: voices,
                  };
                }
              }
            }
          }
        }
      }
      return { chord, changed: previous?.id !== chord?.id };
    },
    reset() {
      chord = null;
    },
  };
}
