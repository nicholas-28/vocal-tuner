# Pitch History Pause and Resume

Issue 009 adds pause and resume to pitch-history capture and visualization only. Microphone capture, Web Audio processing, input level, pitch detection, current note, frequency, cents, and detector diagnostics continue normally while history is paused.

## Capture state model

History capture has one explicit state: `recording` or `paused`. It is separate from microphone lifecycle state. A successful microphone Start creates a fresh history session in `recording`. Stop or unexpected microphone cleanup ends ingestion, freezes the curve, resets pause accounting, and leaves the next successful Start ready to record. The state is in memory only.

Recording state stores accumulated paused duration and an optional pending resume boundary. Paused state stores accumulated paused duration, the monotonic source timestamp where pause began, and the frozen effective timestamp.

## Effective timestamp rebasing

Detector and RAF timestamps use the same monotonic `performance.now()` origin. Before history insertion or curve reference mapping, recording time is derived as:

```text
effectiveTimestampMs = sourceTimestampMs - accumulatedPausedDurationMs
```

Pause records the current source timestamp and freezes its effective equivalent. No detector publication is stored while paused. Resume adds `resumeSourceTime - pauseSourceTime` to accumulated paused duration. Consequently, the first post-resume effective time continues from the frozen timeline instead of including paused wall-clock duration. Multiple pause intervals accumulate; old stored timestamps are never rewritten.

Invalid, non-finite, backward pause/resume timestamps are ignored. Effective timestamps must remain finite, non-negative, and strictly newer than retained history. New microphone sessions reset accumulated pause duration and the curve reference reset key.

## Pause and resume behavior

Pause history:

- blocks pitch and gap ingestion before history conversion;
- cancels the curve RAF chain;
- performs one final draw at the exact frozen effective timestamp;
- preserves retained history and the visible curve;
- leaves microphone and tuner processing active.

Resume history:

- restores ingestion and exactly one curve RAF chain;
- maps source time through the updated accumulated pause duration;
- marks one pending segment boundary;
- retains the pre-pause curve without a wall-clock jump.

If retained history exists and the first resumed publication is accepted pitch, one sparse gap point is inserted between the latest stored point and resumed pitch. If the first publication is already a gap, it supplies the boundary. If history was cleared while paused, no unnecessary leading gap is inserted. The boundary is consumed once, so pause is represented as a capture break rather than silence or a sustained pitch.

## Clear, Stop, and resize

Clear replaces history immediately without changing `recording` or `paused`. While paused, the curve becomes empty and stays frozen; Resume begins a fresh curve. Clear never stops the microphone or resets the live note.

Stop performs normal microphone and AudioContext cleanup. It blocks ingestion, cancels visualization RAF through microphone inactivity, preserves the final visible history, and resets capture timing for the next session. A new successful Start clears prior history, increments the session reset key, and begins in `recording`.

Both Canvas layers still share one viewport. While paused, viewport changes invoke a curve redraw with the stored frozen effective reference but do not start RAF, preserving grid alignment without drift.

## Accessibility and performance

The explicit button label toggles between “Pause history” and “Resume history.” It is disabled outside an active microphone session. A polite status reports “History live,” “History paused,” or “History inactive,” and the graph description identifies paused history. Clear remains an independent button.

Pause adds no audio work and creates no timer. Detector publications still update the live UI but return early from history ingestion. RAF remains ref-driven with no per-frame React state. Repeated transitions are idempotent and late callbacks cannot reschedule after cancellation.

Issue 016 adds a distinct “Pause practice” control. Practice Pause does not change this capture state or curve RAF, and “Pause history” does not stop practice accounting. Clear and Resume history likewise leave the locked practice target and totals unchanged.

## Known limitations

- Pause affects history only; it is not audio recording or playback.
- Sessions and pause accounting are not persisted.
- Background tabs may throttle RAF and suspend audio independently.
- Straight unsmoothed curves still expose vibrato and detector octave errors.
- The selected fixed-span C2–C6 graph range remains unchanged through pause and resume.
- Physical Safari and Android performance still requires device testing.
