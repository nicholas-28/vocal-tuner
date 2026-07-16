# iPhone Safari reference-audio debugging

Issue 018.1 responds to a production report where the reference drone was silent on a physical iPhone even though desktop playback worked. Repository investigation found that context construction and `resume()` began in the trusted click, but oscillator creation and `start()` happened only after awaiting the resume promise. WebKit applies stricter user-gesture timing to Web Audio rendering, so the first repair prepares and starts a zero-gain source before yielding, then raises its envelope only after state and rendering-clock confirmation.

That repair fixed a real activation defect but did not restore physical output. A Preview tested in ordinary Safari 18.4 on iOS 18.4.1 reported a standard `AudioContext`, 48 kHz sample rate, `running` state, advancing rendering clock, started oscillator, connected graph, voice gain `1.0`, master gain about `0.16`, and no error. Both the persistent drone and original one-second engine test remained inaudible. Connection flags and `AudioParam.value` describe control state; they do not prove that rendered buffers contain non-zero samples or that the physical route receives them.

Automated WebKit tests verify sequencing and state truthfulness. They cannot prove that a physical iPhone speaker or routed output is audible. Physical testing is the merge gate.

## Production diagnostic mode

Open:

`https://vocal-tuner.vercel.app/?audioDiagnostics=1`

Production diagnostics remain hidden without this exact query flag. The mode exposes read-only browser, context, graph, gain, interruption, lifecycle, and generation state. It does not enable `centsMeterDemo`, fabricated pitch, practice controls, admin behavior, recording, or microphone samples.

The action area now provides five explicit comparisons:

- **Play 1-second output test** uses the persistent engine/master/analyser path.
- **Play direct Web Audio test** uses a temporary ramped gain and analyser connected directly to the current context destination.
- **Play Web Audio test with constant gain** uses a temporary direct path with gain set at the running context time and no ramp.
- **Play native audio test** plays a locally generated one-second PCM WAV through an `HTMLAudioElement`, outside Web Audio.
- **Recreate audio output context** cleans and closes the retained graph, creates a new context in the tap, and runs the direct constant-gain test.

Tests cannot overlap the drone or each other. They do not select a note or mutate microphone, history, target, or practice state. Manual Yes/No annotations are local, non-persistent, and included in **Copy audio diagnostic report**. If Clipboard API access fails, a selected read-only textarea appears.

When diagnostics are enabled, the persistent audible path is `oscillator → voice gain → master gain → output analyser → destination`. The analyser reads 1,024-sample time-domain buffers at 8 Hz only while output is expected. One reusable array and one sampling interval are used. It classifies active or silent only after three consecutive measurements at a centralized RMS-or-peak threshold of `0.0001`; until then the result is not measured. Sampling stops on idle, hiding, replacement, pagehide, and disposal. These values measure the digital signal immediately before `AudioDestinationNode`, not the speaker.

## Enable Safari Web Inspector

1. On iPhone, open Settings → Apps → Safari → Advanced → Web Inspector and enable it.
2. Connect the iPhone to the Mac.
3. Trust the Mac/iPhone connection if prompted.
4. Open the deployed Vocal Tuner URL in iPhone Safari.
5. Open Safari on the Mac.
6. Enable developer features or the Develop menu in Safari settings if it is not visible.
7. Choose Develop → [iPhone name] → [Vocal Tuner page].
8. Open Console.
9. Reload the page.
10. Open `https://vocal-tuner.vercel.app/?audioDiagnostics=1`.
11. Run each physical test action and mark its audible result.
12. Tap a reference key and mark the persistent result.
13. Tap **Copy audio diagnostic report** and save the report with the test notes.
14. Record every signal classification, RMS/peak result, context generation, native event result, and console error.

## Physical acceptance sequence

Record the iPhone model, iOS version, ordinary Safari tab or installed-home-screen mode, Production or Preview URL, and output route.

1. Confirm media volume is audible with a known media source.
2. Check the current output route, including Bluetooth, AirPlay, wired headphones, and the built-in speaker.
3. Record silent-mode state as an observed device variable; do not assume it is the software cause.
4. Keep the Safari tab in the foreground.
5. Reload diagnostics and confirm no context exists before a tap.
6. Tap a reference key; record audibility plus persistent RMS/peak.
7. Run the engine, direct ramped, and direct constant-gain tests; record audibility and RMS/peak for each.
8. Run the native media test; record audibility, play result, `playing`, `timeupdate`, current time, and `ended`.
9. Recreate the context; record old/new generations, close result, direct-test RMS/peak, and audibility.
10. Tap C4, A4, and F#4; verify same-note Stop and different-note transition. Change volume and confirm behavior without a click.
11. Test microphone → drone and drone → microphone. Microphone Stop must not stop the drone.
12. Background Safari, return to the foreground, confirm no auto-start, and retry explicitly.
13. Copy the completed report before reloading.
14. Repeat with other routes or installed-home-screen mode only after capturing the affected ordinary-Safari baseline.

Expected successful diagnostics are context `running`, resume `resolved` when requested, rendering clock `advanced`, oscillator started, both gain connections present, destination connected, non-zero protected master gain above 0% volume, and engine `playing`. These values prove digital rendering readiness, not physical speaker routing.

## Report interpretation

- `suspended` after a resolved resume: output activation was rejected; tap again and retain the report.
- `interrupted`: iOS interrupted the context; return to the foreground and use a new explicit playback gesture.
- `running` with rendering clock `stalled`: the context reported a false-ready state; the UI must remain in error rather than claim playback.
- `running` with clock `advanced` and valid graph but silence: inspect media volume, mute state, Bluetooth/AirPlay route, headphones, tab state, and device/iOS-specific WebKit behavior.
- `closed`: the next explicit gesture creates a new context generation.
- constructor `webkitAudioContext`: the standard constructor was absent and the runtime used the prefixed capability fallback.

## Comparison interpretation

- Web Audio active + native audible + Web Audio inaudible: likely an iOS Web Audio destination/session problem.
- Web Audio active + native also inaudible: investigate route, media volume, mute policy, Bluetooth/AirPlay, page state, or broader media output.
- Web Audio silent + native audible: the Web Audio control graph is alive but is not rendering non-zero samples.
- Direct Web Audio audible + persistent inaudible: investigate the retained master/envelope lifecycle.
- Persistent and direct paths active but inaudible: investigate destination/session behavior beyond graph construction.
- Constant gain active while ramped gain is silent: investigate automation timing; do not remove production envelopes without physical proof.
- A recreated context becoming audible implicates a stale/unusable retained context; no automatic recreation policy is adopted without that evidence.

These are diagnostic branches, not automatic root-cause declarations. `navigator.audioSession`, when present, is reported read-only (`type` and `state`); the app neither browser-sniffs nor writes this experimental capability.

The report contains deployment version/SHA, parsed iOS/Safari version, context and analyser generations, automation metadata, all digital and manual comparison results, native events, audio-session capability, visibility state, and the bounded lifecycle log. It contains no microphone audio, recording, account information, token, or secret. This production diagnostic surface is temporary and hidden without `audioDiagnostics=1`.
