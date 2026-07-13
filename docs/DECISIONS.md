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

## ADR-009 — Equal-temperament musical pitch conversion

Status: accepted

Accepted detector frequencies convert through a browser-independent twelve-tone equal-temperament layer. A4 defaults to 440 Hz, with a validated future configuration range of 400–480 Hz. MIDI numbering follows C4 = 60 and A4 = 69, and internal/display names use sharps only.

Nearest-note selection uses `Math.round`, so exact half steps select the higher integer. Musical pitch remains separate from raw detector results and contains no history, smoothing, or scoring. Only detector results accepted as `detected` are converted; rejected raw candidates remain diagnostic data.

## ADR-010 — Timestamped bounded pitch history

Status: accepted

Pitch history stores immutable accepted musical points using monotonic detector timestamps and fractional MIDI. Rejected or silent input creates sparse null gap points, preventing a future renderer from connecting through unpitched intervals. Regular pitch sampling is capped at 15 points per second, while gap transitions and changes of at least 0.5 semitone are preserved immediately.

History retains 15 seconds by default, with validated 5–60 second configuration. Trimming uses timestamp cutoffs and an optional cutoff boundary point, keeping normal memory near 225 points. A successful microphone Start clears and activates a fresh in-memory session; Stop freezes it; Clear empties it without affecting capture or the current note. No persistence, timer, rendering state, or backend is introduced.

## ADR-011 — Validated semitone-center Canvas viewport

Status: accepted

The pitch monitor grid uses a typed, validated Canvas viewport with an inclusive fixed C3–C5 range. Each integer MIDI note occupies the center of one equal-height band, so fractional MIDI maps continuously and half-semitone boundaries meet the graph edges. A graph-relative present marker defaults to 80% of graph width.

Canvas CSS and backing-store sizes remain separate, with device-pixel ratio normalized to 1–3. Rendering resets the transform before clearing and applies an absolute DPR transform. A configuration-only, React-free renderer draws the grid after observed size or configuration changes; it does not receive history, detector state, or create an animation loop. Note labels reuse the shared music conversion utilities.

## ADR-012 — Layered timestamp-driven pitch curve

Status: accepted

Live pitch history uses a transparent foreground Canvas over the static grid Canvas. Both layers share the validated viewport, backing dimensions, DPR, and fractional-MIDI mapping. This keeps the grid out of the animation cadence while allowing the curve layer to clear independently.

The 15-second historical interval spans graph-left to the existing present marker. Active rendering advances with monotonic RAF timestamps compatible with detector `performance.now()` timestamps; Stop freezes the last render reference. Straight segments break at explicit gaps, invalid data, non-monotonic time, intervals over 250 ms, and points outside the fixed time or MIDI range. The React layer owns one cancellable RAF chain and performs no per-frame state update.

## ADR-013 — Rebased history-only pause time

Status: accepted

Pitch-history capture uses explicit `recording` and `paused` states independent from microphone lifecycle. Pause blocks only history ingestion and curve RAF; audio analysis and live tuner state continue. Effective history and render timestamps subtract accumulated paused monotonic duration, so paused wall-clock time neither ages retained history nor shifts the curve after Resume.

Resume arms one sparse gap boundary before the next accepted pitch when retained history exists, preventing connection across the capture break. Clear preserves capture state and pause accounting. Stop resets pause accounting for the next successful microphone session without rewriting retained timestamps.

## ADR-014 — Visualization-only fixed-span graph range

Status: accepted

The graph range is an App-level visualization preference independent from microphone, detector, musical conversion, and history storage. It uses an inclusive fixed 24-semitone span within MIDI 36–84, with C2–C4, C3–C5, and C4–C6 presets. C3–C5 remains the default. Octave shifts move both bounds by 12 and reject boundary overflow without clamping.

Grid and curve layers consume the same validated range. Out-of-range curve points are omitted and break segments but remain unchanged in retained history and live tuner output. The selection survives in-page history and microphone operations but intentionally resets on refresh; no localStorage is introduced without demonstrated persistence need.

## ADR-015 — DOM reference keyboard on the shared semitone viewport

Status: accepted

The vertical reference keyboard uses semantic DOM buttons beside the layered Canvas graph. It replaces the Canvas note-label gutter and consumes the same inclusive visible MIDI range. One CSS-grid row represents each semitone, and shared top/bottom padding makes every key center equal to the existing Canvas semitone-center mapping without per-key measurement.

Interaction is monophonic. A press creates transient pressed state and persistent in-page selection; release clears only the pressed state. Pointer cancellation, lost capture, blur, unmount, and range changes clean up safely. Roving tabindex provides semitone arrow navigation. Selection is independent from microphone and history state and clears when it leaves the visible range. No Web Audio object or sound is introduced until Issue 012.
