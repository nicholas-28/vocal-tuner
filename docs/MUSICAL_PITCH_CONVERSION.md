# Musical Pitch Conversion

## Convention

The application uses twelve-tone equal temperament and standard MIDI numbering:

- A4 is MIDI 69 and defaults to 440 Hz.
- C4 (middle C) is MIDI 60.
- MIDI 0 is C-1, MIDI 12 is C0, and MIDI 127 is G9.
- Pitch classes use one sharp-only table: C, C#, D, D#, E, F, F#, G, G#, A, A#, B.
- Flats, key-aware enharmonic spelling, solfège, and localized note names are deferred.

The UI and internal model both use the ASCII `#` accidental.

## Formulas

Frequency to fractional MIDI uses one authoritative formula:

```text
fractionalMidi = 69 + 12 × log2(frequencyHz / tuningA4Hz)
```

The inverse calculation is:

```text
frequencyHz = tuningA4Hz × 2 ^ ((midiNote - 69) / 12)
```

Signed cents relative to the nearest note are:

```text
cents = (fractionalMidi - nearestMidiNote) × 100
```

Calculations retain full JavaScript precision. Rounding occurs only for display.

## Midpoints

Nearest-note selection uses `Math.round`. Exact half steps select the higher integer. For example, MIDI 69.5 selects MIDI 70 and reports approximately -50 cents. JavaScript represents `Math.round(-0.5)` as negative zero; the utility normalizes that value to numeric MIDI 0, which is also the higher integer, with -50 cents.

Values just below a midpoint remain near +50 cents relative to the lower note. Values just above it become near -50 cents relative to the higher note.

## Tuning reference

The authoritative default is A4 = 440 Hz. The pure conversion layer accepts validated future references from 400 through 480 Hz inclusive. The current UI shows a read-only 440 Hz label and provides no settings or persistence.

## Validation

The safe application conversion returns `null` for non-finite, zero, negative, null, or undefined frequency; frequencies outside the detector's 65–1200 Hz application range; and invalid tuning references. Invalid values cannot enter the musical model or formatted UI.

Raw rejected detector candidates are never converted. Only a detection whose rejection reason is `detected` can produce musical pitch.

## Model and display

The musical model contains accepted frequency, fractional MIDI, integer MIDI note, pitch class, note name, explicit accidental, octave, signed cents, ideal note frequency, and tuning reference. It contains no raw detector diagnostics, smoothing, history, or scoring.

Display rules:

- Frequency: one decimal place.
- Cents: one decimal place with an explicit sign, including `+0.0`.
- Values whose magnitude is below 0.05 cents format as `+0.0`, preventing `-0.0`.
- Note and octave are concatenated, such as A3 or C#4.
- Missing pitch uses —, — Hz, and — cents.

The CSS cents indicator maps -50 cents to the left edge, 0 to center, and +50 to the right edge. Values outside that range are clamped only for visual position; the original mathematical cents value is preserved. Missing pitch resets the marker to center and exposes “No pitch” accessibly.

## Representative examples

- 440 Hz at A4 = 440 Hz → MIDI 69, A4, +0.0 cents.
- 220 Hz → MIDI 57, A3, +0.0 cents.
- 261.625565 Hz → MIDI 60, C4, approximately +0.0 cents.
- 277.182631 Hz → MIDI 61, C#4, approximately +0.0 cents.
- 442 Hz under A4 = 440 Hz → A4 with positive cents.
- 440 Hz under A4 = 442 Hz → A4 with negative cents.
