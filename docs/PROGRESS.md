# Implementation Progress

## Issue 002 — Microphone permission and lifecycle

Implemented on branch `issue-002-microphone-lifecycle`.

- Explicit lifecycle states: idle, requesting, active, stopping, denied, unsupported, no-device, and error
- Start, stop, repeated-use, unexpected-ended, stale-resource, and unmount cleanup paths
- Conservative voice constraints with one basic-audio retry for over-constrained browsers
- Local RMS input-level monitoring with controlled UI updates
- Accessible status, recovery guidance, and adaptive controls
- No pitch detection, recording, storage, or audio upload

## Issue 003 — Monophonic pitch detection spike

Implemented on branch `issue-003-pitch-detection-spike`.

- Local YIN detector with 65–1200 Hz range, RMS gating, and normalized confidence
- One shared Web Audio analysis graph for input level and pitch
- Throttled raw frequency, confidence, signal, cadence, and computation diagnostics
- Deterministic generated-signal and lifecycle coverage
- Technical evaluation and real-device acceptance checklist in `PITCH_DETECTION_SPIKE.md`
- Note, octave, cents, pitch history, recording, and upload remain unimplemented

## Issue 004 — Real-voice detection follow-up

Implemented on branch `issue-004-real-voice-detection-fix`.

- Audited the YIN stages and exposed raw candidate evidence plus exact rejection reasons
- Fixed hidden 0% confidence when no strict threshold crossing occurred
- Added DC-mean removal while preserving raw RMS
- Tuned provisional RMS, CMND, and confidence thresholds against vocal-like fixtures
- Added a narrow weak-fundamental safeguard for stronger second harmonics
- Added harmonic, noisy, DC-offset, modulated, attack, vibrato, breath, and threshold tests
- Preserved microphone lifecycle and shared-analysis cleanup behavior

## Issue 005 — Musical pitch conversion

Implemented on branch `issue-005-musical-pitch-conversion`.

- Pure equal-temperament frequency, MIDI, note, octave, cents, and ideal-frequency utilities
- Typed musical-pitch model separate from raw detector output
- Fixed A4 = 440 Hz production reference with validated 400–480 Hz architecture
- Live note/octave, frequency, signed cents, and accessible centered cents indicator
- Immediate neutral reset for rejected, silent, stopped, ended, and error states
- Sharp-only naming; no graph, keyboard, reference tone, recording, or scoring

## Issue 006 — Timestamped pitch history buffer

Implemented on branch `issue-006-pitch-history-buffer`.

- Immutable accepted pitch and explicit gap points using monotonic detector timestamps
- Fractional MIDI retained for future equal-semitone graph coordinates
- 15 Hz deterministic sampling with immediate gap and meaningful-pitch transitions
- Bounded 15-second default retention with validated 5–60 second configuration
- Fresh history on successful Start, frozen history on Stop, and independent Clear control
- Compact developer summary; no Canvas, curve, smoothing, persistence, or playback

## Issue 007 — Semitone grid

Implemented on branch `issue-007-semitone-grid`.

- Responsive Canvas grid with a validated, typed viewport and no animation loop
- Fixed inclusive C3–C5 range with 25 equal semitone-center bands
- Pure fractional-MIDI-to-Y and inverse coordinate mapping
- Distinct octave C, natural, and accidental hierarchy using shared note utilities
- Graph-relative 80% present-time marker and deterministic label-density policy
- DPR-aware backing store, pixel-aligned strokes, ResizeObserver cleanup, and fallback sizing
- Preserved history diagnostics and Clear behavior; no curve, scrolling, keyboard, or playback

## Issue 008 — Scrolling pitch curve

Implemented on branch `issue-008-scrolling-pitch-curve`.

- Layered static-grid and animated-curve Canvases sharing one viewport and DPR sizing
- Timestamp-based 15-second horizontal mapping ending at the 80% present marker
- Fractional-MIDI vertical coordinates reused directly from the semitone grid
- Gap-aware straight segments with a documented 250 ms maximum connection interval
- Out-of-range MIDI omitted without clamping; re-entry starts a new segment
- One cancellable RAF loop with ref-based drawing and frozen Stop behavior
- Responsive clipping, empty-state messaging, and preserved diagnostics/Clear behavior
- No smoothing, keyboard, reference tone, recording, replay, persistence, or backend

## Issue 009 — Pitch-history pause and resume

Implemented on branch `issue-009-pitch-history-pause-resume`.

- Explicit recording/paused history-capture state separate from microphone lifecycle
- Effective timestamp rebasing that excludes accumulated paused wall-clock duration
- Pause-aware ingestion and exact frozen-reference Canvas redraw
- Single RAF cancellation/restart lifecycle with no per-frame React state
- One sparse resume boundary preventing pre/post-pause curve connections
- Independent Clear behavior in recording and paused states
- Accessible Pause/Resume control and live/paused/inactive history status
- Fresh recording state and pause accounting on every successful microphone Start
- No microphone pause, recording, replay, persistence, keyboard, or reference tone

## Issue 010 — Visible-range controls

Implemented on branch `issue-010-visible-range-controls`.

- Typed fixed-span visible range with centralized MIDI 36–84 limits
- C2–C4, C3–C5, and C4–C6 presets derived from shared note utilities
- One-octave shift controls with disabled, non-clamping boundaries
- Independent Reset to the default C3–C5 range
- Shared grid/curve viewport updates without history or audio mutation
- Above/below visible-range status while the live tuner remains unchanged
- Range preserved across Pause, Clear, Stop, and new Start; reset on refresh
- Accessible pressed states, labels, focus behavior, and graph descriptions
- No persistence, auto-follow, zoom, panning, keyboard, or reference tone

## Issue 011 — Vertical reference keyboard

Implemented on branch `issue-011-vertical-reference-keyboard`.

- Typed reference-key model derived from shared sharp-note and A4 = 440 Hz utilities
- Twenty-five high-to-low DOM key buttons for every visible range
- Natural full-width and accidental 66%-width piano geometry
- Exact CSS-grid alignment with the Canvas semitone-center viewport
- Monophonic Pointer Events lifecycle with capture and cancellation cleanup
- Transient pressed state plus persistent in-page selected-note status
- Roving tabindex with Arrow Up/Down, Home/End, Enter, and Space behavior
- Range rebuilding with safe press, selection, and focus handling
- Keyboard remains independent from microphone, detector, history, Pause, and Clear
- No oscillator, AudioContext, sound, recording, target scoring, or backend

## Issue 012 — Reference drone synthesizer

Implemented on branch `issue-012-reference-drone-synthesizer`.

- Continuous monophonic sine drone activated by completed pointer or keyboard gestures
- Persistent selected note separated from transient pressed and active sounding state
- Same-note toggle, different-note frequency ramp, explicit Start/Stop, and protected volume
- Dedicated lazy Web Audio context independent from microphone analysis
- Soft attack, release, note-transition, and volume automation without overlapping voices
- Selection and playback preserved across range, microphone, Pause/Resume, Clear, and Stop changes
- Retryable audio errors, stale-operation protection, and idempotent node/context disposal
- Accessible playback status, sounding-key indication, and headphones recommendation
- No samples, recording, audio upload, backend, target scoring, or new dependency
- Manual inaudible-output follow-up removed optimistic `playing` and confirms a running context, complete graph, started oscillator, and valid gain first
- Typed context/graph/start errors, statechange cleanup, realistic Web Audio mocks, Strict Mode ownership tests, and development diagnostics

## Issue 013 — Sustained-voice tracking continuity

Implemented on branch `issue-013-sustained-voice-continuity`.

- Pure `unvoiced` / `voiced` / `uncertain` transitions at detector cadence
- Inclusive 160 ms grace period and one deferred gap at uncertainty onset
- No duplicated points, candidate promotion, threshold changes, or vibrato smoothing
- Truthful `Briefly uncertain` live state and session-local diagnostics
- Curve, Pause/Resume, Clear, range, keyboard, drone, and microphone cleanup preserved

## Issue 014 — Cents-meter readability

Implemented on branch `issue-014-cents-meter-readability`.

- Responsive 36 rem scale with −50/−25/0/+25/+50 divisions
- Symmetric ±5-cent visual zone and calm Flat/In tune/Sharp language
- Separate raw numeric cents and display-only marker cents
- Time-aware 150 ms smoothing without timers or arrays
- Immediate nearest-note boundary reset instead of a full-meter sweep
- Frozen uncertainty, hidden/reset no-pitch marker, and clean session initialization
- Reduced-motion direct updates and accessible descriptions
- Detector, continuity, history, curve, keyboard, and drone semantics unchanged

## Issue 015 — Target-note comparison and cents guidance

Implemented on branch `issue-015-target-note-guidance`.

- Persistent selected reference MIDI as the target, independent from drone playback
- Exact unbounded target-relative cents from accepted fractional MIDI with no nearest-note wrapping
- Inclusive ±10-cent target tolerance and typed on-target/close/far/different-note bands
- Directionally correct Raise / On target / Lower guidance and meaningful large-distance formatting
- Dedicated ±50 target meter with ±10 zone and explicit off-scale states
- Separate 180 ms marker-only smoothing, uncertainty freeze, no-pitch reset, and reduced-motion bypass
- Target preserved through graph range, microphone, drone, and history transitions
- Semantic target/detected labels, frequencies, direction, distance, uncertainty, and no-pitch text
- No scoring, session tracking, recording, replay, target-follow automation, dependency, history, or Canvas change

## Issue 016 — Basic target-note practice session

Implemented on branch `issue-016-target-note-practice-session`.

- Typed idle/running/paused/completed practice state machine with immutable target lock
- Explicit selected-target and active-microphone Start preconditions
- Previous-observation interval accounting with a centralized 250 ms evidence cap
- Constant-space active, measured, on-target, off-target, uncertain, no-pitch, and unobserved totals
- On-target share using measured voice only, with a null zero-voice result
- Independent practice Pause/Resume, microphone-Stop auto-pause, and explicit restart Resume
- Compact live panel and immutable neutral summary with Practice again
- One 4 Hz display-only timer with cleanup and stale-session protection
- Keyboard activation lock with preserved focus/navigation; optional independent drone
- No recording, replay, persistence, automatic sequence, backend, or new dependency

## Issue 017 — Practice-session timeline and event markers

Implemented on branch `issue-017-practice-session-timeline`.

- Immutable on-target, off-target, uncertain, no-pitch, unobserved, and paused events
- Exact event creation inside the existing practice metric-settlement path
- Full wall-duration proportional positioning with no event-count normalization
- One-pixel display minimum without accounting changes
- Completed-session-only semantic DOM timeline with no Canvas or live loop
- Hover, focus, and mobile-tap tooltips with duration and wall-session percentage
- Screen-reader event descriptions, Start/Finish context, and wrapping state legend
- No recording, replay, scrolling, zoom, editing, export, persistence, scoring, or dependency

## Issue 018 — Prepare and deploy Vocal Tuner to Vercel

Implemented on branch `issue-018-vercel-deployment`.

- Minimal Vercel SPA fallback with GitHub Preview and `main` Production workflow
- Node 22 policy aligned with GitHub Actions and Vercel
- Typed, validated deployment environment and safe Git/version metadata
- Centralized development, Preview, Production, test, and query-feature policy
- Production rejection of fabricated tuner/practice input and public debug switches
- Developer-only compact build metadata and diagnostics
- Production-safe React error boundary with explicit reload
- Valid manifest and local icon without a service worker or offline expansion
- Deterministic deployment validator plus production and test-control WebKit smoke flows
- No Firebase, backend, Function, authentication, analytics, tracking, or new dependency

## Issue 018.1 — Diagnose and fix iOS Safari reference-drone playback

Implemented on branch `issue-018-1-ios-safari-reference-drone`; physical iPhone acceptance remains pending.

- Moved context resume, zero-gain voice connection, and oscillator start into the trusted activation task
- Delayed attack and `playing` until actual running state and rendering-clock advancement
- Standard/prefixed lazy constructor selection with typed unavailable fallback
- Explicit interrupted, closed, unknown, stale-generation, visibility, and foreground-retry handling
- Production-hidden-by-default `audioDiagnostics=1` reference-output lifecycle panel
- Safe report copying with textarea fallback and bounded 40-event local log
- Explicit one-second protected A4 output test independent from selection and practice
- Physical iOS 18.4.1 evidence recorded: running context and advancing clock still produced no audible drone or engine test
- Diagnostic-only pre-destination analyser with 8 Hz constant-memory RMS/peak classification
- Isolated ramped and constant-gain Web Audio tests, generated native-WAV media comparison, and explicit context recreation
- Compact mobile comparison UI with local audibility annotations and expanded plain-text report
- Mobile WebKit deterministic coverage without claiming physical audibility
- No Firebase, backend, recording, analytics, tracking, or new dependency
