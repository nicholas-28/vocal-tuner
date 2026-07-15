# UX and Interface Principles

## Primary screen

The first usable version should remain a single-screen tool.

### Header

Show:

- nearest note and octave;
- cents deviation;
- current frequency;
- compact centered tuning indicator.

The nearest-note indicator uses the practical readout width, five semantic cents divisions, and a calm ±5-cent center zone. Numeric cents remain raw while marker motion alone is stabilized. Flat, In tune, and Sharp are available as text rather than color alone.

### Main monitor

Show:

- horizontal semitone lines;
- note labels;
- a vertical piano-style reference keyboard;
- scrolling pitch history;
- a clear present-time position.

### Controls

Start with:

- start or stop microphone;
- pause;
- clear;
- visible range;
- settings.

### Target guidance

Selecting a reference key reveals a compact panel near the drone controls. It clearly labels the selected target and detected note, then uses neutral practice wording: Raise the pitch, On target, or Lower the pitch. A dedicated ±50-cent target meter highlights the inclusive ±10 target zone and shows explicit overflow beyond its visual range. Text always retains meaningful unbounded distance, so a different note or octave never appears centered through nearest-note wrapping.

The panel stays useful with the drone stopped and keeps its target through microphone and history controls. Brief uncertainty is subdued and frozen; confirmed no pitch keeps target identity but removes active correction. The panel uses position and words rather than color alone and is not a high-frequency live region.

### Practice session

A second compact panel turns one selected target into an explicit Start, Pause, Resume, Finish, and Practice again flow. Start remains disabled until target selection and microphone activation are both explicit. During the session the target is locked, while reference-drone controls and pitch-history controls remain independent.

Live metrics emphasize measured voice and on-target time without judging silence. The completed summary calls the ratio “On-target share,” reports uncertainty/no-pitch/unobserved context separately, and omits the percentage when no measurable voice exists. Lifecycle changes may be announced politely, but the 4 Hz elapsed display is not a live region.

The completed summary also contains a horizontal wall-time timeline. Its DOM segments distinguish on target, off target, uncertain, no pitch, unobserved, and paused without interpolation or animation. Start/Finish text and a wrapping legend prevent color-only meaning. Hover, keyboard focus, or mobile tap reveals the exact state, duration, and percentage for a segment; each segment exposes the same sentence to assistive technology.

## Visual principles

- Calm, minimal, and readable
- Dark mode can be the initial default
- High contrast without aggressive alarm colors
- Avoid treating natural vibrato as failure
- Use color to show direction and state, not personal judgment
- Preserve enough empty space for the pitch line to remain legible

## Feedback language

Prefer:

- slightly low;
- centered;
- slightly high;
- stable;
- searching;
- no stable pitch.

Avoid:

- wrong;
- bad;
- failed.

## Two future interface modes

### Monitor

Detailed graph for teachers and analytical students.

### Practice

Simplified target-note view with reduced technical information.

## Mobile requirements

- No important control behind browser chrome
- Respect safe-area insets
- Large touch targets
- No accidental page zoom
- Portrait-first
- Landscape should remain usable
- Permission failures must explain the next action
