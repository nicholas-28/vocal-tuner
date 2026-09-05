# Reference Drone Synthesizer

Issue 012 turns the vertical reference keyboard into a continuous, monophonic pitch-reference drone. It is a listening aid, not a sampled instrument: one selected note can sound independently of microphone capture and pitch history.

## Interaction model

A completed pointer or keyboard activation selects a note and starts it. Releasing the key clears only transient pressed feedback; the drone continues. Activating the sounding note again stops audio while retaining the selection. Activating a different note keeps one voice and ramps its oscillator frequency instead of starting overlapping oscillators.

The presentation states are intentionally separate:

- `pressedMidi` describes a pointer or Enter/Space press in progress;
- `selectedMidi` describes the user's persistent reference choice;
- `pendingMidi` describes an unconfirmed start or change;
- `activeMidi` describes only a confirmed sounding drone;
- `recoveryState` (`'ready' | 'needs-reactivation'`) and error state describe a selected note that is not sounding, and whether it needs an explicit gesture to resume.

The explicit **Start selected** control restarts a stopped selection, **Stop reference drone** silences the voice, and the volume slider controls future and current playback. Pointer cancellation never activates a note. Enter/Space activate on keyup; their keydown and keyup default actions are canceled to prevent native compatibility clicks, and auto-repeat does not add activations. There is no elapsed-time click suppression: subsequent pointer/touch, assistive, and programmatic clicks remain independent commands, even on the same key.

## Web Audio ownership and graph

The reference engine owns a dedicated, lazily created `AudioContext`. It neither reuses nor changes the microphone analysis context. Rendering the page, selecting a range, or moving the volume slider does not create an audio context; the first user playback action does.

The graph is:

```text
PeriodicWave OscillatorNode -> per-voice GainNode -> master GainNode -> destination
```

With the explicit `audioDiagnostics=1` mode enabled, one `AnalyserNode` is inserted between master and destination on the actual audible path. It uses a reusable 1,024-sample time-domain buffer at 8 Hz while output is expected. Three consecutive measurements above or below an RMS-or-peak threshold of `0.0001` classify the path as digitally active or silent. This diagnostic node receives no microphone input, makes no recording, changes no gain, and is disconnected with its context.

The oscillator uses a locally constructed additive `PeriodicWave`; browsers that cannot construct or apply it fall back to the exact sine fundamental. There are no samples or licensed assets. The engine keeps at most one oscillator voice. It retains the context and master gain after Stop for efficient restart, and closes them only on disposal.

The timbre is range-aware and preserves the selected frequency as harmonic 1:

- below MIDI 48: relative partials `1.00, 0.30, 0.15, 0.06`;
- MIDI 48–60 inclusive: `1.00, 0.24, 0.10, 0.04`;
- above MIDI 60: `1.00, 0.12, 0.04`.

Every partial frequency is an exact integer multiple of the fundamental. Coefficients are divided by their absolute sum, so the conservative worst-case waveform peak is at most `1.0` before the voice/master gains. At 100% UI volume the predicted peak is therefore at most `0.32`, with no distortion, noise, subharmonics, fundamental shift, or OS-volume manipulation. A note transition ramps the one oscillator's fundamental and updates its periodic wave, so every partial follows the same pitch transition while target guidance remains tied to selected MIDI.

Issue 012 manual testing exposed a false-positive playback defect: the first engine treated a fulfilled `resume()` promise as sufficient and published `playing` without checking that the context had actually reached `running`. A suspended or interrupted context could therefore own a valid-looking but silent graph. The original mocks concealed this by always changing state to `running`.

Issue 018.1 found a remaining physical-iPhone timing gap: the earlier repair created and resumed the context from `click`, but awaited `resume()` before it created or started the oscillator. WebKit can reject rendering begun asynchronously after the gesture. The hotfix construction order is deterministic and transactional:

1. synchronously create the context and master gain from the explicit activation;
2. set the protected master gain and connect it once to destination;
3. synchronously request resume when suspended or interrupted;
4. create oscillator and voice gain, set voice gain to zero, and assign frequency;
5. connect oscillator to voice gain and voice gain to master gain;
6. start the zero-gain oscillator before yielding the activation task;
7. await resume, inspect the actual state, and confirm the rendering clock advances;
8. schedule attack to voice gain `1.0` only after readiness succeeds;
9. confirm the current context/voice generations and every graph invariant;
10. only then publish `playing`.

Any construction, connection, automation, or start failure disconnects all partially created voice nodes. Destination construction failure also disconnects the master output and closes that failed context.

## Envelopes, transition, and volume

The voice uses a 50 ms attack and 120 ms release to reduce clicks. A different-note activation ramps oscillator frequency over 70 ms. Master-volume changes use a 30 ms time constant with `setTargetAtTime` (or a 30 ms linear fallback); this smoothing is separate from the exact-zero Stop release. All automation begins from the current parameter value before scheduling its target.

The UI volume is normalized from 0–100%. It maps linearly to a deliberately conservative maximum master gain of `0.32`; the default 25% setting therefore produces `0.08` master gain. Per-voice gain remains responsible for the attack and release envelope. 100% means maximum safe app reference level, not full digital scale. The cap increased from 0.16 to 0.32 (+6.02 dB); 25% remains the default slider setting. The absolute-sum bound leaves at least 9.8 dB peak headroom, including pure-sine fallback. Sampled low/middle/high profile output peaks at maximum are approximately 0.237/0.242/0.275; diagnostic analyser peaks should remain below the conservative 0.32 bound. Analyser measurements depend on note, phase, and buffer, not a fixed expected RMS.

Absolute-sum normalization attenuates the low-profile fundamental to about 0.662 (middle 0.725, high 0.862). It is conservative compared with the actual waveform peaks but remains unchanged to preserve timbre and a robust bound even if high partials are removed by band-limiting. More software level cannot overcome the phone speaker's low-frequency response. Capture-related loudness changes may also reflect platform session/routing behavior; code inspection and the mocked app-start regression show no drone gain/context/connection mutation when microphone capture starts. No capture coupling or audio-session workaround is introduced.

The voice envelope target is exactly `1.0`, so the steady-state effective gain is the protected master gain: `0.08` by default and `0.32` at 100%. A 0% setting intentionally produces an effective gain of zero while the engine may remain logically playing. Volume automation uses `setTargetAtTime` when available and a linear fallback otherwise. Attack, release, and note transitions use linear ramps with safe `setValueAtTime` fallbacks. `cancelAndHoldAtTime` is capability-detected and falls back to cancel-plus-current-value scheduling.

## Range, microphone, and history independence

Changing the visible graph range releases transient key pressure and clamps keyboard focus when necessary, but preserves the selected note and any active drone even when that MIDI note is no longer rendered. A status message identifies that the sounding reference is outside the visible range. Returning to a containing range restores the selected and sounding key indicators.

Reference playback never requests microphone permission and does not start, stop, pause, clear, record, or transform microphone or history state. Conversely, microphone Start/Stop and history Pause/Resume/Clear do not change the drone. Microphone capture is not required for drone audibility. An earlier investigation observed that starting capture could make a previously silent drone audible and read that as a platform-level wake-up; physical verification later found the actual cause was the iPhone hardware mute switch (Web Audio respects it, `HTMLAudioElement` does not), and capture only appeared to help because it moved the page into an audio-session category the switch does not silence. See `docs/DECISIONS.md` ADR-028.

Issue 015 derives target guidance from persistent keyboard selection, not `activeMidi`. Guidance therefore remains active when playback is stopped, suspended, unavailable, or in error. Starting or stopping the selected drone neither creates nor clears a separate target, while selecting another key updates both selection-driven guidance and the existing drone command through their separate owners.

Issue 016 keeps the drone optional throughout practice. Starting practice never starts audio, and playback Stop, Start, failure, or volume changes never pause, finish, or alter metric accounting. The session locks selected MIDI rather than active drone MIDI. While practice is running or paused the keyboard cannot activate another selection, but the existing Start/Stop and volume controls remain available for that locked note.

Because speaker output can feed back into the microphone and pitch detector, the interface recommends headphones. Echo cancellation settings cannot guarantee acoustic isolation, so users remain responsible for output level and physical routing.

## Confirmed playback, suspension, errors, and races

Every playback path resumes a suspended or runtime-interrupted context before producing or changing audio and then checks the state again. `playing` requires a running, non-closed context; destination connection; both voice connections; successful oscillator start; valid gain values; and a current operation token. This confirms a valid Web Audio output graph, not the physical speaker, OS output route, device mute state, or human audibility.

Unknown future context states remain `unknown` rather than being mislabeled as suspended. Context and voice generations isolate stale `statechange` and `onended` callbacks. A resumed context must also advance `currentTime` during a short confirmation interval; a nominally running but stalled iOS context remains a recoverable error. Visibility and page events never auto-start sound. Hidden/pagehide state invalidates the active voice, and the next explicit foreground gesture closes the invalidated context and creates a fresh generation.

Unsupported Web Audio, invalid notes, contexts that remain suspended, interrupted/closed contexts, graph failures, oscillator-start failures, and other start failures have typed error states. Selection remains available, so a later explicit activation retries. A closed retained context is discarded and a replacement is created only on a later explicit playback command. A `statechange` listener updates diagnostics and invalidates/cleans an active voice if output leaves `running`; disposal removes the listener.

An operation token invalidates stale asynchronous starts and transitions. Shared resume and release promises prevent duplicate lifecycle work. A Stop or newer note request wins over an older pending request; a stale completion cannot abort the shared prepared voice or publish an obsolete error. Listener exceptions are isolated from engine state.

Each voice separately tracks whether its initial attack has been scheduled. If another activation takes ownership of a zero-gain voice while resume is pending, the winning command schedules that voice's attack before publishing `playing`. This fixes the rapid-activation race where the newest MIDI was reported as playing but the reused voice stayed at zero gain. Ordinary note changes keep their existing frequency transition and do not retrigger the attack or create another oscillator.

A release normally finishes through oscillator `onended`. If the context leaves `running` during release, the engine instead stops and disconnects that releasing voice immediately and settles the release promise without waiting for audio-clock progress. The same rule applies if release begins with an already non-running context. The next explicit activation replaces the invalidated output context; interruption never auto-plays. Explicit Stop finishes as `stopped` with no active/pending note. A completed release callback is idempotent, and the existing operation check prevents an older Stop completion from overwriting a newer activation. Physical audibility, including intentional zero master volume and iPhone Silent Mode, remains outside the `playing` graph/attack guarantee.

React Strict Mode does not construct audio during its development-only setup cycle because engine creation remains lazy. Hook subscriptions are bound to engine identity, so a disposed instance cannot publish into a later owned instance. Mount/cleanup/remount regression coverage verifies that activation uses only the current engine.

## Development diagnostics

Development builds include a collapsed **Reference-drone diagnostics** panel. Preview can expose it with `?droneDiagnostics=1`. Production continues to ignore that broad developer flag, but the narrower `?audioDiagnostics=1` read-only audio lifecycle panel remains available. It includes constructor identity, context/voice generations, resume result, state and rendering-clock checks, graph/gain invariants, visibility lifecycle, and a bounded 40-event log. It does not unlock fabricated tuner or practice input.

Diagnostic mode also provides an explicit one-second A4 output test through the same protected master path. Separate direct ramped-gain and direct constant-gain tests use temporary oscillator/gain/analyser paths to the current destination, bypassing the retained voice and master. A generated local PCM WAV plays through `HTMLAudioElement` without entering Web Audio — because that element ignores the hardware mute switch, it staying audible while the Web Audio tests are silent usually means the switch is engaged, not that something else is broken (see `IOS_SAFARI_AUDIO_DEBUGGING.md`). Explicit recreation stops and disconnects current output, requests closure, constructs a fresh context in the gesture, and runs the direct constant-gain path. A separately labeled action first attempts temporary playback-session preparation, then runs that recreation test and restores the prior value; this action is a documented negative result kept for reference, not a working repair, and is a deletion candidate in a future cleanup. These comparisons do not change keyboard selection, target, microphone, history, or practice state and cannot overlap another test or active drone.

The same mode maintains at most 40 snapshots across page load, drone creation/resume/retry, before and after `getUserMedia`, microphone analysis-context creation, and microphone Stop. Each snapshot contains only control metadata: session type/state, both context states/sample rates, destination channels, track count/readiness, visibility/focus, current output RMS/peak, and a local audibility annotation. It contains no microphone samples.

Normal reference activation does not mutate `navigator.audioSession` and never calls `getUserMedia`. The temporary `playback` preparation was tried as a production repair and rejected as ineffective, with interaction/lifecycle regressions besides. That result is expected in hindsight: the drone's actual audibility was gated by the hardware mute switch, a device-level setting outside anything this API controls. Diagnostic mode retains one explicit prepare-playback, recreate-context, and direct-output comparison for reference; it is never invoked by a reference key and does not affect audibility. Web Audio remains the sole production backend; native media remains diagnostic only.

Gain diagnostics record the observed parameter value, application target, automation method, context scheduling time, and whether scheduling occurred after `running`. They describe scheduling assumptions, while analyser RMS/peak describes rendered pre-destination samples. Neither proves the physical speaker route, and both can report fully healthy values while the drone is inaudible because of the mute switch. Normal use reads `navigator.audioSession` diagnostics only; the explicit session experiment is the sole writer, and its result does not track or predict audibility.

Concise transition logging is available in development and Preview with `?droneDebug=1`; Production ignores the flag. It covers context creation/resume, graph connection, oscillator start, attack, confirmation, transition, Stop, oscillator end, invalidation, disposal, and errors. It contains no microphone samples or personal data.

## Cleanup and privacy

Stop captures the current voice gain, cancels/holds automation, and explicitly anchors that value at Stop time before a 120 ms linear ramp to exact zero. Without that anchor, a sustained note's new ramp can interpolate from the old attack endpoint: a silent WebKit offline experiment reproduced an immediate 1.0 → 0.21 gain jump. Oscillator termination follows one 128-frame render quantum after zero (about 2.7 ms at 48 kHz), then `onended` disconnects the voice. Non-running-context release settlement and stale callback ownership remain unchanged. Disposal invalidates pending work, cancels scheduled automation, stops and disconnects any voice, disconnects the master gain, closes the dedicated context, and clears listeners. Cleanup is idempotent.

The oscillator is generated locally. No microphone audio or synthesized audio is recorded, stored, logged, uploaded, or sent to a backend.

## Accessibility and performance

Reference keys remain semantic buttons with roving tabindex and visible focus. Selection uses `aria-pressed`; sounding state is exposed in each active key's accessible name and in a polite text status. Start, Stop, and the native range input are keyboard and touch operable, with explicit labels and disabled states.

Playback creates no animation loop and no audio-rate React update. Diagnostic sampling uses at most one 8 Hz interval and a reusable typed array, and stops with output, page hiding, context replacement, or disposal. Only lifecycle, note, volume, range, and low-rate diagnostic events update UI state. Audio-parameter ramps execute on the audio rendering thread.

## Known limitations

- one harmonic voice only, with no user-facing timbre selector, chords, sustain, or samples;
- no drag glissando or physical MIDI input;
- selected note and volume reset on page refresh;
- acoustic feedback is possible without headphones;
- browser autoplay and device-output policies still apply;
- Web Audio graph confirmation cannot prove physical speaker output or routing;
- physical iPhone Safari and Android Chrome audio verification remains manual.
- native media remains a diagnostic comparison; any product fallback requires a separate successful physical A/B result.

A later issue may add a small locally synthesized timbre choice while preserving the one-voice, gain-protected, dependency-free architecture.

## Physical acceptance for Stop and level

With iPhone Silent Mode OFF, play A4 and Stop, listening specifically for the final click; repeat 10 times. Repeat with C3, G3, and C4. Change notes while playing and confirm transitions remain smooth. Compare the previous maximum with the new 100% level. Start microphone capture while the drone plays and note any perceived level change. Perform this on the built-in speaker and headphones if available. Automated envelope/headroom checks do not establish subjective clicklessness or loudness.
