# iPhone Safari reference-audio debugging

Issue 018.1 responds to a production report where the reference drone was silent on a physical iPhone even though desktop playback worked. Repository investigation found that context construction and `resume()` began in the trusted click, but oscillator creation and `start()` happened only after awaiting the resume promise. WebKit applies stricter user-gesture timing to Web Audio rendering, so the first repair prepares and starts a zero-gain source before yielding, then raises its envelope only after state and rendering-clock confirmation.

That repair fixed a real activation defect but did not restore physical output. A Preview tested in ordinary Safari 18.4 on iOS 18.4.1 reported a standard `AudioContext`, 48 kHz sample rate, `running` state, advancing rendering clock, started oscillator, connected graph, voice gain `1.0`, master gain about `0.16`, and no error. Both the persistent drone and original one-second engine test remained inaudible. Connection flags and `AudioParam.value` describe control state; they do not prove that rendered buffers contain non-zero samples or that the physical route receives them.

The next physical comparison established that capture changes the outcome: the drone is silent or barely audible in a fresh ordinary Safari tab, then becomes audible after `getUserMedia` starts. Note changes work afterward, but the built-in-speaker output remains very quiet and low notes are especially weak. The pre-destination analyser simultaneously reports a strong digital signal (approximately `0.113` RMS and `0.16` peak). The microphone context is separate, is created only after permission resolves, and has no destination connection. The strongest supported explanation is therefore an iOS audio-session/category or physical-route transition caused by capture, not digital oscillator silence.

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

It also provides a microphone-dependency A/B guide and diagnostic-only audio-session experiments. When `navigator.audioSession` exists, **Prepare playback audio session**, **Prepare play-and-record audio session**, and **Prepare playback and recreate output context** attempt the draft API values and report the actual resulting type/state. **Restore prior audio session** restores the value observed before the experiment. Restore it before requesting microphone capture; WebKit has documented that leaving experimental `playback` active can interfere with `getUserMedia`.

Tests cannot overlap the drone or each other. They do not select a note or mutate microphone, history, target, or practice state. Manual Yes/No annotations are local, non-persistent, and included in **Copy audio diagnostic report**. If Clipboard API access fails, a selected read-only textarea appears.

When diagnostics are enabled, the persistent audible path is `oscillator → voice gain → master gain → output analyser → destination`. The analyser reads 1,024-sample time-domain buffers at 8 Hz only while output is expected. One reusable array and one sampling interval are used. It classifies active or silent only after three consecutive measurements at a centralized RMS-or-peak threshold of `0.0001`; until then the result is not measured. Sampling stops on idle, hiding, replacement, pagehide, and disposal. These values measure the digital signal immediately before `AudioDestinationNode`, not the speaker.

The copied report contains a bounded 40-entry cross-context timeline. Snapshots are captured at page load, before/after drone context creation, after drone resume, before/after retry, before `getUserMedia`, immediately after capture resolves, after the microphone analysis context starts, and after microphone Stop. They include session type/state, both context states/sample rates, destination channels, track count/readiness, visibility/focus, last output RMS/peak, and the current local audibility annotation. No microphone sample data is read by this timeline.

## Current AudioSession decision

The [Audio Session Working Draft](https://www.w3.org/TR/audio-session/) defines `auto`, `playback`, and `play-and-record`; microphone tracks contribute a play-and-record element. [WebKit issue 237322](https://bugs.webkit.org/show_bug.cgi?id=237322) associates `playback` with speaker-oriented Web Audio behavior, while [WebKit commit 297571](https://commits.webkit.org/297571@main) documents microphone-capture failure when the experimental type is left at `playback`. Consequently:

- normal reference playback remains Web Audio and does not write `navigator.audioSession`;
- starting the drone never calls `getUserMedia`;
- session mutation is available only behind `audioDiagnostics=1` and is restored explicitly or on diagnostic cleanup;
- a production session policy or native-media backend remains blocked on the new physical A/B results.

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
6. Without starting the microphone, test A4 and annotate **Drone before microphone**.
7. Test C3, E3, G3, C4, and A4; record practical loudness and harmonic-profile diagnostics.
8. Stop the drone. Prepare `playback`, then use **Prepare playback and recreate output context**; record audibility, session result, and RMS/peak.
9. Restore the prior audio-session type.
10. Start microphone capture normally and annotate **Drone after microphone start** after testing the same notes.
11. Stop the microphone and annotate **Drone after microphone stop** after another explicit drone tap.
12. Run the direct, constant-gain, and native-media comparisons if the preparation result remains ambiguous.
13. Background Safari, return to the foreground, confirm no auto-start, and retry explicitly.
14. Repeat the core comparison on built-in speaker and available wired/Bluetooth headphones.
15. Copy the completed report before reloading.

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
- Playback preparation becoming audible before capture supports a capability-gated playback-session policy, subject to a successful subsequent microphone test.
- `play-and-record` or microphone capture producing only quiet output may indicate receiver/communications routing rather than insufficient Web Audio gain.

These are diagnostic branches, not automatic root-cause declarations. `navigator.audioSession`, when present, is reported read-only (`type` and `state`); the app neither browser-sniffs nor writes this experimental capability.

The report contains deployment version/SHA, parsed iOS/Safari version, context and analyser generations, automation metadata, selected backend, harmonic profile and partials, predicted/observed peak, all digital and manual comparison results, native events, audio-session experiments and timeline, visibility state, and the bounded lifecycle log. It contains no microphone audio, recording, account information, token, or secret. This production diagnostic surface is temporary and hidden without `audioDiagnostics=1`.
