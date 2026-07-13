# Semitone Grid

Issue 007 replaced the temporary DOM rows with a static Canvas coordinate background. Issue 008 adds pitch history on a separate foreground Canvas, so the grid itself still starts no animation loop and reads no microphone or detector state.

## Musical coordinates and visible range

The vertical axis uses fractional MIDI because a difference of one always represents one semitone. Frequency in hertz is never mapped directly in the visualization layer. The authoritative default is inclusive MIDI 48–72: C3 through C5. Issue 010 adds fixed-span C2–C4, C3–C5, and C4–C6 selection within global MIDI 36–84 limits. Every supported range contains 25 note bands.

Each integer MIDI note is centered in an equal-height band. The high note is centered in the top band, the low note in the bottom band, and values half a semitone beyond those centers meet the graph edges. For a graph height `H`, semitone height is `H / (high - low + 1)`. Fractional MIDI maps linearly and the inverse Y-to-MIDI function uses the same convention.

Issue 011 replaces the 42 CSS-pixel Canvas label gutter with a 56-pixel DOM reference-keyboard column beside the Canvas. Canvas graph-left is now its own left edge, preserving more horizontal curve space. The Canvas retains 8-pixel right padding and authoritative 8-pixel top and bottom padding. The keyboard consumes those same vertical padding values, with one equal CSS-grid row per visible note, so each key center exactly matches `midiToY`. The present-time marker defaults to 0.8 of graph width. Finite ratios are clamped to 0–1; non-finite ratios invalidate the viewport.

## Rendering hierarchy and labels

Every visible MIDI note receives a horizontal center line. Octave C lines are strongest, other natural notes are medium, and accidentals are subtle and receive a quiet band fill. Note names and octave numbers come from the existing music utilities, preserving sharp-only naming and correct B-to-C octave changes. The DOM keyboard is now the primary visible note-label system, avoiding a duplicate Canvas label column.

The prior Canvas label-density policy remains available to the renderer for nonzero label gutters, but the production layout uses no Canvas labels. All 25 keyboard buttons retain labels at every supported size.

Canvas colors intentionally mirror the existing dark CSS palette in one visualization style object. This temporary duplication avoids fragile runtime CSS parsing. Lines are aligned in device pixels according to the rounded physical line width, rather than applying an unconditional half-pixel offset.

## DPR and responsive sizing

CSS size and backing-store size are separate. Backing dimensions are rounded CSS dimensions multiplied by normalized device-pixel ratio. Invalid or sub-1 DPR uses 1, and DPR is capped at 3 to bound mobile memory and fill cost. Drawing resets to the identity transform before clearing, then sets an absolute DPR transform, so repeated redraws cannot compound scaling. Drawing coordinates remain CSS pixels.

The component observes its graph container with `ResizeObserver`. It skips zero or invalid initial dimensions, avoids state changes for identical observations, disconnects on unmount, and falls back to one measurement plus the window resize event when `ResizeObserver` is unavailable. There is no `requestAnimationFrame` loop.

Grid redraws occur only when CSS size, DPR, selected MIDI range, or present-time ratio changes. Detector publications and history additions redraw only the separate foreground curve layer.

## Accessibility and future curve integration

The graph region names the selected low/high notes and duration. Decorative Canvas details are not duplicated as hidden DOM nodes. The keyboard is a separately labeled semantic DOM group. Current note, frequency, cents, diagnostics, history summary, range controls, and Clear remain semantic DOM controls and text.

The curve renderer reuses the validated viewport and `midiToY` mapping, consuming fractional MIDI already stored in pitch history. Automatic range tracking, zoom, and physical-device rendering checks remain intentionally out of scope.
