# Testing Strategy

## Unit tests

Test deterministic functions thoroughly:

- frequency to MIDI conversion;
- MIDI to note and octave;
- cents calculation;
- reference-note frequency;
- note-name formatting;
- range calculations;
- pitch-buffer trimming;
- interpolation and coordinate mapping.

## Audio algorithm tests

Use generated fixtures where possible:

- sine waves at known frequencies;
- low and high vocal-range frequencies;
- silence;
- noise;
- weak fundamental with harmonics;
- gradual slides;
- vibrato;
- true octave leaps.

## Browser tests

Playwright should cover:

- permission-state UI;
- start and stop flow using mocked media APIs where possible;
- pause;
- clear;
- range selection;
- keyboard interaction;
- responsive layout;
- error state when microphone access is denied.

## Manual device matrix

Minimum:

- recent iPhone Safari;
- older supported iPhone Safari;
- Android Chrome;
- macOS Safari;
- desktop Chrome.

## Real-voice testing

Use several voices:

- low male range;
- high male range;
- low female range;
- high female range;
- breathy tone;
- strong vibrato;
- beginner with unstable pitch.

Do not tune thresholds using only one person's voice.

## Acceptance benchmark for technical proof

For a stable sung reference note in a quiet room:

- detected note is normally correct;
- displayed cents are directionally useful;
- response begins quickly enough for practice;
- no frequent false octave jumps;
- silence stops the line.
