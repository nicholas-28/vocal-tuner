# Reference Drone Debugging

The reference drone can confirm a valid running Web Audio graph, but it cannot inspect the physical speaker route, OS volume, device mute switch, or whether a listener hears the output.

## Opening diagnostics

Development builds show **Reference-drone diagnostics** beneath the controls. For a production-like build, append `?droneDiagnostics=1` to the page URL. Append `?droneDebug=1` in development for concise transition logs.

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

## Safe lifecycle expectations

Stop changes voice to `releasing`, schedules the 120 ms fade, ends and disconnects the voice, and retains the running context. Restart creates a new voice on that context. Unmount stops/disconnects the voice, disconnects master output, removes the state listener, and closes the context. Microphone controls and pitch-history controls do not mutate any of these states.
