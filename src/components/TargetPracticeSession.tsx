import type { TargetPracticeSessionModel } from '../hooks/useTargetPracticeSession';
import {
  formatOnTargetShare,
  formatPracticeDuration,
  formatPracticeDurationLong,
} from '../practice/practiceDurationFormatting';
import type {
  ActivePracticeSession,
  PracticeSessionSummary,
} from '../types/practiceSession';

type TargetPracticeSessionProps = {
  model: TargetPracticeSessionModel;
};

export function TargetPracticeSession({ model }: TargetPracticeSessionProps) {
  return (
    <section
      className={`practice-session practice-session--${model.state.status}`}
      aria-labelledby="practice-session-heading"
    >
      <div className="practice-session__heading">
        <h3 id="practice-session-heading">Practice session</h3>
        <span role="status" aria-live="polite">
          {formatStateLabel(model)}
        </span>
      </div>
      {model.state.status === 'idle' && <IdlePractice model={model} />}
      {(model.state.status === 'running' || model.state.status === 'paused') &&
        model.displaySession && (
          <ActivePractice model={model} session={model.displaySession} />
        )}
      {model.state.status === 'completed' && (
        <CompletedPractice
          summary={model.state.summary}
          onReset={model.reset}
        />
      )}
    </section>
  );
}

function IdlePractice({ model }: TargetPracticeSessionProps) {
  return (
    <>
      <p className="practice-session__target">
        {model.selectedTarget
          ? `Selected target: ${model.selectedTarget.label} · ${model.selectedTarget.frequencyHz.toFixed(1)} Hz`
          : 'Select a reference note before starting practice.'}
      </p>
      {!model.microphoneActive && (
        <p className="practice-session__guidance">
          Start the microphone to begin practice.
        </p>
      )}
      <button
        type="button"
        className="practice-button"
        disabled={!model.controls.canStart}
        onClick={model.start}
      >
        Start practice
      </button>
    </>
  );
}

function ActivePractice({
  model,
  session,
}: TargetPracticeSessionProps & { session: ActivePracticeSession }) {
  const paused = model.state.status === 'paused';
  const microphonePause =
    model.state.status === 'paused' &&
    model.state.paused.reason === 'microphone-stopped';
  return (
    <>
      <p className="practice-session__target" id="practice-target-lock-message">
        Practice target locked to {session.target.label} until this session
        ends.
      </p>
      {microphonePause && (
        <p className="practice-session__guidance">
          Practice paused because the microphone stopped. Restart the
          microphone, then resume explicitly.
        </p>
      )}
      <PracticeMetrics session={session} />
      <p className="practice-session__observation">
        Current observation: {paused ? 'Paused' : formatObservation(session)}
      </p>
      <div className="practice-session__actions">
        {paused ? (
          <button
            type="button"
            className="practice-button"
            disabled={!model.controls.canResume}
            onClick={model.resume}
          >
            Resume practice
          </button>
        ) : (
          <button
            type="button"
            className="practice-button"
            onClick={model.pause}
          >
            Pause practice
          </button>
        )}
        <button
          type="button"
          className="secondary-button"
          onClick={model.finish}
        >
          Finish practice
        </button>
      </div>
    </>
  );
}

function PracticeMetrics({ session }: { session: ActivePracticeSession }) {
  const share =
    session.measurableVoicedMs === 0
      ? null
      : session.onTargetMs / session.measurableVoicedMs;
  return (
    <dl
      className="practice-session__metrics"
      aria-label="Live practice metrics"
    >
      <Metric
        label="Active practice"
        value={formatPracticeDuration(session.activeElapsedMs)}
      />
      <Metric
        label="Measured voice"
        value={formatPracticeDuration(session.measurableVoicedMs)}
      />
      <Metric
        label="On target"
        value={formatPracticeDuration(session.onTargetMs)}
        emphasized
      />
      <Metric
        label="On-target share"
        value={formatOnTargetShare(share) ?? 'Not enough measured voice'}
      />
    </dl>
  );
}

function CompletedPractice({
  summary,
  onReset,
}: {
  summary: PracticeSessionSummary;
  onReset: () => void;
}) {
  const share = formatOnTargetShare(summary.onTargetShare);
  return (
    <>
      <p className="practice-session__target">
        Target: {summary.target.label} · {summary.target.frequencyHz.toFixed(1)}
        Hz
      </p>
      {share === null ? (
        <p className="practice-session__guidance">
          Not enough measured voice to calculate an on-target share.
        </p>
      ) : (
        <p className="practice-session__share">On-target share: {share}</p>
      )}
      {summary.measurableVoicedMs > 0 && summary.measurableVoicedMs < 1000 && (
        <p className="practice-session__guidance">
          Very short measured sample.
        </p>
      )}
      <dl
        className="practice-session__metrics practice-session__metrics--summary"
        aria-label="Completed practice summary"
      >
        <Metric
          label="Active practice"
          value={formatPracticeDuration(summary.activeElapsedMs)}
        />
        <Metric
          label="Measured voice"
          value={formatPracticeDuration(summary.measurableVoicedMs)}
        />
        <Metric
          label="On target"
          value={formatPracticeDuration(summary.onTargetMs)}
          emphasized
        />
        <Metric
          label="Off target"
          value={formatPracticeDuration(summary.offTargetMs)}
        />
        <Metric
          label="Briefly uncertain"
          value={formatPracticeDuration(summary.uncertainMs)}
        />
        <Metric
          label="No pitch"
          value={formatPracticeDuration(summary.noPitchMs)}
        />
        <Metric
          label="Unobserved"
          value={formatPracticeDuration(summary.unobservedMs)}
        />
        <Metric label="Pauses" value={String(summary.pauseCount)} />
      </dl>
      <p className="visually-hidden">
        Active practice {formatPracticeDurationLong(summary.activeElapsedMs)}.
        Measured voice {formatPracticeDurationLong(summary.measurableVoicedMs)}.
        On target {formatPracticeDurationLong(summary.onTargetMs)}.
      </p>
      <button type="button" className="practice-button" onClick={onReset}>
        Practice again
      </button>
    </>
  );
}

function Metric({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div data-emphasized={emphasized || undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatObservation(session: ActivePracticeSession): string {
  switch (session.currentObservation.kind) {
    case 'on-target':
      return 'On target';
    case 'off-target':
      return 'Off target';
    case 'uncertain':
      return 'Briefly uncertain';
    case 'no-pitch':
      return 'No pitch detected';
    default:
      return 'Waiting for a measurement';
  }
}

function formatStateLabel(model: TargetPracticeSessionProps['model']): string {
  if (model.state.status === 'running') return 'Practice running';
  if (model.state.status === 'paused') return 'Practice paused';
  if (model.state.status === 'completed') return 'Practice completed';
  return 'Practice ready';
}
