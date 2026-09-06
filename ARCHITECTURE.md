# Architecture

## High-level pipeline

```text
Microphone → source/analyser → YIN + confidence/silence acceptance (≤30 Hz)
                                ├─ musical interpretation → PitchSource
                                │                            → realtime reads (60/120 Hz)
                                └─ UI publication (≤15 Hz)
                                    → React continuity / musical pitch
                                    ├─ text, cents, target guidance
                                    ├─ timestamped history → Canvas RAF
                                    └─ practice observation effects
```

The realtime boundary is current-frame detector evidence, before continuity or visual smoothing. It uses microphone session generations, immutable snapshots and a 256-observation ring. `getLatest()` allocates nothing and does not update React; consumers also check observation age before using pitch as fresh evidence. Existing UI, practice and history keep their publication cadence. The production analyser uses RAF, not an AudioWorklet. See [PitchSource](docs/PITCH_SOURCE.md) for the current data-flow audit, complete contract, lifecycle and diagnostic timing policy.

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

The current types are `RawPitchDetection` (detector evidence), `PitchSample` (immutable realtime observation plus accepted musical values), `PitchContinuityState`/`PitchContinuityDecision` (UI uncertainty and history ingestion), `MusicalPitch` (music theory), and `PitchHistory` (visual retention). PitchSource's `raw` preserves the detector result; its nullable musical fields never contain held continuity pitch. See `src/pitch/pitchSource.ts` and `src/types/`.

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
