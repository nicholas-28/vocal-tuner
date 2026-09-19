# P1-a interpretation and harmony

These modules implement provisional interaction policy for a human causality
experiment. Their outputs do not measure singing skill or learning. The C0
boundary in `types.ts` and parameters in `padConfig.ts` remain authoritative.

## Consumption

Create `createFastPitchInterpreter({ source })` with the existing microphone
owner's `PitchSource`, and create `createHarmonyModel()` with the desired fixed
major key. For each consumer update, pass `performance.now()` to the interpreter
and pass its returned frame to `harmony.next(frame)`. Both modules are synchronous
and have no subscriptions, timers, React dependencies, or audio resources.

The interpreter polls the latest sample, identified by session generation and
strictly increasing evidence timestamp. It does not replay a backlog after a
consumer stall. A future sample is left unconsumed until a valid later update;
invalid or regressing consumer times throw before changing state. PitchSource's
freshness predicate determines whether a sample is eligible. Grace additionally
limits how long a voiced target may survive.

New voiced evidence sets the target in absolute cents. The shimmer uses the
existing two-rate visual smoother; harmony uses a plain first-order exponential.
Both advance between observations. Integration splits at the evidence timestamp
when that timestamp lies after the previous update. Late evidence never rewrites
already integrated time. The first voiced target initializes both smoothers.

Pitch-class hysteresis and dwell run once in the interpreter, against the harmony
path. Dwell uses elapsed consumer time, including interpolation while voiced;
uncertain input interrupts pending dwell. HarmonyModel consumes the accepted
class and does not apply a second dwell delay. Supply any tuning override to the
interpreter; the frozen HarmonyModelOptions.tuning field is not needed here.

## Gaps, octaves, and sessions

A voiced target survives only through the configured grace interval measured
from `lastVoicedAtMs`, the last consumed voiced sample timestamp. Repeated reads
never refresh that time. Explicit unvoiced, uncertain, stale, or inactive input
enters grace, produces no new pitch evidence, and cannot change the chord. After
grace, all pitch outputs become null and the phase is `releasing`. This phase
remains until new voice or a reset; the future audio engine owns release envelopes.
Harmony returns null on release, with `changed` true only on that transition.

Near-one-octave candidates are folded against the accepted target. Confirmation
uses consecutive voiced evidence timestamps and the C0 duration, never consumer
frame counts. A return, uncertainty, or expired grace cancels confirmation. On
confirmation the shimmer follows the new target; harmony coordinates translate
by the octave so smoothing cannot invent intermediate pitch classes.

A changed session generation, source clear, or explicit interpreter reset emits
an idle frame that clears downstream harmony. A new session's first sample is
consumed on the following update, even when the session's inactive marker was
missed. Forward **every frame**, including idle/releasing and frames without new
sample evidence, to HarmonyModel. This reset handshake uses the frozen C0 frame
without adding a generation field. Lifecycle owners can also reset both modules
explicitly.

## Harmony selection

All seven diatonic major-key triads are available, including the diminished vii.
Chromatic classes hold the existing chord. A chord containing the accepted class
keeps the same object, ID, and voicing. Otherwise selection minimizes the sum of
absolute movement between three ordered voices, subject to the voicing floor
and exactly one of each triad pitch class. Inversions and open voicings are allowed.
Ties use ascending scale degree, then lexicographic ascending voice pitches.
Initial selection uses that order without a previous-motion cost. IDs encode the
fixed key and degree. The model copies key values during construction.

## Verification

Pad-local synthetic drivers use the real PitchSource producer and shared raw
detection factory. Tests cover the C0 response budgets, 30/60 Hz interpolation,
cadence variations, vibrato, octave errors and confirmation, timestamp ordering,
grace, session isolation, chromatic/contained-note holds, and minimum-motion
voicings checked against an independent wider-register exhaustive search.
