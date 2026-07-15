import { useMemo, useState } from 'react';
import {
  formatPracticeDuration,
  formatPracticeDurationLong,
} from '../practice/practiceDurationFormatting';
import {
  createPracticeTimeline,
  formatPracticeTimelinePercentage,
  getPracticeTimelineLabel,
  getPracticeTimelineSegmentStyle,
} from '../practice/practiceTimeline';
import type { PracticeSessionSummary } from '../types/practiceSession';
import type { PracticeTimelineEventType } from '../types/practiceTimeline';

const LEGEND_TYPES: readonly PracticeTimelineEventType[] = [
  'on-target',
  'off-target',
  'uncertain',
  'no-pitch',
  'unobserved',
  'paused',
];

export function PracticeSessionTimeline({
  summary,
}: {
  summary: PracticeSessionSummary;
}) {
  const [tappedSegmentIndex, setTappedSegmentIndex] = useState<number | null>(
    null,
  );
  const segments = useMemo(
    () =>
      createPracticeTimeline(
        summary.timelineEvents,
        summary.startedAtMs,
        summary.completedAtMs,
      ),
    [summary.completedAtMs, summary.startedAtMs, summary.timelineEvents],
  );

  return (
    <section
      className="practice-timeline"
      aria-labelledby="practice-timeline-heading"
    >
      <h4 id="practice-timeline-heading">Session timeline</h4>
      <div className="practice-timeline__markers" aria-hidden="true">
        <span>Start</span>
        <span>Finish</span>
      </div>
      <ol className="practice-timeline__track" aria-label="Practice events">
        {segments.map((segment, index) => {
          const label = getPracticeTimelineLabel(segment.event.type);
          const percentage = formatPracticeTimelinePercentage(
            segment.percentage,
          );
          const duration = formatPracticeDuration(segment.durationMs);
          const accessibleDuration = formatPracticeDurationLong(
            segment.durationMs,
          );
          return (
            <li
              key={`${segment.event.startTimestamp}-${segment.event.endTimestamp}-${segment.event.type}-${index}`}
              className="practice-timeline__event"
              style={getPracticeTimelineSegmentStyle(segment)}
            >
              <button
                type="button"
                className="practice-timeline__segment"
                data-event-type={segment.event.type}
                aria-label={`${label} for ${accessibleDuration}. ${percentage} of session.`}
                aria-expanded={tappedSegmentIndex === index}
                onClick={() =>
                  setTappedSegmentIndex((current) =>
                    current === index ? null : index,
                  )
                }
              >
                <span
                  className="practice-timeline__tooltip"
                  data-visible={tappedSegmentIndex === index || undefined}
                  role="tooltip"
                >
                  <strong>{label}</strong>
                  <span>{duration}</span>
                  <span>{percentage}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <ul className="practice-timeline__legend" aria-label="Timeline legend">
        {LEGEND_TYPES.map((type) => (
          <li key={type}>
            <span data-event-type={type} aria-hidden="true" />
            {getPracticeTimelineLabel(type)}
          </li>
        ))}
      </ul>
    </section>
  );
}
