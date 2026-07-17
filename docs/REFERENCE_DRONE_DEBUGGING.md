# Reference Drone Debugging

The reference drone can confirm a valid running Web Audio graph, but it cannot inspect the physical speaker route, OS volume, device mute switch, or whether a listener hears the output.

## Opening diagnostics

Development builds show **Reference-drone diagnostics** beneath the controls. Preview builds can show the detail with `?droneDiagnostics=1` and enable concise transition logs with `?droneDebug=1`. Production ignores both broad flags. Production and Preview may open the narrowly scoped physical-device panel with `?audioDiagnostics=1`; it exposes only reference-output lifecycle data and local comparison tests.

Before activation, context is `unavailable`, engine is `idle`, and no graph or oscillator exists. This means the lazy context has not been created; it does not by itself mean the browser lacks Web Audio.

## Confirmed-playing checklist

After activating C4, confirmed playback should show:

- Context: `running`
- Engine: `playing`
- Voice: `started`
- Graph connected: `yes`
- Destination connected: `yes`
- Oscillator started: `yes`
- MIDI: `60`
- Frequency: approximately `261.63 Hz`
- Voice gain target: `1.000`
- Master/effective gain: `0.040` at 25% or `0.160` at 100%
- Last command: `play:60`
- Last error: `none`

If context remains suspended or interrupted, activate the selected key again from a direct user gesture. If it still fails, record the typed error and development message. A closed context is replaced only by a later explicit activation.

If every invariant is confirmed but no sound is heard, check the browser tab mute state, OS output device and volume, hardware mute, Bluetooth routing, and headphones. Then compare Chrome and Safari. Do not treat confirmed graph state alone as proof of physical output.

In audio diagnostic mode the real path includes one analyser immediately before destination. Its RMS/peak result comes from rendered time-domain samples, unlike gain and connection fields. At 8 Hz, three consecutive buffers above or below the `0.0001` RMS-or-peak threshold classify the path as digitally active or silent; earlier results remain not measured. An active result still does not prove speaker audibility.

The engine output test shares the persistent master path. The direct ramped and direct constant-gain A4 tests use temporary analyser paths to destination, isolating the retained master and automation. Native media uses a generated local WAV and `HTMLAudioElement`, isolating Web Audio. Context recreation disposes the retained chain and runs a direct test on a new generation. See `IOS_SAFARI_AUDIO_DEBUGGING.md` for the comparison matrix.

Physical iOS 18.4.1 testing added the decisive branch: starting microphone capture makes the existing drone audible, and the drone remains audible after capture and its separate analysis context stop. The microphone graph is only `MediaStreamAudioSourceNode → AnalyserNode`; it never reaches destination. The only shared startup mutation is the page/OS audio session and physical route activated when `getUserMedia` returns a live track.

The former interactive `playback` / `play-and-record` session experiments and manual phase annotations were removed after this branch was established. The compact snapshot timeline remains for verifying actual session, context, and track transitions. Production reference activation now performs the selected capability-gated `playback` preparation before creating or replacing the output context, then safely restores the prior type. It still never calls `getUserMedia`.

Current reference diagnostics also report backend `web-audio`, the selected harmonic profile, every exact partial frequency/amplitude, predicted worst-case peak, and observed analyser peak. Low notes below C3 use the strongest upper-harmonic support; the gain ceiling remains unchanged.

For iPhone remote inspection, report copying, output-test interpretation, and the complete physical acceptance sequence, see `IOS_SAFARI_AUDIO_DEBUGGING.md`.

## Safe lifecycle expectations

Stop changes voice to `releasing`, schedules the 120 ms fade, ends and disconnects the voice, and retains the running context. Restart creates a new voice on that context. Unmount stops/disconnects the voice, disconnects master output, removes the state listener, and closes the context. Microphone controls and pitch-history controls do not mutate any of these states.
