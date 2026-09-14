# Centered tension tuner

## Audit and interaction

The primary readout previously asked the singer to follow a circular marker on a ±50-cent track. It already had useful signed raw cents, frequency, nearest-note naming, continuity labels, and display-only smoothing. Those remain; a tapered ribbon replaces the moving marker and rounded track. The quiet horizontal guide, fixed center line, shaded ±10-cent in-tune zone, and inner ±5-cent center zone give the eye a stable reference.

Flat extends left from center; sharp extends right. The ribbon contracts in both length and thickness through zero, then grows on the other side. There is no minimum displacement or dead zone. In-tune input gives the fixed center a calm mint accent without a pulse. Warm sand on the left and lavender on the right reinforce direction, while position, arrow labels, and Dead center/In tune/Close/Flat/Sharp text communicate it without color. Frequency and signed cents remain secondary to the note and spatial feedback.

The center explicitly means the **nearest note**, not the separately selected reference target. Reference playback and selection do not retarget this visual. The historical scrolling graph still answers “what happened through time”; selected-target guidance and practice keep their existing measurement, tolerance and scoring behavior. Target smoothing now shares the response model described below.

## Scale and clamping

Raw cents remain `(fractionalMidi - nearestMidi) * 100` using A4 = 440 Hz and `Math.round` nearest-note selection. The useful nearest-note interval is −50 to +50 cents: beyond a half-semitone, a different note becomes nearest. Expanding the numeric scale would waste space and reduce precision. Instead, the primary meter now fills available readout width up to **44 rem**, previously 36 rem, without expanding the page or sacrificing iPhone safe-area padding.

Mapping is linear: zero is always 50% of the track, and each cent spans 1% of track width. −50/−25/0/+25/+50 labels preserve scale. The shared calibration now uses inclusive ±5 cents for dead center, ±10 for in tune, and ±25 for close. These feedback bands create no exercise score. See [calibration and performance baseline](PITCH_CALIBRATION_PERFORMANCE.md) for the policy and evidence. Small displacements remain visible inside it.

`getCentsTensionGeometry` bounds the ribbon endpoint to the track and generates a tapered path in a 100 × 48 viewBox. Nonfinite/null values produce no geometry. Defensive out-of-range input clamps the visual and accessible numeric range, while the accessible sentence retains the actual raw cents and says it exceeds the scale. Visible classification also says “beyond scale.” Normal nearest-note conversion already stays within the range; a continuous slide past a nearest-note boundary updates the note label and resets the display to that new note's cents.

## Rendering and data ownership

The primary SVG ribbon now reads fresh accepted PitchSource evidence and animates geometry directly on RAF, without per-frame React state. Raw text and accessible measurements retain the approximately 15 Hz presentation path. The prop-driven demo continues using `useSmoothedCentsDisplay`. See [realtime response polish](REALTIME_PITCH_RESPONSE.md) for the source decision, cadence audit and bounded diagnostics.

Numeric cents remain raw. Categorical feedback uses centralized 2-cent hysteresis around the unchanged 5/10/25-cent calibration bands. Smoothed cents drive only geometry and never feed detection, continuity, history or Practice.

## Motion and continuity

The shared response integrates a 25 ms exponential while display error exceeds 3 cents, then 65 ms for the final small displacement. First evidence and nearest-note changes reset immediately; reduced motion uses direct raw values. A synthetic 30-cent correction is within 2 cents after 100 ms. No CSS movement transition, spring or prediction is added.

- **Voiced:** fresh accepted source observations drive the ribbon; text remains on the presentation path.
- **Uncertain:** the live ribbon disappears. Existing text can retain an explicitly uncertain last measurement; it never becomes fresh marker evidence. The demo retains its explicit held presentation.
- **Silence/unvoiced/stale:** hide geometry and reset smoothing. RMS silence also clears tuner text and target guidance at the next UI publication. The neutral center guide does not indicate an in-tune observation.

Core continuity/history/Practice grace remains unchanged; the silence distinction is presentation-only. Stop and failed capture invalidate the source and cancel live animation. History Pause/Clear remain independent.

## Accessibility and mobile

The existing named meter, signed raw numeric readout, and accessible sentence remain. `aria-valuenow` is bounded to the declared range and omitted for unavailable/invalid pitch. No high-frequency live announcement or new focus target is introduced. SVG decoration is hidden from assistive technology; visible direction labels use arrows and words. Existing touch and keyboard controls are unchanged.

`prefers-reduced-motion: reduce` uses direct accepted updates through the same existing hook. There are no CSS movement transitions; live RAF interpolation is bypassed in reduced-motion mode. Responsive width, internal edge padding, and fixed center positioning are checked at 320, 390, and 768 CSS pixels in mobile WebKit; narrow layouts retain labels without horizontal overflow.

## Physical iPhone acceptance

Automated geometry and browser checks cannot establish musical feel. On a physical iPhone, evaluate:

- Readability of the ribbon, note, direction words, and cents at a normal singing distance.
- Jitter on a steady vowel and natural vibrato.
- Perceived latency when correcting a pitch, using the new adaptive presentation response.
- Center stability while singing, rotating the phone, and resizing the viewport.
- Immediate flat/left and sharp/right comprehension without relying on color.
- Whether the ±50-cent scale and ±5-cent center region give enough usable precision.
- A continuous slide from flat through center to sharp, then across a nearest-note boundary; confirm there is no false sweep through center at the boundary.
- A breath/pause and brief noisy interruption: held uncertainty must look different from active input, and silence must not look in tune.
- Reduced Motion enabled: direct feedback remains usable without interpolation.

Perceived calmness, low-amplitude ribbon visibility, latency, VoiceOver usability, and device-specific browser rendering still require physical acceptance. The nearest-note boundary reset remains deliberate; the response milestone reduces display/raw lag. Use the full [before/after iPhone checklist](REALTIME_PITCH_RESPONSE.md#physical-iphone-acceptance-compare-before--after).
