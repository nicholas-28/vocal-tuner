# Cents meter readability

## Problem and semantic policy

The original nearest-note meter was capped at 21 rem and moved directly from every accepted raw cents value. Correct small vocal fluctuations therefore looked disproportionately nervous. Issue 014 widens the physical scale without changing its meaning: −50 cents is the left nearest-note boundary, zero is note center, and +50 cents is the right boundary.

## Raw cents and display cents

Raw cents remain `(fractionalMidi - nearestMidi) * 100` using A4 = 440 Hz and `Math.round` nearest-note selection. Raw cents drive signed numeric text, stable Flat/In tune/Sharp classification, diagnostics, and downstream musical data. They are not clamped or smoothed.

Display cents exist only inside meter presentation. They position one DOM marker and are never written to continuity state, history, Canvas, detector output, drone state, or future scoring.

## Layout and scale

The meter fills available readout width up to 36 rem with safe padding. It shows −50, −25, 0, +25, and +50 ticks, a strong zero line, and Flat/In tune/Sharp text. A symmetric shaded ±5-cent band is visual guidance only; its boundaries are inclusive. It creates no score or target metric.

## Display smoothing

Accepted measurements use time-aware exponential smoothing:

`alpha = 1 - exp(-deltaTimeMs / 150 ms)`

`display = previousDisplay + alpha * (raw - previousDisplay)`

The first value initializes directly. A sustained step moves about 86% in 300 ms and 95% in 450 ms, without overshoot. Equivalent elapsed time produces equivalent output regardless of cadence. No moving array, timer, or RAF is used.

When nearest MIDI changes, display cents reset immediately to the new note-relative value, preventing an incorrect sweep from about +49 to −49. No same-note large-jump snap is added.

## Continuity and lifecycle

- `voiced`: update raw text/classification and smoothed marker.
- `uncertain`: freeze marker and classification, reduce opacity, and expose uncertainty in text.
- `unvoiced`: retain scale, hide marker, clear classification, and reset smoothing. Never animate toward zero.

Start initializes the first accepted value directly. Stop and unexpected cleanup reset through unvoiced state. History Pause/Clear do not affect the meter. Reference-note selection and drone playback do not change its nearest-note target.

## Reduced motion, accessibility, and performance

`prefers-reduced-motion: reduce` disables transitions and uses direct accepted display updates. Labels, raw numeric text, classification, and an accessible sentence remain. Uncertainty is ordinary DOM state rather than a high-frequency live region.

Each publication performs one O(1), constant-space scalar transition. There is no audio work, history mutation, Canvas coupling, permanent animation loop, or new dependency.

## Limitations

The ±5-cent zone is visual guidance, not vocal scoring. Raw history still contains natural vibrato. Perceived calmness and lag require physical browser/device testing. This meter does not compare with the reference drone; target-relative guidance remains a future issue.
