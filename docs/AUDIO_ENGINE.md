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

The reference sound uses a dedicated lazy Web Audio engine:

- one oscillator with a normalized range-aware `PeriodicWave` and an exact sine fallback;
- a 50 ms attack and 120 ms release;
- a 70 ms same-voice frequency transition;
- a protected master gain with 25% default UI volume and 0.16 maximum linear gain;
- a 30 ms master-volume ramp.

Its context, nodes, suspension recovery, errors, and disposal are independent from microphone analysis. The normal graph is oscillator to voice gain to master gain to destination. With explicit audio diagnostics enabled, one time-domain analyser is inserted on that same audible path immediately before destination; no microphone input enters it. Same-note activation toggles playback; a different note ramps the existing voice. Stop retains the context for restart, while unmount disposal stops/disconnects nodes and closes it. Details and interaction policy are in `REFERENCE_DRONE_SYNTHESIZER.md`.

On the first explicit playback gesture, the engine synchronously selects the standard or genuinely available prefixed constructor, creates the context/master graph, requests resume, connects a zero-gain voice, and starts its oscillator before yielding the trusted activation task. It awaits resume afterward, requires the actual state to be `running`, and for resumed contexts requires the rendering clock to advance before scheduling attack or publishing `playing`. This ordering repairs the iPhone Safari timing gap where source start previously occurred only after the resume promise.

`playing` is a confirmed control-graph state, not a requested state. A fulfilled resume is followed by explicit context-state and rendering-clock checks; only a rendering `running` context is accepted. Those checks still do not prove non-zero rendered samples or physical output. Suspended, interrupted, closed, unknown, stalled-clock, connection-failed, automation-failed, and oscillator-start-failed paths remain errors and clean partial voices. Production can temporarily expose read-only lifecycle diagnostics with `?audioDiagnostics=1`, including low-rate pre-destination RMS/peak, isolated Web Audio/native comparisons, explicit context recreation, and bounded microphone/audio-session transition snapshots; no mock pitch path is coupled to that flag.

Physical iOS 18.4.1 testing showed that `getUserMedia` can make an already digitally active drone physically audible, suggesting an OS audio-session or route transition rather than oscillator failure. The microphone and drone retain separate contexts and the microphone analysis graph never connects to destination. Diagnostic mode can explicitly try `navigator.audioSession.type` values and restore the prior value, but normal mode does not mutate this experimental API until physical A/B testing proves a safe policy that also preserves later microphone capture.

The harmonic profiles keep the selected frequency as the fundamental. Below MIDI 48 the raw relative amplitudes are `1 / 0.30 / 0.15 / 0.06`; MIDI 48–60 uses `1 / 0.24 / 0.10 / 0.04`; above MIDI 60 uses `1 / 0.12 / 0.04`. Each profile is divided by its amplitude sum before `PeriodicWave` construction with normalization disabled. The worst-case predicted peak therefore remains at or below the existing protected master gain of `0.16`; the default volume and slider mapping do not change.
