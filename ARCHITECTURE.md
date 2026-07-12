# Architecture

## High-level pipeline

```text
Microphone
  → Audio capture
  → Frame extraction
  → Pitch detection
  → Confidence and silence filtering
  → Pitch stabilization
  → Music-theory conversion
  → Timeline buffer
  → Canvas rendering
```

## Technology choices

### Client

- React and TypeScript for the application shell
- Web Audio API for microphone and reference tones
- AudioWorklet where reliable low-latency processing is required
- Canvas for the scrolling pitch graph
- CSS for layout and controls

### No backend in the MVP

The tuner must work without a server. Audio remains on the device.

## Suggested source structure

```text
src/
  app/
    App.tsx
    routes.ts
  audio/
    microphone.ts
    pitch-detector.ts
    pitch-stabilizer.ts
    silence-detector.ts
    reference-tone.ts
  music/
    frequency-to-midi.ts
    midi-to-note.ts
    note-frequency.ts
    tuning.ts
  visualization/
    pitch-buffer.ts
    pitch-canvas.ts
    grid-layout.ts
    viewport.ts
  components/
    TunerHeader.tsx
    PitchMonitor.tsx
    PianoKeyboard.tsx
    Controls.tsx
    PermissionState.tsx
  hooks/
    useMicrophone.ts
    usePitchDetection.ts
    useReferenceTone.ts
  types/
    audio.ts
    pitch.ts
  tests/
```

## Core data model

```ts
export type RawPitchFrame = {
  timestampMs: number;
  frequencyHz: number | null;
  confidence: number;
  rms: number;
};

export type DetectedPitch = {
  timestampMs: number;
  frequencyHz: number;
  midi: number;
  noteName: string;
  octave: number;
  cents: number;
  confidence: number;
};

export type RenderedPitchPoint = {
  timestampMs: number;
  midi: number | null;
  confidence: number;
};
```

## Important separation

Keep three forms of pitch data:

1. Raw detector output
2. Filtered musical pitch
3. Smoothed visual pitch

Never overwrite raw data with rendering smoothing.

## Coordinate system

The vertical axis uses MIDI pitch, not linear frequency.

- One semitone always occupies the same visual height.
- MIDI 60 is C4.
- A fractional MIDI value represents cents within a semitone.

The horizontal axis uses timestamps rather than frame indexes so animation remains stable across devices.

## Performance constraints

- Avoid React state updates for every audio frame.
- Keep high-frequency data in refs, buffers, or dedicated processing modules.
- Render the graph with `requestAnimationFrame`.
- Limit retained history.
- Clean up every audio node and media track on stop or unmount.

## Privacy

- Do not upload microphone audio.
- Do not record by default.
- Explain microphone use before or during permission request.
- Avoid analytics that can capture audio-related user content.
