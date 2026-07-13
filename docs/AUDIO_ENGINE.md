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

The initial reference sound uses a dedicated lazy Web Audio engine:

- one sine oscillator and no samples;
- a 50 ms attack and 120 ms release;
- a 70 ms same-voice frequency transition;
- a protected master gain with 25% default UI volume and 0.16 maximum linear gain;
- a 30 ms master-volume ramp.

Its context, nodes, suspension recovery, errors, and disposal are independent from microphone analysis. The graph is oscillator to voice gain to master gain to destination. Same-note activation toggles playback; a different note ramps the existing voice. Stop retains the context for restart, while unmount disposal stops/disconnects nodes and closes it. Details and interaction policy are in `REFERENCE_DRONE_SYNTHESIZER.md`.

`playing` is a confirmed graph state, not a requested state. A fulfilled resume is followed by an explicit context-state check; only `running` is accepted. Suspended, interrupted, closed, connection-failed, automation-failed, and oscillator-start-failed paths remain errors and clean partial voices. Destination and voice connections precede oscillator start, while the attack ramp follows successful start. Development transition diagnostics make context, graph, frequency, and effective gain auditable without audio-rate updates.
