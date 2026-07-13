# Reference Drone Synthesizer

Issue 012 turns the vertical reference keyboard into a continuous, monophonic pitch-reference drone. It is a listening aid, not a sampled instrument: one selected note can sound independently of microphone capture and pitch history.

## Interaction model

A completed pointer or keyboard activation selects a note and starts it. Releasing the key clears only transient pressed feedback; the drone continues. Activating the sounding note again stops audio while retaining the selection. Activating a different note keeps one voice and ramps its oscillator frequency instead of starting overlapping oscillators.

The three states are intentionally separate:

- `pressedMidi` describes a pointer or Enter/Space press in progress;
- `selectedMidi` describes the user's persistent reference choice;
- the engine's active note describes the sounding drone.

The explicit **Start selected** control restarts a stopped selection, **Stop reference drone** silences the voice, and the volume slider controls future and current playback. Pointer cancellation never activates a note. Keyboard auto-repeat and compatibility clicks are suppressed so one gesture produces one activation.

## Web Audio ownership and graph

The reference engine owns a dedicated, lazily created `AudioContext`. It neither reuses nor changes the microphone analysis context. Rendering the page, selecting a range, or moving the volume slider does not create an audio context; the first user playback action does.

The graph is:

```text
sine OscillatorNode -> per-voice GainNode -> master GainNode -> destination
```

The initial timbre is a sine wave because it is predictable, lightweight, and free of sample loading or licensing concerns. The engine keeps at most one oscillator voice. It retains the context and master gain after Stop for efficient restart, and closes them only on disposal.

Issue 012 manual testing exposed a false-positive playback defect: the first engine treated a fulfilled `resume()` promise as sufficient and published `playing` without checking that the context had actually reached `running`. A suspended or interrupted context could therefore own a valid-looking but silent graph. The original mocks concealed this by always changing state to `running`.

The repaired construction order is deterministic and transactional:

1. create the context and master gain;
2. set the protected master gain and connect it once to destination;
3. resume a suspended or interrupted context and verify its state again;
4. create oscillator and voice gain;
5. set voice gain to zero and assign frequency;
6. connect oscillator to voice gain and voice gain to master gain;
7. start the oscillator;
8. schedule the attack to voice gain `1.0`;
9. confirm the operation is still current and every graph invariant is true;
10. only then publish `playing`.

Any construction, connection, automation, or start failure disconnects all partially created voice nodes. Destination construction failure also disconnects the master output and closes that failed context.

## Envelopes, transition, and volume

The voice uses a 50 ms attack and 120 ms release to reduce clicks. A different-note activation ramps oscillator frequency over 70 ms. Master-volume changes use a 30 ms gain ramp. All automation begins from the current parameter value before scheduling its target.

The UI volume is normalized from 0–100%. It maps linearly to a deliberately conservative maximum master gain of `0.16`; the default 25% setting therefore produces `0.04` master gain. Per-voice gain remains responsible for the attack and release envelope.

The voice envelope target is exactly `1.0`, so the steady-state effective gain is the protected master gain: `0.04` by default and `0.16` at 100%. A 0% setting intentionally produces an effective gain of zero while the engine may remain logically playing. Volume automation uses `setTargetAtTime` when available and a linear fallback otherwise. Attack, release, and note transitions use linear ramps with safe `setValueAtTime` fallbacks. `cancelAndHoldAtTime` is capability-detected and falls back to cancel-plus-current-value scheduling.

## Range, microphone, and history independence

Changing the visible graph range releases transient key pressure and clamps keyboard focus when necessary, but preserves the selected note and any active drone even when that MIDI note is no longer rendered. A status message identifies that the sounding reference is outside the visible range. Returning to a containing range restores the selected and sounding key indicators.

Reference playback never requests microphone permission and does not start, stop, pause, clear, record, or transform microphone or history state. Conversely, microphone Start/Stop and history Pause/Resume/Clear do not change the drone.

Issue 015 derives target guidance from persistent keyboard selection, not `activeMidi`. Guidance therefore remains active when playback is stopped, suspended, unavailable, or in error. Starting or stopping the selected drone neither creates nor clears a separate target, while selecting another key updates both selection-driven guidance and the existing drone command through their separate owners.

Because speaker output can feed back into the microphone and pitch detector, the interface recommends headphones. Echo cancellation settings cannot guarantee acoustic isolation, so users remain responsible for output level and physical routing.

## Confirmed playback, suspension, errors, and races

Every playback path resumes a suspended or runtime-interrupted context before producing or changing audio and then checks the state again. `playing` requires a running, non-closed context; destination connection; both voice connections; successful oscillator start; valid gain values; and a current operation token. This confirms a valid Web Audio output graph, not the physical speaker, OS output route, device mute state, or human audibility.

Unsupported Web Audio, invalid notes, contexts that remain suspended, interrupted/closed contexts, graph failures, oscillator-start failures, and other start failures have typed error states. Selection remains available, so a later explicit activation retries. A closed retained context is discarded and a replacement is created only on a later explicit playback command. A `statechange` listener updates diagnostics and invalidates/cleans an active voice if output leaves `running`; disposal removes the listener.

An operation token invalidates stale asynchronous starts and transitions. Shared resume and release promises prevent duplicate lifecycle work. A Stop or newer note request wins over an older pending request, and a failed transition releases the existing voice rather than leaving ambiguous playback. Listener exceptions are isolated from engine state.

React Strict Mode does not construct audio during its development-only setup cycle because engine creation remains lazy. Hook subscriptions are bound to engine identity, so a disposed instance cannot publish into a later owned instance. Mount/cleanup/remount regression coverage verifies that activation uses only the current engine.

## Development diagnostics

Development builds include a collapsed **Reference-drone diagnostics** panel. It updates only on commands and engine transitions and exposes context, engine and voice states; graph/destination/start confirmation; MIDI and frequency; oscillator type; voice/master/effective gain; last command; and the last typed error. Normal production UI omits it. A production-like debugging build can expose it explicitly with `?droneDiagnostics=1`.

Concise transition logging is available in development with `?droneDebug=1`. It covers context creation/resume, graph connection, oscillator start, attack, confirmation, transition, Stop, oscillator end, invalidation, disposal, and errors. It contains no microphone samples or personal data.

## Cleanup and privacy

Stop ramps the voice to silence, schedules oscillator stop, and disconnects voice nodes after `onended`. Disposal invalidates pending work, cancels scheduled automation, stops and disconnects any voice, disconnects the master gain, closes the dedicated context, and clears listeners. Cleanup is idempotent.

The oscillator is generated locally. No microphone audio or synthesized audio is recorded, stored, logged, uploaded, or sent to a backend.

## Accessibility and performance

Reference keys remain semantic buttons with roving tabindex and visible focus. Selection uses `aria-pressed`; sounding state is exposed in each active key's accessible name and in a polite text status. Start, Stop, and the native range input are keyboard and touch operable, with explicit labels and disabled states.

Playback creates no animation loop and no high-frequency React update. Only lifecycle, note, volume, and range events update UI state. Audio-parameter ramps execute on the audio rendering thread.

## Known limitations

- one sine voice only, with no timbre selector, chords, sustain, or samples;
- no drag glissando or physical MIDI input;
- selected note and volume reset on page refresh;
- acoustic feedback is possible without headphones;
- browser autoplay and device-output policies still apply;
- Web Audio graph confirmation cannot prove physical speaker output or routing;
- physical iPhone Safari and Android Chrome audio verification remains manual.

A later issue may add a small locally synthesized timbre choice while preserving the one-voice, gain-protected, dependency-free architecture.
