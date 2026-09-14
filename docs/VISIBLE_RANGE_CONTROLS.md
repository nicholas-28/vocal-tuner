# Visible pitch range controls

The [visualization polish milestone](PITCH_VISUALIZATION_POLISH.md) replaces the fixed-preset UI with 1/2/3-octave span selection, explicit voice centering, and a compact Position disclosure for choosing a center note or resetting to C3–C5. Zoom preserves the visible midpoint and clamps complete spans within C2–C6. Existing preset/shift utilities remain available internally.

Keyboard labels and both Canvas layers share the same inclusive integer bounds and exact equal semitone geometry. Changing the view never changes pitch history, selected reference, sounding drone, or Practice evidence. Time-window and height choices are separate presentation state; automatic following and gestures are deferred.

All new viewport buttons/selects have at least 44-pixel targets. Tests cover span sizes, clamping, explicit centering/reset, out-of-range voice hints, and narrow mobile layout. The main milestone document includes performance results and physical acceptance.
