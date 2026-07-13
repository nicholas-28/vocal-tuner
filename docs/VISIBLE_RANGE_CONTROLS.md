# Visible Range Controls

Issue 010 makes the graph's vertical range a user-controlled visualization preference. It does not change microphone capture, the detector's 65–1200 Hz range, musical conversion, stored history, retention, pause timing, or the live tuner readout.

## Model, limits, and presets

Visible bounds are inclusive finite integer MIDI values. This first UI supports a fixed two-octave span:

```text
highMidi - lowMidi = 24
visible note count = 25
```

The allowed graph domain is MIDI 36–84, C2–C6. One centralized model defines three presets:

- `low`: MIDI 36–60, C2–C4;
- `middle`: MIDI 48–72, C3–C5;
- `high`: MIDI 60–84, C4–C6.

`middle` is the authoritative default. Display labels are derived through the existing MIDI note utilities. Fixed-span custom ranges inside the global domain remain valid at the model layer, although this issue exposes only presets and octave shifts.

## Presets, shifts, and Reset

Preset buttons expose selection with `aria-pressed`. Shifting subtracts or adds 12 to both bounds and never changes the span. A shift that would cross C2 or C6 is disabled and rejected rather than clamped. If a shifted range equals a preset, that preset becomes selected. Reset returns to C3–C5 and is disabled while already at the default.

The preference lives in the App-level range hook, independently from microphone and history hooks. It therefore survives Pause, Resume, Clear, Stop, and a new microphone Start. It resets to C3–C5 after page refresh.

## Persistence decision

LocalStorage is intentionally omitted in this first version. The preference contains no sensitive data, but persistence would add unavailable-storage, malformed-data, and version-migration behavior without evidence that refresh persistence is important yet. No browser storage, backend, or synchronization is used.

## Grid, curve, and history behavior

Both Canvas layers and the DOM reference keyboard receive the same validated range in one render. A change creates one new shared viewport: the static grid redraws once, the curve redraws from the same immutable retained history, and the keyboard rebuilds its 25 inclusive keys. The active RAF chain continues because range changes update the draw callback rather than its active lifecycle dependency. While paused, the changed callback redraws once at the frozen reference and starts no RAF.

Any active reference-key press is released on a range change. A selected key remains selected only when still visible; otherwise selection clears. Focused MIDI remains when visible and otherwise clamps to the nearest boundary. These changes do not affect microphone or history state.

The semitone-center mapping remains unchanged, so all 25 notes have equal height. Grid labels, octave hierarchy, and graph descriptions update from the selected bounds.

Curve segmentation already treats a MIDI value outside the viewport as a segment break. Values are omitted rather than clamped to the graph edge. Stored history is range-independent: range changes add no gaps, remove no points, and rewrite no MIDI or timestamps. Changing to a range containing a retained point can reveal it again.

## Current-pitch status and accessibility

The main note, frequency, cents, and diagnostics continue for accepted pitches outside the graph domain or selected range. A separate non-live DOM message states whether current pitch is above or below the visible graph range. It disappears for in-range or absent accepted pitch and is not treated as a detector error.

The range uses a labeled fieldset, explicit preset labels, explicit octave-shift names, visible disabled boundary states, keyboard-operable buttons, and a polite current-range announcement. Graph descriptions derive their low/high labels, including the paused variant. Focus is never moved automatically.

## Performance and limitations

Range changes are infrequent React state changes. They do not restart audio, detector analysis, history capture, or RAF, and they create no per-frame state work. Normal bounded segment reconstruction remains sufficient for the few hundred retained points.

Known limitations:

- only fixed two-octave ranges are exposed;
- graph range is limited to C2–C6 while the detector remains wider;
- selection resets on refresh;
- no auto-follow, arbitrary zoom, panning, or semitone picker;
- the keyboard is silent until reference-tone synthesis is implemented;
- physical mobile and Retina verification remains manual.

A future auto-follow mode should update this same range source of truth and preserve the validation, shared-viewport, and no-history-mutation policies.
