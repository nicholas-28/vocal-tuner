# Sustained voice continuity

## Problem and measured cause

The raw detector publishes at about 15 Hz from a 30 Hz analysis loop. Before Issue 013, every published rejection immediately cleared the live note and was ingested as a sparse history gap. The curve correctly broke at that explicit gap; it was not the source. It also independently refuses to connect accepted samples more than 250 ms apart.

The raw thresholds are unchanged: RMS `0.005`, YIN/CMND `0.35`, confidence `0.70`, and frequency `65–1200 Hz`. No recorded real-device dataset exists in the repository, so RMS, CMND, and confidence failure frequency cannot yet be ranked honestly. Session-local counters now make that measurable without retaining audio.

## State and evidence policy

`pitchContinuity` is a pure O(1) layer between raw publications and live/history state. It has `unvoiced`, `voiced`, and `uncertain` states and requires finite, strictly increasing timestamps. Unvoiced enters voiced after one normally accepted frame. The first rejection emits `hold`. A normally accepted frame within 160 ms returns to voiced without a gap. Beyond 160 ms, exactly one gap is emitted at the first uncertain timestamp. The exact boundary is inclusive: 160 ms recovers; 161 ms confirms a gap.

Hold emits neither pitch nor gap. No previous MIDI is duplicated, no interpolation is stored, and no raw candidate is promoted. Candidate recovery and lower continuation thresholds are disabled because current evidence does not justify accepting rejected frames. Entry and continuation use identical raw thresholds; only exit has temporal hysteresis.

## UI, history, and curve

The live readout retains the last measured note during uncertainty and labels it `Briefly uncertain` with its publication-time age. It does not update frequency or cents. A confirmed gap clears the readout.

History consumes decisions: holds add nothing; recovery adds only the new raw accepted point; timeout adds one sparse gap at uncertainty onset. Pause/Resume timestamp rebasing, Clear, retention, fractional MIDI, visible-range omission, and the curve's 250 ms safeguard are unchanged.

## Diagnostics, performance, and accessibility

Raw results remain inspectable. Continuity tracks state, decisions, candidate distance, consecutive counts, recovered uncertainty and gap counts, rejection counts, and rolling uncertainty duration totals. Values reset on a successful Start and cleanup and never form an unbounded event log.

Each transition is constant-time at existing publication cadence. There are no audio-buffer copies, transforms, timers, or animation loops. Continuity text is not a live region, avoiding one-frame announcement spam; the current note's accessible label identifies a briefly uncertain retained measurement.

## Limitations

Chrome and Safari device testing is still required for breathy/quiet voices, background noise, scheduling delays, sample-rate differences, and octave errors. There is no ML VAD, pitch correction, octave concealment, candidate recovery, target guidance, or browser sniffing. Any threshold change requires measured evidence and separate tests.
