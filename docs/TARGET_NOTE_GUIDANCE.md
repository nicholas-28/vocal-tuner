# Target note guidance

## Target ownership

The persistent `selectedMidi` from the reference keyboard is the target. It is an exact integer MIDI note with a sharp-only label and an equal-tempered frequency derived from the existing A4 = 440 Hz utility. Drone playback is separate: a stopped, suspended, unavailable, or failed drone does not disable guidance. There is currently no selection-clear control, so selection lasts for the page session and may remain outside the visible graph range.

## Two cents meanings

Nearest-note cents and target-relative cents are intentionally separate.

- Nearest-note cents compare accepted fractional MIDI with its rounded nearest MIDI note and remain approximately within ±50. They continue to drive the primary Flat / In tune / Sharp readout and its ±5 visual zone.
- `targetRelativeCents` compare the same accepted fractional MIDI with the explicitly selected target MIDI. They are unbounded and never wrap at a nearest-note boundary.

The target calculation is:

`targetRelativeCents = (detectedFractionalMidi - targetMidi) × 100`

Thus A#4 against A4 is +100 cents, G#4 against A4 is −100 cents, and A5 against A4 is +1200 cents. The raw value is neither clamped nor smoothed.

## Direction, tolerance, and distance

The centralized target tolerance is inclusive ±10 cents:

- less than −10: below target, “Raise the pitch”;
- −10 through +10: “On target”;
- greater than +10: above target, “Lower the pitch”.

Distance bands are `on-target` at |cents| ≤ 10, `close` at 10 < |cents| ≤ 35, `far` at 35 < |cents| < 100, and `different-note` at |cents| ≥ 100. Separately, |cents| < 50 is the target-note neighborhood; at 50 cents or more the pitch is at least as close to a neighboring equal-tempered note.

## Meter and formatting

The compact target meter visualizes only −50 through +50 target-relative cents, with an inclusive ±10 target zone. Values beyond that visual range pin at an edge and expose an explicit left or right overflow indicator. Exact raw target distance remains available in DOM data and accessible text, so clamping never implies that a 700-cent difference is only 50 cents.

Distances below 100 cents use one decimal cent. Larger distances are decomposed into whole octaves, semitones, and a one-decimal residual, with singular/plural handling. Exact target and all values inside tolerance read “Within 10 cents of [target].”

## Continuity and target changes

Only accepted musical pitch enters comparison. During `voiced`, guidance updates from accepted fractional MIDI. During brief `uncertain`, the last accepted comparison and marker are frozen and visually de-emphasized; rejected candidates are never used. Confirmed `unvoiced` keeps the target visible, removes the active instruction and meter, and resets marker presentation.

Changing target recomputes immediately from the latest accepted pitch and resets marker smoothing, including during uncertainty. It does not restart microphone capture, continuity, history, or drone ownership.

## Display smoothing and reduced motion

Target marker smoothing has its own scalar state and a 180 ms time-aware exponential response. It affects only marker position. Target changes initialize directly, uncertainty freezes, and no pitch resets. Reduced-motion mode bypasses smoothing and CSS transitions while preserving all text and meter semantics.

## Independence, accessibility, and performance

Visible-range changes, microphone Stop/Start, history Pause/Resume/Clear, and drone Start/Stop do not clear the target. Target comparison is not stored in pitch history and adds no Canvas drawing. The optional target line was deferred to keep this issue focused.

The panel uses a semantic heading, real DOM target/detected labels and frequencies, worded direction, exact or musically formatted distance, uncertainty/no-pitch text, and explicit accessible off-scale descriptions. It is not a high-frequency live region. The marker is never the only source of information.

Comparison is O(1) at accepted tuner publication cadence. It uses no arrays, audio-buffer copies, detector reruns, network activity, timers, or animation loops.

## Known limitations

- No score, time-in-zone tracking, practice session, melody exercise, recording, replay, automatic correction, or target following is included.
- A4 remains fixed at 440 Hz.
- Target selection is not persisted across refresh and has no explicit clear action.
- Speaker output can acoustically enter the microphone; singer, room, device, and microphone variability remain.
- Perceived smoothing, touch layout, and detection behavior require physical iPhone Safari and Android Chrome testing.
