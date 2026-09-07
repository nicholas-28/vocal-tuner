# Target note practice session

## Purpose and scope

Issue 016 adds a neutral, single-target practice workflow around the selected reference note. It measures only observed timing categories and reports an on-target share, not a grade or judgment. It adds no audio recording, replay, persistence, account, automatic sequence, melody exercise, configurable duration, or backend.

All state and summary data remain local and in memory. Issue 017 extends the original constant-space totals with an immutable classification-event journal for the completed timeline; it still stores no raw audio, detector sequence, frequency, MIDI, cents, or target-relative sample history. Refresh removes the summary.

## Preconditions and target lock

Start practice requires both a valid selected reference note and an active microphone. The practice button never requests microphone permission; microphone Start remains an explicit action. Reference-drone playback is optional and is never started automatically.

Start copies the selected integer MIDI, sharp-only label, and equal-tempered A4 = 440 Hz frequency into an immutable session target. While running or paused, reference-key buttons retain focus and arrow-key navigation but expose `aria-disabled` and cannot activate another selection. This keeps general target guidance, practice, and drone controls on one coherent target. The keyboard becomes selectable again after Finish.

Drone Start, Stop, volume, suspension, and failure do not change session state or accounting. Speaker output can still enter the microphone, so headphones remain recommended.

## State machine

One discriminated state owns the lifecycle:

- `idle`: no session totals; Start may become available.
- `running`: immutable target, current observation, timestamp baseline, and counters.
- `paused`: the same session and target plus pause timestamp/reason.
- `completed`: an immutable summary; later observations are ignored.

Valid actions are Start, Pause, Resume, Finish, and Practice again. Practice again returns completed state to idle while preserving the external selected target; the next Start creates a fresh session with a new in-memory monotonic ID and zero totals.

## Timing and interval attribution

Session actions use `performance.now()`. Practice observations use the continuity layer's detector publication timestamp, which has the same monotonic origin. Non-finite, negative, duplicate, and backward observation timestamps are ignored. No `Date.now()` value is mixed into accounting.

Intervals use previous-observation sample-and-hold semantics. A new observation first settles time since the preceding accepted observation, then becomes the current observation. Therefore the first observation creates no retroactive voice credit. Resume installs `unobserved` before waiting for a new publication, so stale pre-pause pitch is not credited.

## Evidence cap and unobserved time

One observation supports at most `250 ms`, centralized as `MAX_ACCOUNTABLE_PRACTICE_INTERVAL_MS`. Normal publications near 67 ms account fully. If the next publication or action arrives later, only the first 250 ms may enter that observation's category; all excess becomes explicit `unobservedMs`.

This prevents a frozen tab, scheduling stall, suspended microphone, or missing detector publication from becoming sustained on-target time. A 4 Hz UI timer previews the same pure settlement for display only. It does not commit category metrics, and one interval is cleaned up on Pause, Finish, Practice again, and unmount.

## Metrics and invariants

Active elapsed time includes all running time and excludes manual or microphone-triggered pauses. Wall elapsed in the completed summary spans Start through Finish and therefore includes pauses.

Observed categories are:

- `on-target`: stable accepted pitch inside inclusive ±10 raw target-relative cents;
- `off-target`: stable accepted pitch outside that tolerance;
- `uncertain`: continuity is briefly uncertain;
- `no-pitch`: continuity is confirmed unvoiced;
- `unobserved`: initial, post-resume, or evidence-cap time without sufficient observation.

The explicitly named `PRACTICE_BAND_CENTS` uses shared `inTuneCents` (±10). This is instantaneous band occupancy, not an exercise success rule. Display-smoothed marker cents never enter practice calculations.

The state machine maintains:

```text
measurableVoicedMs = onTargetMs + offTargetMs

activeElapsedMs = measurableVoicedMs
                + uncertainMs
                + noPitchMs
                + unobservedMs
```

Silence and uncertainty are not off-target voice and do not reduce the share denominator.

## On-target share and summary

```text
onTargetShare = onTargetMs / measurableVoicedMs
```

The share is clamped to 0–1 for defensive formatting and shown with one decimal percentage under “Time in ±10-cent band.” When measurable voice is zero, the value is `null` and the UI says there is not enough measured voice; it never fabricates 0%. A nonzero sample shorter than one second is labeled “Very short measured sample” without hiding its metrics.

Live and completed displays also show session-wide time-weighted average signed cents (pitch-center bias) and standard deviation around that mean (pitch spread). Weighted Welford updates use exactly the same capped measured intervals as the counters; uncertainty, silence, pauses and unobserved time contribute no pitch. Two scalar accumulators retain raw precision without a sample history. Null measured duration displays unavailable statistics. These descriptive metrics do not classify vibrato or stability, and a centered mean alone can hide random motion or an approach. See [calibration baseline](PITCH_CALIBRATION_PERFORMANCE.md).

The summary shows target, active practice, measured voice, on-target and off-target time, on-target share, uncertain time, no-pitch time, unobserved time, and pause count. Durations below a minute use tenths of a second; longer durations use `m:ss`, with a long-form accessible description.

## Continuity, pause, and microphone lifecycle

Only `voiced` accepted musical pitch creates measurable time. `uncertain` never reuses the frozen target-guidance value for practice credit. `unvoiced` accumulates separately and never counts as a failed note.

Pause practice settles the current interval, stops practice accounting and its display timer, and preserves microphone, detector, tuner, target guidance, pitch history, and drone. Resume requires an active microphone, excludes paused time, and waits from an unobserved baseline.

When microphone state leaves active while practice is running, practice auto-pauses with reason `microphone-stopped`. Unexpected track end follows the same active-state path. Restarting the microphone does not resume practice automatically; Resume remains explicit. Late or stale publications cannot update a paused, completed, reset, or later session.

## History independence

Practice Start does not clear history. Pause practice does not pause history. Pause history does not pause practice. Clear history does not reset practice metrics. Finish practice does not freeze the curve. Controls remain explicitly labeled “Pause practice” and “Pause history.”

## Accessibility, privacy, and performance

The panel has a semantic heading, textual state, locked target, current observation, real DOM metrics, explicit control names, and a polite live status only for lifecycle state. Timer values are outside the live region, preventing repeated announcements. Keyboard focus is not moved, and disabled Start/Resume controls have adjacent explanations.

All processing remains local. There is no audio capture beyond the existing transient detector buffers, no recording, network request, storage, analytics, or persistence.

Metric arithmetic remains O(1). Issue 017 appends immutable timestamp/category events from that same settlement operation, so event storage grows with the number of settled intervals. There is one 250 ms display-only interval while running, no timeline rendering until completion, no timeline RAF or timer, no detector rerun, no additional Canvas work, and no dependency. Completed timeline geometry is memoized from the frozen summary.

## Known limitations

- One fixed selected note per session; no melody, scale, or automatic sequence.
- Inclusive ±10 cents is not configurable.
- Narrow-band occupancy is cadence/phase sensitive during vibrato and must not become a future game score.
- Metrics depend on detector and continuity quality and do not judge vocal tone, breath, vibrato, or technique.
- Background tabs and microphone interruptions become unobserved after the evidence cap but still need device testing.
- Drone sound may be detected acoustically; no source separation is attempted.
- Sessions and summaries disappear on refresh.
- Very long sessions retain more timeline events and require profiling before expanding session scope.
- Physical iPhone Safari and Android Chrome timing, touch, and layout verification remains manual.
