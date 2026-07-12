# Architecture Decision Log

## ADR-001 — Start as a web application

Status: accepted

The first version will be a mobile-first web application rather than a native App Store application.

Reasons:

- fastest path to testing;
- accessible through one link;
- avoids store availability problems;
- simpler deployment;
- sufficient browser audio capabilities for technical validation.

Revisit when browser limitations materially block the product.

## ADR-002 — No backend for MVP

Status: accepted

Pitch analysis and reference tones will run locally.

Reasons:

- privacy;
- lower complexity;
- no account requirement;
- no infrastructure cost;
- lower latency.

## ADR-003 — Canvas for the pitch monitor

Status: accepted

The scrolling pitch history will use Canvas rather than one DOM element per point.

Reasons:

- high update rate;
- efficient custom rendering;
- predictable mobile performance;
- easier timeline scrolling.

## ADR-004 — Fractional MIDI for graph coordinates

Status: accepted

Pitch will be represented as fractional MIDI values for visualization.

Reasons:

- equal spacing for semitones;
- direct mapping to note names and cents;
- simpler vertical layout.

## ADR-005 — Separate raw, filtered, and rendered pitch

Status: accepted

The system will retain conceptual separation between detector output, musical filtering, and visual smoothing.

Reasons:

- easier debugging;
- less misleading display behavior;
- future analytics;
- safer tuning of the UI.

## ADR-006 — Direct browser microphone lifecycle

Status: accepted

Microphone capture uses `navigator.mediaDevices.getUserMedia` directly. The application first requests mono audio with echo cancellation, noise suppression, and automatic gain control disabled. If a browser rejects those optional constraints as over-constrained, it retries once with `{ audio: true, video: false }`.

The React hook owns lifecycle coordination while dedicated modules own capture and level monitoring. Active streams, track listeners, animation frames, audio nodes, and the level-monitoring `AudioContext` are released through one idempotent cleanup path. No audio samples are stored, recorded, logged, or uploaded.

## ADR-007 — Local YIN detector for the technical spike

Status: accepted provisionally

The first monophonic detector is a local TypeScript implementation of YIN. It uses the microphone lifecycle's existing stream and a shared `AnalyserNode` graph for both RMS level and pitch analysis, avoiding another stream or `AudioContext`. No third-party detector dependency or license obligation is introduced.

YIN was selected for its direct fundamental-period estimate, normalized confidence signal, small bundle impact, and testability with generated signals. McLeod Pitch Method was considered but deferred because its normalized square-difference and peak-selection path adds complexity without clear evidence of better results for this first browser spike. The decision must be revisited after real-device and varied-voice testing.

## ADR-008 — Separate raw YIN candidates from application acceptance

Status: accepted

YIN now always exposes the best raw candidate and CMND evidence before application filtering. The prior implementation calculated confidence only after crossing a strict CMND threshold, so plausible harmonic candidates that missed that threshold appeared as 0% confidence and their rejection stage was invisible.

Detector samples have their buffer mean removed to tolerate DC offset, while RMS remains measured from the untouched input. Amplitude normalization and Hann windowing are intentionally omitted: YIN is amplitude-scale invariant, normalization could promote quiet noise, and an amplitude window distorts time-domain period comparisons. Provisional defaults are RMS 0.005, YIN CMND 0.35, and confidence 0.70. A narrowly scoped candidate rule prefers a full-period minimum over a half-period harmonic only when it is approximately twice the lag and materially stronger.
