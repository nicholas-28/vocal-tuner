# Practice-session timeline

## Purpose and scope

Issue 017 adds a truthful wall-clock timeline to the completed target-practice summary. It explains how the session unfolded without changing live metrics, detector behavior, continuity, target tolerance, history, or the Issue 016 lifecycle. The timeline appears only after Finish and adds no recording, replay, scrolling, zoom, editing, export, persistence, scoring, Canvas, timer, or animation.

## Authoritative event creation

Timeline events are created inside the existing practice-session settlement path. The same interval operation that increments on-target, off-target, uncertain, no-pitch, or unobserved totals appends the corresponding event with exact monotonic start and end timestamps. The evidence cap may split one settled interval into an observed event followed by an unobserved event. This is not recomputed from summary totals, so there is no second timing source and no interpolation.

Pause is wall time rather than active time. Pause creates no active metric, but Resume or Finish appends one exact paused event from `pausedAtMs` to the transition timestamp. The completed event sequence therefore covers `completedAtMs - startedAtMs`, including pauses. Zero-duration boundaries create no event.

Each event contains only:

- `startTimestamp`;
- `endTimestamp`;
- `type`.

The allowed types are on target, off target, uncertain, no pitch, unobserved, and paused. Events and completed event arrays are frozen. Events are not smoothed, interpolated, or merged across accounting settlements.

## Layout and percentages

The completed DOM component memoizes derived segments from the immutable summary. Duration is `endTimestamp - startTimestamp`. Position and width use the full wall duration:

```text
start percentage = (event start - session start) / wall duration
width percentage = event duration / wall duration
```

No event-count normalization or accounting clamp is applied. CSS requests `max(1px, exact percentage)` so very short events remain visible; timestamps, tooltip duration, and percentage remain unchanged. Absolute positioning prevents a visual minimum from redistributing other event widths.

## Interaction and accessibility

Every segment is a real DOM button. Hover or focus, including focus created by a mobile tap, reveals a tooltip containing state, duration, and wall-session percentage. Its accessible name states the same information, for example “On target for 12.4 seconds. 24% of session.” Start and Finish labels and a wrapping six-state legend provide context without relying on color alone.

The palette uses teal for on target, neutral gray for off target, orange for uncertainty, dark gray for no pitch, near-black for unobserved, and muted blue for paused. There are no gradients or animations.

## Privacy and performance

Events contain classifications and monotonic timestamps only. They contain no audio, frequency, MIDI, cents, detector candidates, or user identity and remain in memory until Practice again or refresh.

The visual timeline is not mounted while running or paused. Completed segment geometry is memoized and has no timer, RAF, Canvas, resize observer, or hit-testing loop. Event storage grows with accounting settlements, so unusually long sessions consume more memory than the Issue 016 totals alone.

## Known limitations

- The timeline is completed-session only and cannot scroll, zoom, replay, edit, or export.
- One-pixel visual minima can overlap neighboring subpixel events without changing accounting.
- Rounded tooltip percentages may not visually sum to exactly 100%, while underlying percentages do.
- Sessions are in-memory and disappear on refresh.
- Very long sessions retain more immutable events and require future profiling before expanding session scope.
- Physical iPhone Safari and Android Chrome tooltip positioning and touch focus remain manual checks.
