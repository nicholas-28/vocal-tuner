# iPhone Safari reference-audio debugging

Issue 018.1 responds to a production report where the reference drone was silent on a physical iPhone even though desktop playback worked. Most of this document was written while that report was still open and unexplained; it has been restructured after physical verification identified the actual cause. See `docs/DECISIONS.md` ADR-028 for the decision-log entry.

## Root cause: the hardware mute switch

The reference drone was never broken. iOS Safari's Web Audio implementation respects the iPhone's hardware mute (ring/silent) switch. `HTMLAudioElement` does not. With the switch in silent position, a fully connected, `running`, otherwise-healthy Web Audio graph produces no audible output — every readiness check the engine performs (context state, rendering-clock advancement, graph connections, gain values) can pass while the switch alone accounts for the silence.

Verified manually on one physical iPhone: clean tree at commit `68ea3e8`, ordinary Safari tab, switch in ring (sound-enabled) position, no microphone started — the drone was audible. This is one device, checked once. It has not been confirmed across iOS versions or audited against WebKit source.

This also explains the `getUserMedia` correlation documented below: starting microphone capture moves the page's OS audio session into a recording category. Apple's published audio-session-category behavior distinguishes sound-effect/game-audio categories, which the switch silences, from playback and recording categories, which it does not. The drone becoming audible after `getUserMedia` was a side effect of leaving the mute-switch-affected category, not a graph dependency, a route "wake-up," or an undocumented WebKit transition. **Microphone capture is not required for drone audibility** and never was; it only appeared necessary because every comparison that used it also happened to escape the muted category.

## Check this before anything else

Before opening diagnostics, reproducing a report, or reading the investigation history below:

1. Check the iPhone's physical mute switch. Ring visible / switch toward the screen back = sound enabled. Orange visible = silent. This alone explains most "graph looks healthy but I hear nothing" reports.
2. Confirm basic device audio with a known media source (e.g. the Music app, or any plain `<audio>` element) — this confirms volume, output route, and Bluetooth/AirPlay are not separately at fault. It will play regardless of the switch, since native media playback isn't silenced by it, so it isn't a substitute for step 1.
3. Only if the switch is confirmed in ring position and the drone is still silent, proceed to the diagnostic mode and the physical acceptance sequence below.

## Production diagnostic mode

Open:

`https://vocal-tuner.vercel.app/?audioDiagnostics=1`

Production diagnostics remain hidden without this exact query flag. The mode exposes read-only browser, context, graph, gain, interruption, lifecycle, and generation state. It does not enable `centsMeterDemo`, fabricated pitch, practice controls, admin behavior, recording, or microphone samples.

The action area provides six explicit comparisons:

- **Play 1-second output test** uses the persistent engine/master/analyser path.
- **Play direct Web Audio test** uses a temporary ramped gain and analyser connected directly to the current context destination.
- **Play Web Audio test with constant gain** uses a temporary direct path with gain set at the running context time and no ramp.
- **Play native audio test** plays a locally generated one-second PCM WAV through an `HTMLAudioElement`, outside Web Audio. Because `HTMLAudioElement` ignores the mute switch, this test staying audible while the others are silent is now understood to usually mean the switch is engaged, not that something else is broken.
- **Recreate audio output context** cleans and closes the retained graph, creates a new context in the tap, and runs the direct constant-gain test.
- **Prepare playback session, recreate context, and test** temporarily writes the capability-detected AudioSession type, then runs the fresh-context test and restores the prior type. This action is a retained negative result, not a working repair (see ADR-028 in `docs/DECISIONS.md`): it does not change audibility. It is kept because it is diagnostics-gated and harmless, and is a deletion candidate during a future cleanup.

Normal reference activation does not mutate AudioSession and never calls `getUserMedia`. Only the labeled diagnostic action above writes `navigator.audioSession.type`.

Tests cannot overlap the drone or each other. They do not select a note or mutate microphone, history, target, or practice state. Manual Yes/No annotations are local, non-persistent, and included in **Copy audio diagnostic report**. If Clipboard API access fails, a selected read-only textarea appears.

When diagnostics are enabled, the persistent audible path is `oscillator → voice gain → master gain → output analyser → destination`. The analyser reads 1,024-sample time-domain buffers at 8 Hz only while output is expected. One reusable array and one sampling interval are used. It classifies active or silent only after three consecutive measurements at a centralized RMS-or-peak threshold of `0.0001`; until then the result is not measured. Sampling stops on idle, hiding, replacement, pagehide, and disposal. These values measure the digital signal immediately before `AudioDestinationNode`, not the speaker — a healthy analyser reading and physical silence are both expected simultaneously when the mute switch is engaged.

The copied report contains a bounded 40-entry cross-context timeline. Snapshots are captured at page load, before/after drone context creation, after drone resume, before/after retry, before `getUserMedia`, immediately after capture resolves, after the microphone analysis context starts, and after microphone Stop. They include session type/state, both context states/sample rates, destination channels, track count/readiness, visibility/focus, and last output RMS/peak. No microphone sample data is read by this timeline.

## What we ruled out and why

This section is investigation history, kept for anyone debugging a future audio report on this codebase. Each item below was a real hypothesis, tested with real evidence, and superseded once the mute switch was identified. It is not a list of open questions — all of it is closed.

- **Trusted-activation timing gap (ADR-023).** A real defect, unrelated to the mute switch: context construction and `resume()` began in the trusted click, but oscillator creation and `start()` happened only after awaiting the resume promise, and WebKit applies stricter transient-activation rules to starting Web Audio rendering. The fix — create/connect/start a zero-gain source synchronously in the gesture, raise the envelope only after state and rendering-clock confirmation — is correct and remains in place. It did not, and could not, address a hardware switch.
- **"The Web Audio graph is inaudible on iPhone despite passing every readiness check" (ADR-024).** Ruled out as a graph or route defect. The pre-destination analyser and native-media comparisons built to test this theory reported exactly the pattern the mute switch produces: a healthy analyser reading with physical silence, and an audible native-media test at the same time. That pattern was real; the "broken route" interpretation of it was not.
- **"`getUserMedia` wakes or repairs the audio route" (ADR-025).** Ruled out as a wake-up or repair mechanism. The correlation — starting the microphone made the drone audible — was real and reproducible. The mechanism was a mute-switch-exempt audio-session category change caused by capture, not a dependency between the microphone graph and the drone's output graph. The two contexts never shared a node, and stopping capture did not silence the drone.
- **"Writing `navigator.audioSession.type = 'playback'` reproduces the fix" (ADR-026).** Tested and rejected on device: it did not restore audibility and it regressed key/lifecycle presentation. This is consistent with the corrected understanding — the actual variable (the physical switch) is outside the application and not something this Working-Draft API controls, at least not in the WebKit build tested. Why the write measured as ineffective (whether it simply doesn't produce the same category change `getUserMedia` does, or something else) is Unknown; this was not investigated further once the switch was identified as the cause.

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

1. Confirm the hardware mute switch is in ring (sound-enabled) position. Record its position explicitly — do not assume it, and do not skip this because a prior run already checked it.
2. Confirm media volume is audible with a known media source.
3. Check the current output route, including Bluetooth, AirPlay, wired headphones, and the built-in speaker.
4. Keep the Safari tab in the foreground.
5. Reload diagnostics and confirm no context exists before a tap.
6. Without starting the microphone, test A4 and confirm normal activation records no AudioSession assignment.
7. Test C3, E3, G3, C4, and A4; record practical loudness and harmonic-profile diagnostics.
8. Stop and restart the drone; confirm a healthy stopped output context is retained.
9. Start microphone capture normally and test the same notes while the drone is active. This is a regression check, not a precondition — audibility should already have held at step 7 with the switch in ring position and no microphone use.
10. Stop the microphone and test the drone again without reloading.
11. Confirm the microphone was requested exactly once and never by a reference-key action.
12. Run the direct, constant-gain, and native-media comparisons if any result remains ambiguous. If the native-media test is audible while the drone is not, check the switch again before concluding anything else.
13. Background Safari, return to the foreground, confirm no auto-start and a needs-reactivation message, then retry explicitly and confirm a fresh context generation.
14. With the drone stopped, run the labeled playback-session/context-recreation diagnostic and confirm it remains a no-op for audibility (see "What we ruled out and why" above).
15. Repeat the core comparison on built-in speaker and available wired/Bluetooth headphones.
16. Copy the completed report before reloading.

Expected successful diagnostics are context `running`, resume `resolved` when requested, rendering clock `advanced`, oscillator started, both gain connections present, destination connected, non-zero protected master gain above 0% volume, and engine `playing`. These values prove digital rendering readiness, not physical speaker routing — with the switch engaged, all of them can be true simultaneously with total physical silence.

## Report interpretation

- `suspended` after a resolved resume: output activation was rejected; tap again and retain the report.
- `interrupted`: iOS interrupted the context; return to the foreground and use a new explicit playback gesture.
- `running` with rendering clock `stalled`: the context reported a false-ready state; the UI must remain in error rather than claim playback.
- `running` with clock `advanced` and valid graph but silence: check the hardware mute switch first (see above). If the switch is confirmed in ring position and silence persists, then inspect media volume, Bluetooth/AirPlay route, headphones, tab state, and device/iOS-specific WebKit behavior.
- `closed`: the next explicit gesture creates a new context generation.
- constructor `webkitAudioContext`: the standard constructor was absent and the runtime used the prefixed capability fallback.

## Comparison interpretation

- Web Audio active + native audible + Web Audio inaudible: check the hardware mute switch first — this is its expected signature, since `HTMLAudioElement` ignores the switch and Web Audio does not. Only investigate an iOS Web Audio destination/session problem once the switch is confirmed in ring position.
- Web Audio active + native also inaudible: the switch is not the explanation by itself; investigate route, media volume, Bluetooth/AirPlay, page state, or broader media output.
- Web Audio silent + native audible: with the switch confirmed in ring position, the Web Audio control graph is alive but is not rendering non-zero samples; with the switch in silent position, this is the expected mute-switch signature, not a graph defect.
- Direct Web Audio audible + persistent inaudible: investigate the retained master/envelope lifecycle.
- Persistent and direct paths active but inaudible: with the switch confirmed in ring position, investigate destination/session behavior beyond graph construction.
- Constant gain active while ramped gain is silent: investigate automation timing; do not remove production envelopes without physical proof.
- The diagnostic playback-session preparation reporting `prepared` does not, and is not expected to, change audibility. Its result is retained for the report but is not diagnostic of anything beyond confirming the write itself succeeded.
- `play-and-record` or microphone capture producing only quiet output may indicate receiver/communications routing rather than insufficient Web Audio gain.

The production path does not write `navigator.audioSession.type`, inspect the user agent, select a native backend, or request microphone access. The labeled diagnostic session experiment is the sole writer, and it is a documented negative result rather than a mechanism to reason about when interpreting audibility.

The report contains deployment version/SHA, parsed iOS/Safari version, context and analyser generations, automation metadata, selected backend, harmonic profile and partials, predicted/observed peak, diagnostic session snapshots, native events, the audio-session timeline, visibility state, and the bounded lifecycle log. It contains no microphone audio, recording, account information, token, or secret. This production diagnostic surface is temporary and hidden without `audioDiagnostics=1`.
