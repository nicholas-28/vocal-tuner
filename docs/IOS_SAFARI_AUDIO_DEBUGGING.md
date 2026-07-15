# iPhone Safari reference-audio debugging

Issue 018.1 responds to a production report where the reference drone was silent on a physical iPhone even though desktop playback worked. Repository investigation found that context construction and `resume()` began in the trusted click, but oscillator creation and `start()` happened only after awaiting the resume promise. WebKit applies stricter user-gesture timing to Web Audio rendering, so the repair prepares and starts a zero-gain source before yielding, then raises its envelope only after state and rendering-clock confirmation.

Automated WebKit tests verify sequencing and state truthfulness. They cannot prove that a physical iPhone speaker or routed output is audible. Physical testing is the merge gate.

## Production diagnostic mode

Open:

`https://vocal-tuner.vercel.app/?audioDiagnostics=1`

Production diagnostics remain hidden without this exact query flag. The mode exposes read-only browser, context, graph, gain, interruption, lifecycle, and generation state. It does not enable `centsMeterDemo`, fabricated pitch, practice controls, admin behavior, recording, or microphone samples.

Use **Play 1-second output test** to play a protected A4 sine through the same context and output graph. It requires a tap, cannot overlap another output test or active drone, does not select a reference note, and cleans up its temporary voice. Use **Copy audio diagnostic report** to copy build and lifecycle data. If Clipboard API access fails, a selected read-only textarea appears for manual copying.

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
11. Tap **Play 1-second output test**.
12. Tap a reference key.
13. Tap **Copy audio diagnostic report** and save the report with the test notes.
14. Record context state, rendering-clock result, output-test result, and any console error.

## Physical acceptance sequence

Record the iPhone model, iOS version, ordinary Safari tab or installed-home-screen mode, Production or Preview URL, and output route.

1. Confirm media volume is audible with a known media source.
2. Check the current output route, including Bluetooth, AirPlay, wired headphones, and the built-in speaker.
3. Record silent-mode state as an observed device variable; do not assume it is the software cause.
4. Keep the Safari tab in the foreground.
5. Reload diagnostics and confirm no context exists before a tap.
6. Tap **Play 1-second output test** and record whether A4 is audible.
7. Tap C4, A4, and F#4; verify same-note Stop and different-note transition.
8. Change volume and confirm the protected output changes without a click.
9. Test microphone → drone and drone → microphone. Microphone Stop must not stop the drone.
10. Background Safari, return to the foreground, and confirm audio does not auto-start. Tap the selected key or **Start selected drone** and verify explicit recovery.
11. Repeat in ordinary Safari and installed-home-screen mode when available.
12. Repeat with the built-in speaker and headphones, and record Bluetooth routing separately.

Expected successful diagnostics are context `running`, resume `resolved` when requested, rendering clock `advanced`, oscillator started, both gain connections present, destination connected, non-zero protected master gain above 0% volume, and engine `playing`. These values prove digital rendering readiness, not physical speaker routing.

## Report interpretation

- `suspended` after a resolved resume: output activation was rejected; tap again and retain the report.
- `interrupted`: iOS interrupted the context; return to the foreground and use a new explicit playback gesture.
- `running` with rendering clock `stalled`: the context reported a false-ready state; the UI must remain in error rather than claim playback.
- `running` with clock `advanced` and valid graph but silence: inspect media volume, mute state, Bluetooth/AirPlay route, headphones, tab state, and device/iOS-specific WebKit behavior.
- `closed`: the next explicit gesture creates a new context generation.
- constructor `webkitAudioContext`: the standard constructor was absent and the runtime used the prefixed capability fallback.

The report contains the deployment version, browser/platform user-agent summary, Web Audio state, and the last 40 lifecycle events. It contains no microphone audio, audio recording, account information, token, or secret.
