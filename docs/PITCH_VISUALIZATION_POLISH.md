# Pitch visualization and graph polish

## Audit: data, viewport, rendering

The existing history path receives the nominal 15 Hz presentation subset of 30 Hz detector observations. `appendPitchHistory` retains immutable fractional-MIDI/frequency/confidence points, throttles nearby pitch points to roughly 15 Hz, keeps meaningful jumps, and inserts sparse confirmed gaps. Its elapsed gate can discard very closely spaced publications (including floating-point near-boundary intervals). Continuity holds add no point; a recovered short rejection can therefore look like a longer interval between otherwise adjacent pitch samples. The legacy trim function retains a cutoff boundary copy. None of these stored-history rules are changed here.

Before this milestone, storage and view both defaulted to 15 seconds; the viewport was an inclusive 24-semitone span, controlled by three fixed presets and three action buttons. The page's 48-rem container, nested padding, 56-pixel keyboard column, and unused 20% of the graph beyond “now” constrained the usable trace width. Canvas already used floating-point fractional MIDI, round joins/caps, and DPR-aware backing sizes. It did not quantize pitch to note rows.

Three independent responsibilities now remain explicit:

1. **Data:** existing immutable pitch history, configured by App to retain 30 seconds. A separate bounded rejection-timestamp buffer marks rendering breaks; it cannot alter pitch history, continuity, PitchSource, or Practice.
2. **Viewport:** vertical range plus 5/15/30-second viewing window and normal/tall sizing. View changes never clear, append, retimestamp, or smooth stored history.
3. **Rendering:** Canvas clipping, equal semitone geometry, optional target guide, and smooth/straight presentation interpolation.

## Why lines can look jagged

- Real attacks, glides, interval jumps, vibrato, and detector errors can all make angular traces. These must not be flattened away.
- Nominal 15 Hz history has only three observations per 5 Hz vibrato cycle, sometimes fewer after history throttling. A smoother path cannot reconstruct missing vocal detail.
- Genuine silence/uncertainty causes breaks. Old short continuity holds could be connected because no explicit gap was stored.
- On a narrow 15/30-second view, multiple observations occupy nearby pixels. Aliasing and straight polyline corners make motion look harsher. More width and the 5-second view help without changing evidence.
- Canvas already anti-aliases the trace; pitch coordinates were not rounded. The grid alone snaps stroke coordinates for crisp lines. DPR and resize alignment are retained.

## Viewport and controls

**Pitch span** selects 1, 2, or 3 octaves (12/24/36 semitones, with 13/25/37 inclusive note rows). Zoom preserves the visible midpoint and clamps the complete span within the existing C2–C6 graph domain. **Center my voice** explicitly centers the currently voiced presentation pitch; it is disabled without voiced input. Under **Position**, a note selector permits inspection without live input and **Reset graph range** restores C3–C5. Center requests near limits clamp without shrinking the span. Reference target and sounding drone remain selected even when outside the view.

**Time window** selects 5, 15 (default), or 30 seconds, using the same effective history clock. Pause retains the same reference time while zoom, time, line style and height remain adjustable. **Taller graph** expands the optional viewing height. Live input is never vertically auto-followed; explicit centering keeps the coordinate system stable during practice and inspection.

The monitor can use up to 76 rem without widening the rest of the page. Its padding and keyboard column are reduced; “now” moves from 80% to 96% of plotting width. Default height is at least 384 px, with at least 12 px per note row at the widest pitch span; the taller option starts at 576 px. Both Canvas layers and keyboard share exact padding and semitone geometry. Range/time controls use native selects and buttons with at least 44 px targets. Detailed history counters and secondary controls live in disclosures. There is no gesture system or persistence.

## Interpolation and gap policy

The default smooth trace uses a shape-preserving cubic through every valid displayed sample. Weighted harmonic tangents vanish at reversals; each Bezier control stays inside its two endpoints' pitch interval. The convex-hull bound prevents invented overshoot. Straight glides remain straight; sample extrema and jumps remain present. This is an estimate between measurements, not additional evidence. **Line & guides → Straight through samples** allows direct comparison. No samples are simplified away and no visual values feed analysis or scoring.

Both styles use exactly the same segmentation. Explicit history gaps, invalid/non-forward points, out-of-range points, intervals over the existing 250 ms maximum, and observed rejected-input timestamps all break paths. An isolated sample is a dot. Neither style extends the newest point to “now” or splines through missing evidence. Time/range filtering happens on read and preserves the original retained objects.

The render-only rejection buffer observes every computed analysis callback, including rejections between UI publications. App maps timestamps through the existing effective history clock and ignores capture while paused. It uses a 1,024-entry Float64 ring (8 KiB), trims to 30 seconds, resets at Start/Clear, and retains breaks with history after Stop. Queries use binary search. Unexpected capacity exhaustion fails closed for older intervals. Collection schedules no React state. History's existing confirmed-gap count deliberately excludes these extra visual breaks.

A subtle dashed selected-target line is enabled by default and can be hidden. It shares `midiToY` with the grid/keyboard, appears only within the view, and cannot indicate current voice evidence. No current-pitch overlay or cents tolerance bands were added; the centered tuner remains the instantaneous display.

## Retention and performance evidence

Before extending App retention, `node scripts/graph-render-benchmark.mjs` measured real Canvas command submission in local desktop WebKit. Because its timer resolves to about 1 ms, each result is a distribution of **40 batch averages, 50 renders per batch**, after warm-up. These are not per-frame tail-latency, GPU rasterization, or physical iPhone measurements. Browser scheduling can affect the batch tail.

At 15 Hz, 30 seconds contains approximately 451 points versus 226 at 15 seconds. The synthetic JSON representation grew from 24,581 to 48,960 bytes; this is a metadata-size proxy, not JavaScript heap usage. Existing immutable-array storage remains sufficient at this scale. The utility history default remains 15 seconds for existing callers; App explicitly selects 30 seconds independently of the default 15-second viewport.

| Canvas CSS size / DPR | History            | Points | Before median / p95 ms | After median / p95 ms |
| --------------------- | ------------------ | ------ | ---------------------- | --------------------- |
| 250 × 480 / 3         | 5 s                | 76     | <0.02 / 0.02           | 0.02 / 0.02           |
| 250 × 480 / 3         | 15 s               | 226    | 0.02 / 0.02            | 0.04 / 0.04           |
| 250 × 480 / 3         | 30 s               | 451    | 0.04 / 0.04            | 0.08 / 0.12           |
| 1100 × 720 / 2        | 15 s               | 226    | 0.02 / 0.02            | 0.08 / 1.20           |
| 1100 × 720 / 2        | 30 s               | 451    | 0.04 / 0.04            | 0.06 / 0.38           |
| 250 × 480 / 3         | 30 Hz stress, 30 s | 901    | —                      | 0.12 / 0.14           |
| 1100 × 720 / 2        | 30 Hz stress, 30 s | 901    | —                      | 0.12 / 0.12           |

Complete numerical results are in [graph-rendering.csv](benchmarks/graph-rendering.csv). A zero in the raw CSV is below batch timer resolution, not zero work. The new interpolation adds bounded linear work; it does not add a render loop or dependency. Existing RAF handles scrolling without per-frame React updates. The background grid/target redraw on viewport or guide changes, not on every sample. Canvas sizing avoids resetting unchanged backing dimensions, which preserves paused traces when toggling guides.

Canvas memory scales with CSS dimensions × DPR², independent of history duration; only the existing two layers are used. DPR remains capped at 3. Broad/tall views and browser main-thread contention still need device evaluation. No claim of improved detection resolution or lower audio latency is made.

## Physical acceptance checklist

Compare with the accepted response milestone on the same iPhone:

1. Sustain one tone; confirm trace height matches the keyboard and heard note.
2. Sing natural/larger vibrato; compare Smooth and Straight and avoid treating interpolation as additional samples.
3. Glissando slowly; check smooth movement without invented extrema.
4. Jump quickly between notes; confirm both levels remain evident.
5. Stop abruptly and add a short breathy/consonant interruption; confirm visible gaps with no connecting curve.
6. Use 5 s with one octave and Center my voice to inspect an attack/vibrato.
7. Use 15/30 s to inspect a full phrase; pause and change views without losing the captured phrase.
8. Try span, Position, Reset and Taller graph in portrait/landscape at narrow widths; keyboard, grid and target guide must stay aligned.
9. Compare the trace with what you hear and feel. If smoother appearance suggests motion you did not sing, compare the straight view and report the phrase/view settings.

Deferred: automatic vertical following, gesture pan/zoom, horizontal history scrubbing, current-pitch/tolerance overlays, sample-density optimization, and changing the existing history sampling gate. Any later sampling change needs its own evidence audit; this milestone preserves stored-history semantics and does not change YIN, calibration, PitchSource, microphone lifecycle, Practice scoring, or reference-drone behavior.
