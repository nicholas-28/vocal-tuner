# Pitch History Buffer

## Point model

Each immutable point contains:

- monotonic `timestampMs`;
- fractional MIDI or `null`;
- accepted frequency or `null`;
- normalized confidence;
- kind: `pitch` or `gap`.

Fractional MIDI is stored directly from `MusicalPitch` because one unit always equals one semitone, making future vertical graph mapping linear. The history does not copy raw detector diagnostics, React state, visual coordinates, or Canvas data.

## Timestamp policy

The buffer consumes the detector's monotonic `performance.now()` timestamps. Valid timestamps must be finite, non-negative, and strictly newer than the latest retained point. Duplicate and stale timestamps are ignored; points are never sorted after insertion. Clearing creates an empty timeline, so a new session may begin with an earlier relative timestamp.

## Gap representation

The first rejected or silent publication after pitch appends one gap point with null MIDI and frequency. Repeated gaps are suppressed. The next pitch timestamp defines the other edge of the silent interval, so a renderer must not connect pitch points across a gap.

During silence longer than the entire retention window, trimming can replace the old gap with a new sparse gap boundary. This remains on the order of one point per retention window, never one point per detector publication.

## Sampling

Regular pitch samples are limited to 15 points per second, matching the current maximum UI publication target. A pitch-to-gap or gap-to-pitch transition is always preserved immediately. A pitch move of at least 0.5 fractional MIDI is also preserved even inside the normal 66.7 ms interval so a meaningful change is not silently skipped. No smoothing or curve simplification is performed.

## Retention and trimming

The authoritative default is 15,000 ms. Valid future configuration is 5,000–60,000 ms. Appending trims by timestamp cutoff rather than point count. When the cutoff falls between retained points, one immutable copy of the preceding point is placed exactly at the cutoff to preserve boundary continuity. An exact-cutoff point is kept without duplication. A large jump with no points in the visible interval discards the old history.

At 15 points per second for 15 seconds, normal storage is approximately 225 points plus at most one cutoff boundary. A simple immutable array is intentionally used at this scale; trimming uses `findIndex` and `slice`, not repeated `shift()` calls. There is no ring buffer, timer, or animation loop.

## Sessions and Clear

A session begins only after microphone capture succeeds. That callback clears old history and enables ingestion. Stop, unexpected track ending, detector cleanup, and unmount disable ingestion while leaving the current history frozen. Starting again creates a new empty session.

Clear removes all points immediately without stopping the microphone, resetting the detector, or changing the current live note. The next publication begins fresh history. Page refresh naturally discards the in-memory buffer. No local storage, upload, or other persistence exists.

## Future rendering

Canvas rendering should consume a readonly snapshot and map horizontal positions from timestamps, not indexes. It should map vertical positions from fractional MIDI and break the curve at every gap. Sparse gap duration is determined by the next pitch timestamp or the renderer's current session time. Interpolation and visual smoothing are explicitly deferred.

## Known limitations

- No curve or Canvas rendering exists yet.
- Sparse gaps do not contain repeated duration samples.
- No pause state, persistence, smoothing, or octave correction exists.
- History resets between microphone sessions.
- Future rendering must define interpolation only between adjacent pitch points that are not separated by a gap.
