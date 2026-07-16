import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { BUILD_INFO } from '../config/buildInfo';
import { formatAudioDiagnosticReport } from '../audio/referenceDroneDiagnosticReport';
import { useNativeAudioDiagnostic } from '../hooks/useNativeAudioDiagnostic';
import type {
  AudioDiagnosticManualResults,
  AudioSessionDiagnosticState,
  AudioSessionDiagnosticTimeline,
  ManualAudibilityResult,
  PhaseAudibilityResult,
  PhaseAudibilityResults,
} from '../types/audioDiagnostics';
import type {
  ReferenceDroneDiagnosticTestResult,
  ReferenceDroneDiagnostics as Diagnostics,
  ReferenceDroneSignalMeasurement,
} from '../types/referenceDrone';

type ReferenceDroneDiagnosticsProps = {
  diagnostics: Diagnostics;
  audioDiagnosticMode?: boolean;
  onPlayOutputTest?: () => void;
  onPlayDirectOutputTest?: () => void;
  onPlayConstantGainOutputTest?: () => void;
  onRecreateContext?: () => void;
  audioSessionTimeline?: AudioSessionDiagnosticTimeline | null;
};

const EMPTY_AUDIO_SESSION_STATE: AudioSessionDiagnosticState = Object.freeze({
  snapshots: Object.freeze([]),
  phaseAudibility: Object.freeze({
    beforeMicrophone: 'not-tested',
    afterMicrophoneStart: 'not-tested',
    afterMicrophoneStop: 'not-tested',
  }),
  preparation: Object.freeze({
    available: false,
    candidateTypes: Object.freeze([]),
    requestedType: null,
    priorType: null,
    resultingType: null,
    resultingState: null,
    result: 'not-requested',
    errorMessage: null,
  }),
});

const INITIAL_MANUAL_RESULTS: AudioDiagnosticManualResults = Object.freeze({
  persistentDrone: 'not-recorded',
  directWebAudio: 'not-recorded',
  constantGainWebAudio: 'not-recorded',
  nativeAudio: 'not-recorded',
  recreatedContext: 'not-recorded',
});

export function ReferenceDroneDiagnostics({
  diagnostics,
  audioDiagnosticMode = false,
  onPlayOutputTest,
  onPlayDirectOutputTest,
  onPlayConstantGainOutputTest,
  onRecreateContext,
  audioSessionTimeline = null,
}: ReferenceDroneDiagnosticsProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [manualResults, setManualResults] = useState(INITIAL_MANUAL_RESULTS);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const nativeAudio = useNativeAudioDiagnostic();
  const audioSessionState = useSyncExternalStore(
    audioSessionTimeline?.subscribe ?? (() => () => undefined),
    audioSessionTimeline?.getSnapshot ?? (() => EMPTY_AUDIO_SESSION_STATE),
    () => EMPTY_AUDIO_SESSION_STATE,
  );
  useEffect(() => {
    const timeline = audioSessionTimeline;
    return () => {
      if (timeline?.getSnapshot().preparation.priorType !== null)
        timeline?.restore();
    };
  }, [audioSessionTimeline]);
  const report = useMemo(
    () =>
      formatAudioDiagnosticReport(diagnostics, BUILD_INFO, {
        manualResults,
        nativeAudio: nativeAudio.state,
        audioSessionTimeline: audioSessionState,
      }),
    [audioSessionState, diagnostics, manualResults, nativeAudio.state],
  );
  const engineBusy =
    diagnostics.engineState === 'starting' ||
    diagnostics.engineState === 'playing' ||
    diagnostics.engineState === 'changing' ||
    diagnostics.engineState === 'stopping' ||
    diagnostics.outputTestStatus === 'starting' ||
    diagnostics.outputTestStatus === 'playing' ||
    isTestBusy(diagnostics.directOutputTest) ||
    isTestBusy(diagnostics.constantGainOutputTest) ||
    isTestBusy(diagnostics.recreatedContextOutputTest);
  const nativeBusy =
    nativeAudio.state.status === 'play-requested' ||
    nativeAudio.state.status === 'playing';
  const testsBusy = engineBusy || nativeBusy;

  const copyReport = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable');
      await navigator.clipboard.writeText(report);
      setShowFallback(false);
      setCopyStatus('Audio diagnostic report copied.');
    } catch {
      setShowFallback(true);
      setCopyStatus('Clipboard unavailable. Select and copy the report below.');
      window.setTimeout(() => fallbackRef.current?.select(), 0);
    }
  };

  if (!audioDiagnosticMode) {
    return (
      <details className="reference-drone-diagnostics">
        <summary>Reference-drone diagnostics</summary>
        <CompactDiagnostics diagnostics={diagnostics} />
      </details>
    );
  }

  return (
    <details className="reference-drone-diagnostics" open>
      <summary>Reference audio diagnostics</summary>
      <section
        className="reference-audio-section reference-audio-actions"
        aria-labelledby="audio-actions-heading"
      >
        <h3 id="audio-actions-heading">Physical test actions</h3>
        <div className="reference-audio-action-grid">
          <DiagnosticAction
            label="Play 1-second output test"
            disabled={testsBusy}
            onClick={onPlayOutputTest}
          />
          <DiagnosticAction
            label="Play direct Web Audio test"
            disabled={testsBusy}
            onClick={onPlayDirectOutputTest}
          />
          <DiagnosticAction
            label="Play Web Audio test with constant gain"
            disabled={testsBusy}
            onClick={onPlayConstantGainOutputTest}
          />
          <DiagnosticAction
            label="Play native audio test"
            disabled={testsBusy}
            onClick={nativeAudio.playFromUserGesture}
          />
          <DiagnosticAction
            label="Recreate audio output context"
            disabled={testsBusy}
            onClick={onRecreateContext}
          />
        </div>
        <div className="reference-audio-manual-results">
          <ManualAudibilityControl
            label="Persistent drone audible"
            value={manualResults.persistentDrone}
            onChange={(value) =>
              setManualResults((current) => ({
                ...current,
                persistentDrone: value,
              }))
            }
          />
          <ManualAudibilityControl
            label="Direct Web Audio audible"
            value={manualResults.directWebAudio}
            onChange={(value) =>
              setManualResults((current) => ({
                ...current,
                directWebAudio: value,
              }))
            }
          />
          <ManualAudibilityControl
            label="Constant-gain Web Audio audible"
            value={manualResults.constantGainWebAudio}
            onChange={(value) =>
              setManualResults((current) => ({
                ...current,
                constantGainWebAudio: value,
              }))
            }
          />
          <ManualAudibilityControl
            label="Native audio audible"
            value={manualResults.nativeAudio}
            onChange={(value) =>
              setManualResults((current) => ({
                ...current,
                nativeAudio: value,
              }))
            }
          />
          <ManualAudibilityControl
            label="Recreated context audible"
            value={manualResults.recreatedContext}
            onChange={(value) =>
              setManualResults((current) => ({
                ...current,
                recreatedContext: value,
              }))
            }
          />
        </div>
        <div className="reference-audio-comparison-guide">
          <h4>Microphone dependency A/B</h4>
          <ol>
            <li>Test the drone before using the microphone.</li>
            <li>Use Start microphone below, then test the drone again.</li>
            <li>Stop the microphone, then test the drone once more.</li>
          </ol>
          <PhaseAudibilityControl
            label="Drone before microphone"
            phase="beforeMicrophone"
            value={audioSessionState.phaseAudibility.beforeMicrophone}
            timeline={audioSessionTimeline}
          />
          <PhaseAudibilityControl
            label="Drone after microphone start"
            phase="afterMicrophoneStart"
            value={audioSessionState.phaseAudibility.afterMicrophoneStart}
            timeline={audioSessionTimeline}
          />
          <PhaseAudibilityControl
            label="Drone after microphone stop"
            phase="afterMicrophoneStop"
            value={audioSessionState.phaseAudibility.afterMicrophoneStop}
            timeline={audioSessionTimeline}
          />
        </div>
        <div className="reference-audio-session-actions">
          <h4>Experimental audio-session preparation</h4>
          <p>
            Diagnostic only. Restore the previous type before requesting the
            microphone.
          </p>
          <DiagnosticAction
            label="Prepare playback audio session"
            disabled={testsBusy || !audioSessionState.preparation.available}
            onClick={() => audioSessionTimeline?.prepare('playback')}
          />
          <DiagnosticAction
            label="Prepare playback and recreate output context"
            disabled={testsBusy || !audioSessionState.preparation.available}
            onClick={() => {
              audioSessionTimeline?.prepare('playback');
              onRecreateContext?.();
            }}
          />
          <DiagnosticAction
            label="Prepare play-and-record audio session"
            disabled={testsBusy || !audioSessionState.preparation.available}
            onClick={() => audioSessionTimeline?.prepare('play-and-record')}
          />
          <DiagnosticAction
            label="Restore prior audio session"
            disabled={
              testsBusy || audioSessionState.preparation.priorType === null
            }
            onClick={() => audioSessionTimeline?.restore()}
          />
          <p role="status">
            Session experiment: {audioSessionState.preparation.result}
          </p>
        </div>
      </section>

      <section
        className="reference-audio-section"
        aria-labelledby="audio-signal-heading"
      >
        <h3 id="audio-signal-heading">Signal result</h3>
        <SignalResult
          label="Persistent drone path"
          signal={diagnostics.persistentSignal}
        />
        <TestResult
          label="Engine output test"
          test={diagnostics.engineOutputTest}
        />
        <TestResult
          label="Direct Web Audio"
          test={diagnostics.directOutputTest}
        />
        <TestResult
          label="Constant gain"
          test={diagnostics.constantGainOutputTest}
        />
        <TestResult
          label="Recreated context"
          test={diagnostics.recreatedContextOutputTest}
        />
        <p className="reference-audio-caution">
          Active digital signal does not prove physical speaker audibility.
        </p>
      </section>

      <DiagnosticSection title="Context">
        <DiagnosticGrid
          values={[
            ['User agent', diagnostics.userAgentSummary],
            ['Secure context', yesNo(diagnostics.secureContext)],
            ['Constructor', diagnostics.constructorName],
            ['Context generation', diagnostics.contextGenerationId ?? '—'],
            [
              'Previous generation',
              diagnostics.previousContextGenerationId ?? '—',
            ],
            ['Context close', diagnostics.contextCloseResult],
            ['Context state', diagnostics.contextState],
            ['Sample rate', diagnostics.contextSampleRate ?? '—'],
            ['Base latency', formatNumber(diagnostics.contextBaseLatency, 5)],
            [
              'Destination channels',
              diagnostics.destinationChannelCount ?? '—',
            ],
            [
              'Rendering clock',
              diagnostics.renderingClockAdvanced === null
                ? 'not checked'
                : diagnostics.renderingClockAdvanced
                  ? 'advanced'
                  : 'stalled',
            ],
            [
              'Explicit reactivation',
              diagnostics.requiresExplicitReactivation
                ? 'required'
                : 'not required',
            ],
            [
              'AudioSession available',
              yesNo(diagnostics.audioSession.available),
            ],
            ['AudioSession type', diagnostics.audioSession.type ?? '—'],
            ['AudioSession state', diagnostics.audioSession.state ?? '—'],
          ]}
        />
      </DiagnosticSection>

      <DiagnosticSection title="Current voice">
        <CompactDiagnostics diagnostics={diagnostics} />
      </DiagnosticSection>

      <DiagnosticSection title="Gain automation">
        <DiagnosticGrid
          values={[
            [
              'Voice current',
              formatNumber(diagnostics.voiceAutomation.currentValue, 6),
            ],
            [
              'Voice target',
              formatNumber(diagnostics.voiceAutomation.scheduledTarget, 6),
            ],
            ['Voice method', diagnostics.voiceAutomation.method],
            [
              'Voice context time',
              formatNumber(
                diagnostics.voiceAutomation.schedulingContextTime,
                5,
              ),
            ],
            [
              'Voice scheduled after running',
              yesNo(diagnostics.voiceAutomation.scheduledAfterRunning),
            ],
            [
              'Master current',
              formatNumber(diagnostics.masterAutomation.currentValue, 6),
            ],
            [
              'Master target',
              formatNumber(diagnostics.masterAutomation.scheduledTarget, 6),
            ],
            ['Master method', diagnostics.masterAutomation.method],
            [
              'Master context time',
              formatNumber(
                diagnostics.masterAutomation.schedulingContextTime,
                5,
              ),
            ],
            [
              'Master scheduled after running',
              yesNo(diagnostics.masterAutomation.scheduledAfterRunning),
            ],
          ]}
        />
      </DiagnosticSection>

      <DiagnosticSection title="Microphone dependency timeline">
        <DiagnosticGrid
          values={[
            ['Backend', diagnostics.backend],
            ['Timbre', diagnostics.timbreProfile],
            ['Predicted peak', formatNumber(diagnostics.predictedPeak, 6)],
            [
              'Session candidates',
              audioSessionState.preparation.candidateTypes.join(', ') || '—',
            ],
            ['Session result', audioSessionState.preparation.result],
            [
              'Session resulting type',
              audioSessionState.preparation.resultingType ?? '—',
            ],
          ]}
        />
        <p>
          Partials:{' '}
          {diagnostics.partials.length
            ? diagnostics.partials
                .map(
                  (partial) =>
                    `${partial.harmonic}× ${partial.frequencyHz.toFixed(2)} Hz @ ${partial.normalizedAmplitude.toFixed(4)}`,
                )
                .join(' · ')
            : 'not started'}
        </p>
        <ol
          aria-label="Audio session snapshot timeline"
          className="reference-audio-log"
        >
          {audioSessionState.snapshots.map((entry) => (
            <li key={entry.sequence}>
              +{entry.relativeTimeMs.toFixed(1)} ms — {entry.label} — session{' '}
              {entry.audioSessionType ?? '—'}/{entry.audioSessionState ?? '—'};
              drone {entry.droneContextState}; mic{' '}
              {entry.microphoneContextState}; tracks{' '}
              {entry.activeMicrophoneTrackCount}; RMS{' '}
              {formatNumber(entry.outputRms, 6)}; audible{' '}
              {entry.dronePhysicalAnnotation}
            </li>
          ))}
        </ol>
      </DiagnosticSection>

      <DiagnosticSection title="Native media comparison">
        <DiagnosticGrid
          values={[
            ['Status', nativeAudio.state.status],
            ['Play result', nativeAudio.state.playResult],
            ['Playing event', yesNo(nativeAudio.state.playingEventReceived)],
            ['Timeupdate', yesNo(nativeAudio.state.timeUpdateReceived)],
            ['Current time', nativeAudio.state.currentTime.toFixed(3)],
            ['Ended event', yesNo(nativeAudio.state.endedEventReceived)],
            ['Paused', yesNo(nativeAudio.state.paused)],
            ['Error', nativeAudio.state.errorMessage ?? 'none'],
            ['Events', nativeAudio.state.events.join(', ') || 'none'],
          ]}
        />
      </DiagnosticSection>

      <DiagnosticSection title="Lifecycle log">
        <ol
          aria-label="Reference audio lifecycle log"
          className="reference-audio-log"
        >
          {diagnostics.lifecycleLog.map((event) => (
            <li key={event.sequence}>
              +{event.relativeTimeMs.toFixed(1)} ms — {event.name}
              {event.detail ? ` — ${event.detail}` : ''}
            </li>
          ))}
        </ol>
      </DiagnosticSection>

      <section
        className="reference-audio-section"
        aria-labelledby="copy-report-heading"
      >
        <h3 id="copy-report-heading">Copy report</h3>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void copyReport()}
        >
          Copy audio diagnostic report
        </button>
        <p role="status">{copyStatus}</p>
        {showFallback && (
          <textarea
            ref={fallbackRef}
            aria-label="Audio diagnostic report copy fallback"
            readOnly
            value={report}
            rows={10}
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </section>
    </details>
  );
}

function DiagnosticAction({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="secondary-button"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ManualAudibilityControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ManualAudibilityResult;
  onChange: (value: ManualAudibilityResult) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      {(['yes', 'no', 'not-recorded'] as const).map((option) => (
        <button
          key={option}
          type="button"
          className="secondary-button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option === 'not-recorded'
            ? 'Not recorded'
            : option === 'yes'
              ? 'Yes'
              : 'No'}
        </button>
      ))}
    </fieldset>
  );
}

function PhaseAudibilityControl({
  label,
  phase,
  value,
  timeline,
}: {
  label: string;
  phase: keyof PhaseAudibilityResults;
  value: PhaseAudibilityResult;
  timeline: AudioSessionDiagnosticTimeline | null;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      {(['audible', 'silent', 'not-tested'] as const).map((option) => (
        <button
          key={option}
          type="button"
          className="secondary-button"
          aria-pressed={value === option}
          onClick={() => timeline?.setPhaseAudibility(phase, option)}
        >
          {option === 'not-tested'
            ? 'Not tested'
            : option === 'audible'
              ? 'Audible'
              : 'Silent'}
        </button>
      ))}
    </fieldset>
  );
}

function SignalResult({
  label,
  signal,
}: {
  label: string;
  signal: ReferenceDroneSignalMeasurement;
}) {
  const classification =
    signal.classification === 'digitally-active'
      ? 'Active'
      : signal.classification === 'digitally-silent'
        ? 'Silent'
        : 'Not measured';
  return (
    <div
      className="reference-audio-signal"
      aria-label={`${label} signal result`}
    >
      <strong>{label}</strong>
      <span>Digital signal before destination: {classification}</span>
      <span>
        RMS {formatNumber(signal.rms, 7)} · peak {formatNumber(signal.peak, 7)}
      </span>
      <span>
        Active {signal.consecutiveActiveMeasurements} · silent{' '}
        {signal.consecutiveSilentMeasurements} · analyser{' '}
        {signal.analyserGenerationId ?? '—'}
      </span>
    </div>
  );
}

function TestResult({
  label,
  test,
}: {
  label: string;
  test: ReferenceDroneDiagnosticTestResult;
}) {
  return (
    <div className="reference-audio-test-result">
      <p>
        <strong>{label}</strong> — {test.status}
      </p>
      <p>{test.graphPath}</p>
      <SignalResult label={label} signal={test.signal} />
    </div>
  );
}

function DiagnosticSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="reference-audio-section">
      <summary>{title}</summary>
      {children}
    </details>
  );
}

function CompactDiagnostics({ diagnostics }: { diagnostics: Diagnostics }) {
  return (
    <DiagnosticGrid
      label="Reference-drone diagnostics values"
      values={[
        ['Context', diagnostics.contextState],
        ['Engine', diagnostics.engineState],
        ['Voice', diagnostics.voiceState],
        ['Voice generation', diagnostics.voiceGenerationId ?? '—'],
        ['Graph connected', yesNo(diagnostics.graphConnected)],
        ['Destination connected', yesNo(diagnostics.destinationConnected)],
        ['Oscillator started', yesNo(diagnostics.oscillatorStarted)],
        ['MIDI', diagnostics.midiNote ?? '—'],
        [
          'Frequency',
          diagnostics.frequencyHz === null
            ? 'not set'
            : `${formatNumber(diagnostics.frequencyHz, 2)} Hz`,
        ],
        ['Effective gain', formatNumber(diagnostics.effectiveGain)],
        ['Last command', diagnostics.lastCommand ?? '—'],
        ['Last error', diagnostics.errorCode ?? 'none'],
      ]}
    />
  );
}

function DiagnosticGrid({
  values,
  label,
}: {
  values: ReadonlyArray<readonly [string, string | number]>;
  label?: string;
}) {
  return (
    <dl aria-label={label} className="reference-audio-diagnostic-grid">
      {values.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatNumber(value: number | null, digits = 3): string {
  return value === null ? 'not set' : value.toFixed(digits);
}

function yesNo(value: boolean | null): string {
  return value === null ? 'not set' : value ? 'yes' : 'no';
}

function isTestBusy(test: ReferenceDroneDiagnosticTestResult): boolean {
  return test.status === 'starting' || test.status === 'playing';
}
