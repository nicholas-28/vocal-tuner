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

Deployment browser coverage runs two separate production bundles:

- `npm run test:e2e:production` builds without test controls and verifies deep-link loading, no automatic permission request, hidden production diagnostics, rejected public mock flags, manifest delivery, and 320 px layout.
- `npm run test:e2e:demo` builds with the explicit local `VITE_ENABLE_TEST_CONTROLS=true` flag and retains deterministic tuner, target, practice, timeline, drone, and range coverage.
- `npm run test:e2e:ios` builds production and runs a mobile WebKit diagnostic sequence with a prefixed constructor, suspended/running/interrupted recovery, gesture sequencing, active/silent analyser fixtures, persistent/direct/constant/native/recreated output comparisons, no microphone request from reference controls, bounded microphone/session snapshots, production playback-session preparation/restoration, harmonic-profile transitions, copied report, and 320 px layout.
- `npm run test:e2e` runs all three flows. None contacts Vercel or requires credentials.

Automated WebKit confirms browser integration and state truthfulness but cannot prove physical iPhone audibility, device routing, media volume, mute behavior, or installed-home-screen differences. Issue 018.1 must not merge until the physical checklist in `IOS_SAFARI_AUDIO_DEBUGGING.md` passes on the deployed Preview URL.

Audio diagnostics unit coverage uses deterministic time-domain buffers. It verifies the real analyser connection, RMS and peak math, three-window classification, reusable arrays, one-loop cleanup, direct and constant-gain graphs, context replacement, generated-WAV/media lifecycle, and report/UI behavior. Tests synthesize no physical sound.

Harmonic tests verify exact A4/C4 fundamentals, integer partial multiples, range boundaries, coefficient normalization, the `0.16` worst-case peak ceiling, one-oscillator note transitions, fallback sine behavior, and cleanup. Audio-session tests cover ordered/bounded snapshots; feature absence; rejected and throwing setters; playback-before-context ordering; retained-context replacement; active-session preservation; owner-safe prior-type restoration; microphone Start/Stop ordering; and the absence of microphone calls or samples from reference activation.

`npm run build` finishes with deployment validation. The validator parses `vercel.json` and the manifest, verifies referenced assets in source and `dist`, and rejects obvious localhost endpoints and local filesystem paths in production output.

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
