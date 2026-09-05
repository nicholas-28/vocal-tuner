# Audio Engine Requirements

## Input

The MVP analyzes one dominant pitched source, usually a single singing voice.

It is not intended for:

- chords;
- choirs;
- backing tracks;
- multiple simultaneous voices;
- noisy rooms with loud music.

## Microphone analysis lifecycle

`useMicrophone` owns capture and the analysis handle. A synchronous command lock and generation token are acquired before Start awaits anything. Reentrant Starts are ignored while requesting, active, or stopping. Stop (including Cancel during acquisition), failure, and unmount invalidate the generation before releasing resources. Late stream resolutions are stopped immediately; late rejections, detections, and error callbacks cannot change a newer session. Browser permission requests cannot be aborted by the app: cancellation revokes ownership, and any subsequently granted tracks are stopped without creating an analysis graph.

`startPitchAnalysis` owns its dedicated input AudioContext, source, analyser, scratch buffers, and RAF. Its only connection is source → analyser, never to the destination. Construction failure disconnects everything already created and requests context closure. Disposal is idempotent, removes the context listener, cancels the RAF, drops sample buffers, disconnects both nodes, and closes the context. The hook removes track listeners and stops every acquired track on Stop, failure, or unmount. Cleanup attempts continue if one release operation throws. Retry waits for an owned monitor's pending disposal; a rejected disposal on Stop reports an error and unknown context state instead of claiming closure. Browser close/track-stop failures cannot be forced to succeed by application code.

### Trustworthy observations

A suspended analyser can retain its previous samples. Reading those samples repeatedly and attaching new wall-clock timestamps manufactured fresh pitch evidence, including false practice evidence. Publication now requires a running context with a finite rendering clock that has advanced since the previous analysis, plus input tracks that have not ended or muted. Stable pitch and identical waveform values are legitimate; neither is used as a freshness heuristic.

The existing RAF checks context state and the 30 Hz analysis gate. The initial context may be suspended while its one resume request completes; no observation is published until rendering advances. Startup without progress has a 1000 ms allowance. After progress begins, a repeated clock suppresses analysis/publication immediately, and 250 ms without progress ends the session. The allowance tolerates clock quantization and short scheduling jitter; it never republishes held samples. A long RAF scheduling gap does not itself fail if the audio clock progressed. Deadlines are evaluated on RAF callbacks, so they may be delayed while the browser suspends JavaScript. Context state events still invalidate the session when delivered.

After the context has run, suspension, interruption, closure, or an unknown state immediately ends analysis. Non-finite/backward clock values, analyser exceptions, and resume rejection also fail. Track end/mute signals invalidate capture independently. These are lifecycle failures, not ordinary detector rejections. Ordinary fresh silence and low-confidence frames keep the existing raw detection and continuity/grace semantics. YIN thresholds, pitch conversion, and practice scoring rules are unchanged.

### Failure and recovery

The hook resets input level, raw/live pitch, continuity, and history ingestion synchronously, without waiting for asynchronous context closure. Existing App wiring removes target guidance and pauses practice when the microphone leaves active state; queued old observations cannot extend history or practice metrics. Retained history remains visible as inactive history. Analysis errors remain visible in raw diagnostics after reset.

Recovery requires explicit Start, a new stream/analysis graph, and fresh rendering evidence. The microphone remains in the requesting state until its first fresh observation (including silence). Cancel is available during this wait. An existing practice session stays paused until the user resumes it. There is no automatic resume loop or browser-name sniffing, and reference-drone ownership is unchanged.

The freshness checks add only context/clock reads and small track checks to existing scheduled work. Audio stays in local transient buffers; this policy adds no recording, persistence, sample logging, upload, backend, analytics, dependency, or independent polling loop. These browser signals cannot prove physical microphone freshness if a device/driver supplies stale audio while reporting a live track and progressing context. Physical iPhone Safari interruption/retry testing remains necessary, including app switching, screen locking, and input-route changes.

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

Physical testing on one iPhone (clean tree, hardware mute switch in ring/sound-enabled position, no microphone started) found the reference drone audible from a plain, unmodified Web Audio graph. iOS Safari's Web Audio implementation respects the hardware mute switch; `HTMLAudioElement` does not. This is the actual cause of the original silent-drone report — see `docs/DECISIONS.md` ADR-028. It also explains the earlier observation that `getUserMedia` correlated with audibility: starting capture moves the page's audio session into a category that Apple documents as exempt from the mute switch, independent of any application-level graph or route dependency between the microphone and the drone.

`navigator.audioSession.type = 'playback'` was tried as a production repair and rejected: it did not make output audible on device and it destabilized interaction/lifecycle presentation. That result is now understood as expected, since the actual variable — the hardware switch — was outside the application either way. Normal reference activation performs no AudioSession mutation and never calls `getUserMedia`. The prepare-playback, recreate-context, and direct-output sequence remains in the diagnostics panel as a documented negative result, not a working mechanism, and is a deletion candidate in a future cleanup.

`ReferenceDroneSnapshot` separates `pressedMidi`/`selectedMidi` (keyboard-owned selection state, see `REFERENCE_DRONE_SYNTHESIZER.md`) from `pendingMidi` — a start or note-change that has been requested but not yet confirmed running — and `activeMidi`, which is confirmed sounding only. `recoveryState` (`'ready' | 'needs-reactivation'`) tracks whether the selected note needs an explicit gesture to resume after a `context-interrupted` error; it replaces overloaded reuse of `status === 'error'` for that purpose. `activeMidi` is not published until the graph is confirmed. Rapid activations use operation generations so only the newest note can commit. Hidden/pagehide cleans and invalidates output; a foreground event cannot start it, and the next explicit gesture replaces the invalidated context.

The harmonic profiles keep the selected frequency as the fundamental. Below MIDI 48 the raw relative amplitudes are `1 / 0.30 / 0.15 / 0.06`; MIDI 48–60 uses `1 / 0.24 / 0.10 / 0.04`; above MIDI 60 uses `1 / 0.12 / 0.04`. Each profile is divided by its amplitude sum before `PeriodicWave` construction with normalization disabled. The worst-case predicted peak therefore remains at or below the existing protected master gain of `0.16`; the default volume and slider mapping do not change.
