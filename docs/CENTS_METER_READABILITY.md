# Centered tension tuner

## Audit and interaction

The primary readout previously asked the singer to follow a circular marker on a ±50-cent track. It already had useful signed raw cents, frequency, nearest-note naming, continuity labels, and display-only smoothing. Those remain; a tapered ribbon replaces the moving marker and rounded track. The quiet horizontal guide, fixed center line, and shaded ±5-cent zone give the eye a stable reference.

Flat extends left from center; sharp extends right. The ribbon contracts in both length and thickness through zero, then grows on the other side. There is no minimum displacement or dead zone. In-tune input gives the fixed center a calm mint accent without a pulse. Warm sand on the left and lavender on the right reinforce direction, while position, arrow labels, and Flat/In tune/Sharp text communicate it without color. Frequency and signed cents remain secondary to the note and spatial feedback.

The center explicitly means the **nearest note**, not the separately selected reference target. Reference playback and selection do not retarget this visual. The historical scrolling graph still answers “what happened through time”; selected-target guidance and practice keep their existing measurement, tolerance, smoothing, and scoring behavior.

## Scale and clamping

Raw cents remain `(fractionalMidi - nearestMidi) * 100` using A4 = 440 Hz and `Math.round` nearest-note selection. The useful nearest-note interval is −50 to +50 cents: beyond a half-semitone, a different note becomes nearest. Expanding the numeric scale would waste space and reduce precision. Instead, the primary meter now fills available readout width up to **44 rem**, previously 36 rem, without expanding the page or sacrificing iPhone safe-area padding.

Mapping is linear: zero is always 50% of the track, and each cent spans 1% of track width. −50/−25/0/+25/+50 labels preserve scale. The inclusive ±5-cent shaded region is visual guidance only, unchanged from the previous meter; it creates no score or target metric. Small displacements remain visible inside it.

`getCentsTensionGeometry` bounds the ribbon endpoint to the track and generates a tapered path in a 100 × 48 viewBox. Nonfinite/null values produce no geometry. Defensive out-of-range input clamps the visual and accessible numeric range, while the accessible sentence retains the actual raw cents and says it exceeds the scale. Visible classification also says “beyond scale.” Normal nearest-note conversion already stays within the range; a continuous slide past a nearest-note boundary updates the note label and resets the display to that new note's cents.

## Rendering and data ownership

This SVG/DOM presentation reuses the existing React publication path (up to approximately 15 Hz) and `useSmoothedCentsDisplay`. Continuity supplies accepted measurements or explicitly held uncertain observations. No new RAF loop, timer, dependency, audio work, or high-frequency React state path is added.

PitchSource was considered: its direct current-frame contract requires voiced/accepted and consumer-clock freshness checks, and does not supply the same held continuity presentation. A 60 Hz loop has no demonstrated benefit for this small ribbon, so the visual does not subscribe to PitchSource or create another pitch truth. PitchSource's API, detector cadence, and freshness contract remain unchanged. Current microphone/continuity lifecycle continues to own invalidation.

Raw cents drive numeric text and classification. Smoothed cents drive only ribbon geometry. They never feed detection, continuity, history, diagnostics, drone state, or practice scoring. A ribbon may briefly lag a raw classification during a change of direction; its position and directional color follow the same smoothed geometry.

## Motion and continuity

Existing time-aware exponential smoothing is reused unchanged:

`alpha = 1 - exp(-deltaTimeMs / 150 ms)`

`display = previousDisplay + alpha * (raw - previousDisplay)`

The first value initializes directly. A sustained step moves about 86% in 300 ms and 95% in 450 ms without overshoot. Nearest-MIDI changes reset immediately, preventing a false sweep from about +49 to −49. There is no additional CSS movement transition, spring, or idle animation layered over smoothing.

- **Voiced:** update raw text/classification and smoothed geometry. Invalid/absent observations cannot expose leftover geometry or an in-tune accent.
- **Uncertain:** hold the previous geometry, dim it, add a dashed outline, and retain explicit “briefly uncertain”/“last measured” text. Do not synthesize a displacement if mounted without a previous accepted display value. The readout retains its existing last-measured age label.
- **Unvoiced:** immediately hide the ribbon, clear classification, and reset smoothing. The neutral center guide stays; it does not mean an in-tune observation. Never animate silence toward zero.

Start, Stop, and unexpected cleanup retain existing continuity behavior. History Pause/Clear remain independent.

## Accessibility and mobile

The existing named meter, signed raw numeric readout, and accessible sentence remain. `aria-valuenow` is bounded to the declared range and omitted for unavailable/invalid pitch. No high-frequency live announcement or new focus target is introduced. SVG decoration is hidden from assistive technology; visible direction labels use arrows and words. Existing touch and keyboard controls are unchanged.

`prefers-reduced-motion: reduce` uses direct accepted updates through the same existing hook. There are no CSS motion transitions or continuous animations. Responsive width, internal edge padding, and fixed center positioning are checked at 320, 390, and 768 CSS pixels in mobile WebKit; narrow layouts retain labels without horizontal overflow.

## Physical iPhone acceptance

Automated geometry and browser checks cannot establish musical feel. On a physical iPhone, evaluate:

- Readability of the ribbon, note, direction words, and cents at a normal singing distance.
- Jitter on a steady vowel and natural vibrato.
- Perceived latency when correcting a pitch, including the existing 150 ms smoothing.
- Center stability while singing, rotating the phone, and resizing the viewport.
- Immediate flat/left and sharp/right comprehension without relying on color.
- Whether the ±50-cent scale and ±5-cent center region give enough usable precision.
- A continuous slide from flat through center to sharp, then across a nearest-note boundary; confirm there is no false sweep through center at the boundary.
- A breath/pause and brief noisy interruption: held uncertainty must look different from active input, and silence must not look in tune.
- Reduced Motion enabled: direct feedback remains usable without interpolation.

Perceived calmness, low-amplitude ribbon visibility, latency, VoiceOver usability, and device-specific browser rendering still require physical acceptance. The existing nearest-note boundary reset and display/raw lag are deliberate, unchanged musical semantics.
