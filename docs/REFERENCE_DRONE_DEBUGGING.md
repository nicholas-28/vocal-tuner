# Reference Drone Debugging

The reference drone can confirm a valid running Web Audio graph, but it cannot inspect the physical speaker route, OS volume, device mute switch, or whether a listener hears the output.

**Check the hardware mute switch first.** On iPhone, iOS Safari's Web Audio respects the physical mute switch; `HTMLAudioElement` does not. A fully healthy, confirmed-`running` graph produces no audible output while the switch is in silent position — this is a confirmed cause, not a hypothesis, verified on device (see `docs/DECISIONS.md` ADR-028). Before treating silence as a bug, confirm the switch is in ring (sound-enabled) position.

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

If every invariant is confirmed but no sound is heard, check the hardware mute switch position first — on iPhone this is the most common cause and is a confirmed one, not a guess (see below). Then check the browser tab mute state, OS output device and volume, Bluetooth routing, and headphones, and compare Chrome and Safari. Do not treat confirmed graph state alone as proof of physical output.

In audio diagnostic mode the real path includes one analyser immediately before destination. Its RMS/peak result comes from rendered time-domain samples, unlike gain and connection fields. At 8 Hz, three consecutive buffers above or below the `0.0001` RMS-or-peak threshold classify the path as digitally active or silent; earlier results remain not measured. An active result still does not prove speaker audibility.

The engine output test shares the persistent master path. The direct ramped and direct constant-gain A4 tests use temporary analyser paths to destination, isolating the retained master and automation. Native media uses a generated local WAV and `HTMLAudioElement`, isolating Web Audio. Context recreation disposes the retained chain and runs a direct test on a new generation. See `IOS_SAFARI_AUDIO_DEBUGGING.md` for the comparison matrix.

An earlier investigation found that starting microphone capture made an already-silent drone audible, and read this as a platform wake-up: the microphone graph is only `MediaStreamAudioSourceNode → AnalyserNode`, it never reaches destination, and stopping capture did not silence the drone. Physical verification later identified the actual cause: the hardware mute switch was engaged during that investigation, and Web Audio (unlike `HTMLAudioElement`) respects it. Starting capture moved the audio session into a category the switch does not silence, which is why it appeared to help — but capture was never required. See `IOS_SAFARI_AUDIO_DEBUGGING.md` and `docs/DECISIONS.md` ADR-028.

A production `playback`-category preparation was tried as a repair for the (mistaken) route theory and rejected: fresh-page output remained inaudible and key/background recovery became unreliable. Normal reference activation does not write AudioSession state and never calls `getUserMedia`. One clearly labeled diagnostic action still prepares playback, recreates the context, runs a direct output test, and restores the prior type, but it is a documented negative result kept for reference, not a working mechanism.

Current reference diagnostics also report backend `web-audio`, the selected harmonic profile, every exact partial frequency/amplitude, predicted worst-case peak, and observed analyser peak. Low notes below C3 use the strongest upper-harmonic support; the gain ceiling remains unchanged.

For iPhone remote inspection, report copying, output-test interpretation, and the complete physical acceptance sequence, see `IOS_SAFARI_AUDIO_DEBUGGING.md`.

## Safe lifecycle expectations

Stop changes voice to `releasing`, schedules the 120 ms fade, ends and disconnects the voice, and retains a healthy running context. Hidden/pagehide cleans the voice and marks the selected note as needing reactivation; returning foreground does not play. The next explicit selected-note gesture closes that invalidated context and creates a fresh generation. Unmount stops/disconnects the voice, disconnects master output, removes the state listener, and closes the context. Microphone controls and pitch-history controls do not mutate these application-owned states.
