# Semitone Grid

Issue 007 replaces the temporary DOM rows with a static Canvas coordinate background. It deliberately draws no pitch history, starts no animation loop, and reads no microphone or detector state.

## Musical coordinates and visible range

The vertical axis uses fractional MIDI because a difference of one always represents one semitone. Frequency in hertz is never mapped directly in the visualization layer. The currently fixed, authoritative default is inclusive MIDI 48–72: C3 through C5. Inclusive bounds produce 25 note bands.

Each integer MIDI note is centered in an equal-height band. The high note is centered in the top band, the low note in the bottom band, and values half a semitone beyond those centers meet the graph edges. For a graph height `H`, semitone height is `H / (high - low + 1)`. Fractional MIDI maps linearly and the inverse Y-to-MIDI function uses the same convention.

The Canvas has a 42 CSS-pixel label gutter, 8-pixel right padding, and 8-pixel top and bottom padding. These values and the graph bounds are part of the validated viewport. The present-time marker defaults to 0.8 of graph width, measured from graph-left rather than total Canvas width. Finite ratios are clamped to 0–1; non-finite ratios invalidate the viewport. Invalid musical bounds never receive fallback notes.

## Rendering hierarchy and labels

Every visible MIDI note receives a horizontal center line. Octave C lines and labels are strongest, other natural notes are medium, and accidentals are subtle and receive a quiet band fill. Note names and octave numbers come from the existing music utilities, preserving sharp-only naming and correct B-to-C octave changes.

All semitones are labeled when a band is at least 12 CSS pixels high. Below that threshold, every line remains but labels reduce deterministically to natural notes. The current minimum responsive height keeps all 25 labels visible in normal mobile and desktop layouts.

Canvas colors intentionally mirror the existing dark CSS palette in one visualization style object. This temporary duplication avoids fragile runtime CSS parsing. Lines are aligned in device pixels according to the rounded physical line width, rather than applying an unconditional half-pixel offset.

## DPR and responsive sizing

CSS size and backing-store size are separate. Backing dimensions are rounded CSS dimensions multiplied by normalized device-pixel ratio. Invalid or sub-1 DPR uses 1, and DPR is capped at 3 to bound mobile memory and fill cost. Drawing resets to the identity transform before clearing, then sets an absolute DPR transform, so repeated redraws cannot compound scaling. Drawing coordinates remain CSS pixels.

The component observes its graph container with `ResizeObserver`. It skips zero or invalid initial dimensions, avoids state changes for identical observations, disconnects on unmount, and falls back to one measurement plus the window resize event when `ResizeObserver` is unavailable. There is no `requestAnimationFrame` loop.

Redraws occur only when CSS size, DPR, MIDI range, or present-time ratio changes. The memoized component receives no live pitch or history props, so detector publications and history additions do not trigger Canvas drawing.

## Accessibility and future curve integration

The graph region is named “Pitch grid from C3 to C5. Live pitch curve is not yet displayed.” Decorative Canvas details are not duplicated as hidden DOM nodes. Current note, frequency, cents, diagnostics, history summary, and Clear remain semantic DOM controls and text. A visible caption also states that the curve is deferred to Issue 008.

Future curve rendering should reuse the validated viewport and `midiToY` mapping, consuming the fractional MIDI already stored in pitch history. Curve paths, gaps, timestamp-to-X mapping, scrolling, automatic range tracking, keyboard, zoom, and physical-device rendering checks remain intentionally out of scope.
