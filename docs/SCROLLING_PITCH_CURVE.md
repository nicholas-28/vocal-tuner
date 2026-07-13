# Scrolling Pitch Curve

Issue 008 renders the bounded pitch history as a live foreground Canvas over the static semitone-grid Canvas. It consumes immutable accepted pitch and gap points directly; it does not read audio samples, detector candidates, or recompute frequency-to-MIDI conversion.

## Time coordinates and reference time

The horizontal axis uses monotonic detector timestamps. The existing present-time marker remains at 80% of graph width, excluding the label gutter. The historical width is `presentTimeX - graphLeft`, and the authoritative visible duration reuses the history buffer's default 15,000 ms.

```text
pixelsPerMs = historicalWidth / visibleDurationMs
x = presentTimeX - (referenceTimeMs - point.timestampMs) × pixelsPerMs
```

The reference timestamp maps to the present marker, a timestamp one full duration old maps to graph-left, and the region to the marker's right remains empty future space. Older and future points are omitted rather than clamped. Resize changes pixel positions but not timestamp meaning. While history is paused, both detector and RAF source timestamps are rebased by accumulated paused duration as documented in `PITCH_HISTORY_PAUSE_RESUME.md`.

Detector publications use `performance.now()`. While the microphone session is active, the curve RAF timestamp advances the same monotonic reference origin. The latest reference is retained in a ref. Stop, unexpected microphone cleanup, or another inactive state cancels animation and redraws at that frozen reference, so history does not drift left. Clear supplies an empty history immediately without stopping capture. A successful new Start already clears history and begins a fresh RAF session through the existing lifecycle.

## Gap-aware segments

Straight polyline segments are built defensively in stored order; history is never sorted or mutated. A segment breaks for:

- an explicit gap or null MIDI;
- invalid or non-monotonic timestamps;
- non-finite MIDI;
- a time interval above 250 ms;
- a point outside the visible time window;
- a point outside inclusive MIDI 48–72.

The 250 ms maximum tolerates missed publications above the normal approximately 67 ms history cadence while preventing a misleading bridge across a substantial missing interval. Explicit gaps always break regardless of adjacent timing. Re-entry after silence or an out-of-range note begins a new segment. Out-of-range pitch remains available in the DOM tuner readout but is omitted rather than falsely clamped to a graph edge.

Adjacent accepted points are joined with straight lines. Large pitch jumps remain visible when timing and range are valid. Confidence is retained in history but not visually encoded yet. No Bézier interpolation, pitch correction, octave suppression, or visual smoothing is applied, so vibrato and detector errors remain inspectable. An isolated valid point is drawn as a small dot.

## Canvas layering, clipping, and DPR

The graph uses two overlapping Canvases with identical CSS dimensions, backing dimensions, DPR, and validated viewport:

1. the background grid redraws only for size or grid configuration changes;
2. the transparent foreground curve clears and redraws during active animation.

The curve renderer resets its transform before clearing, applies absolute DPR scaling, and clips to graph-left through the present marker and graph-top through graph-bottom. It cannot paint over labels or into the future area. Context state is always restored. The existing DPR normalization, cap of 3, and Canvas sizing utilities are shared by both layers.

## RAF lifecycle and performance

The React hook owns exactly one `requestAnimationFrame` chain while active. The current renderer, history snapshot, and viewport are read through refs; RAF callbacks perform no React state updates. Stop and unmount cancel the pending frame, repeated activation cannot create duplicate loops, and late callbacks are ignored. Background-tab throttling changes frame cadence but not time mapping; when an active tab resumes, points age according to monotonic elapsed time.

At the expected 15 Hz history sampling over 15 seconds, each frame examines only a few hundred points. Rebuilding small segments per frame keeps behavior simple and bounded; caching or spatial indexing is deferred until profiling demonstrates a need. The static grid is not redrawn at curve cadence.

## Resize, accessibility, and empty state

Both layers are resized from the same `ResizeObserver` result and redraw against the same viewport, preserving line/grid alignment. The graph is named “Live pitch history from C3 to C5 over the last 15 seconds.” Current note, frequency, cents, detector diagnostics, and pitch/gap summary remain real DOM content; no hidden node is created per history point.

With no accepted pitch, the caption prompts the user to start the microphone or sing a sustained note. The caption disappears after accepted pitch history exists and returns immediately after Clear.

Changing the visible range creates a shared grid/curve viewport and redraws retained points against the new MIDI bounds. Out-of-range points remain stored but are omitted and break segments; selecting a range that contains them reveals them again. Active range changes update the current draw callback without duplicating RAF. Paused changes redraw once at the frozen reference without starting RAF.

## Known limitations and extension path

The range remains fixed to C3–C5. Lines are intentionally straight and unsmoothed; raw vibrato and detector octave errors remain visible. There is no pause, keyboard, reference tone, recording, replay, zoom, or persisted history. Mobile background scheduling and Canvas performance still require physical-device verification.

Future smoothing can transform a separate rendered-pitch representation before segment construction without changing raw history. Recording or replay can provide an explicit playback reference time to the same renderer without changing MIDI or timestamp coordinate utilities.
