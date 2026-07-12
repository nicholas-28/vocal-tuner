# Audio Engine Requirements

## Input

The MVP analyzes one dominant pitched source, usually a single singing voice.

It is not intended for:

- chords;
- choirs;
- backing tracks;
- multiple simultaneous voices;
- noisy rooms with loud music.

## Pitch detector

The first implementation may use YIN, McLeod Pitch Method, or a maintained library implementing a comparable monophonic detector.

Selection criteria:

- acceptable mobile performance;
- confidence estimate;
- stable behavior for voice;
- manageable bundle size;
- clear license;
- no server dependency.

## Suggested processing stages

1. Read microphone samples.
2. Estimate signal level.
3. Ignore frames below a silence threshold.
4. Estimate fundamental frequency.
5. Reject low-confidence detections.
6. Convert frequency to fractional MIDI.
7. Suppress implausible octave jumps.
8. Apply short-window filtering.
9. Feed raw and filtered values into separate buffers.
10. Smooth only the rendered curve.

## Initial useful vocal range

A broad technical default may begin around:

```text
C2 to C6
```

The visible screen range should be narrower and user-adjustable.

## Latency trade-off

Lower notes require longer observation windows. The app must balance:

- responsiveness;
- frequency accuracy;
- low-note stability;
- visual smoothness.

Do not conceal excessive latency with heavy animation smoothing.

## Silence and consonants

Unpitched sounds must normally produce a gap.

Do not connect a pitch line through:

- silence;
- breaths;
- fricatives;
- low-confidence transitions.

## Octave errors

Possible heuristics:

- compare with recent stable pitch;
- prefer the candidate nearest recent history when confidence is similar;
- require stronger evidence for an octave jump;
- allow genuine leaps after a short transition window.

These rules must not prevent real octave changes.

## Reference tone

The initial reference sound may use:

- sine fundamental;
- quiet second harmonic;
- soft attack;
- short release;
- gain protection.

Avoid clicks at note start and stop.
