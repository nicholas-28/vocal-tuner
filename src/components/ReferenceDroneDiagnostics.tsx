import { useMemo, useRef, useState } from 'react';
import { BUILD_INFO } from '../config/buildInfo';
import { formatAudioDiagnosticReport } from '../audio/referenceDroneDiagnosticReport';
import type { ReferenceDroneDiagnostics as Diagnostics } from '../types/referenceDrone';

type ReferenceDroneDiagnosticsProps = {
  diagnostics: Diagnostics;
  audioDiagnosticMode?: boolean;
  onPlayOutputTest?: () => void;
};

function formatNumber(value: number | null, digits = 3): string {
  return value === null ? 'not set' : value.toFixed(digits);
}

export function ReferenceDroneDiagnostics({
  diagnostics,
  audioDiagnosticMode = false,
  onPlayOutputTest,
}: ReferenceDroneDiagnosticsProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const report = useMemo(
    () => formatAudioDiagnosticReport(diagnostics, BUILD_INFO),
    [diagnostics],
  );
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

  return (
    <details className="reference-drone-diagnostics" open={audioDiagnosticMode}>
      <summary>
        {audioDiagnosticMode
          ? 'Reference audio diagnostics'
          : 'Reference-drone diagnostics'}
      </summary>
      {audioDiagnosticMode && (
        <div className="reference-audio-diagnostics__actions">
          <button
            type="button"
            className="secondary-button"
            disabled={
              diagnostics.outputTestStatus === 'starting' ||
              diagnostics.outputTestStatus === 'playing' ||
              diagnostics.engineState === 'starting' ||
              diagnostics.engineState === 'playing' ||
              diagnostics.engineState === 'changing' ||
              diagnostics.engineState === 'stopping'
            }
            onClick={onPlayOutputTest}
          >
            Play 1-second output test
          </button>
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
        </div>
      )}
      <dl aria-label="Reference-drone diagnostics values">
        {audioDiagnosticMode && (
          <>
            <DiagnosticValue
              label="User agent"
              value={diagnostics.userAgentSummary}
            />
            <DiagnosticValue
              label="Secure context"
              value={diagnostics.secureContext ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Constructor available"
              value={diagnostics.constructorAvailable ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Constructor"
              value={diagnostics.constructorName}
            />
            <DiagnosticValue
              label="Engine generation"
              value={diagnostics.engineGenerationId}
            />
            <DiagnosticValue
              label="Context generation"
              value={diagnostics.contextGenerationId ?? '—'}
            />
            <DiagnosticValue
              label="Sample rate"
              value={diagnostics.contextSampleRate ?? '—'}
            />
            <DiagnosticValue
              label="Base latency"
              value={diagnostics.contextBaseLatency ?? '—'}
            />
            <DiagnosticValue
              label="Destination channels"
              value={diagnostics.destinationChannelCount ?? '—'}
            />
            <DiagnosticValue
              label="Voice generation"
              value={diagnostics.voiceGenerationId ?? '—'}
            />
            <DiagnosticValue
              label="Oscillator created"
              value={diagnostics.oscillatorCreated ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Oscillator ended"
              value={diagnostics.oscillatorEnded ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Voice gain connected"
              value={diagnostics.voiceGainConnected ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Master gain connected"
              value={diagnostics.masterGainConnected ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Last activation"
              value={diagnostics.lastUserActivationTimestampMs ?? '—'}
            />
            <DiagnosticValue
              label="Resume requested"
              value={diagnostics.resumeRequested ? 'yes' : 'no'}
            />
            <DiagnosticValue
              label="Resume result"
              value={diagnostics.resumeResult}
            />
            <DiagnosticValue
              label="State after resume"
              value={diagnostics.contextStateAfterResume ?? '—'}
            />
            <DiagnosticValue
              label="Rendering clock"
              value={
                diagnostics.renderingClockAdvanced === null
                  ? 'not checked'
                  : diagnostics.renderingClockAdvanced
                    ? 'advanced'
                    : 'stalled'
              }
            />
            <DiagnosticValue
              label="Last statechange"
              value={diagnostics.lastStateChangeTimestampMs ?? '—'}
            />
            <DiagnosticValue
              label="Last visibility change"
              value={diagnostics.lastVisibilityChange ?? '—'}
            />
            <DiagnosticValue
              label="Explicit reactivation"
              value={
                diagnostics.requiresExplicitReactivation ? 'required' : 'no'
              }
            />
            <DiagnosticValue
              label="Visibility"
              value={diagnostics.documentVisibilityState}
            />
            <DiagnosticValue
              label="Page lifecycle"
              value={diagnostics.pageLifecycleState}
            />
            <DiagnosticValue
              label="Output test"
              value={diagnostics.outputTestStatus}
            />
          </>
        )}
        <DiagnosticValue label="Context" value={diagnostics.contextState} />
        <DiagnosticValue label="Engine" value={diagnostics.engineState} />
        <DiagnosticValue label="Voice" value={diagnostics.voiceState} />
        <DiagnosticValue
          label="Graph connected"
          value={diagnostics.graphConnected ? 'yes' : 'no'}
        />
        <DiagnosticValue
          label="Destination connected"
          value={diagnostics.destinationConnected ? 'yes' : 'no'}
        />
        <DiagnosticValue
          label="Oscillator started"
          value={diagnostics.oscillatorStarted ? 'yes' : 'no'}
        />
        <DiagnosticValue label="MIDI" value={diagnostics.midiNote ?? '—'} />
        <DiagnosticValue
          label="Frequency"
          value={
            diagnostics.frequencyHz === null
              ? 'not set'
              : `${formatNumber(diagnostics.frequencyHz, 2)} Hz`
          }
        />
        <DiagnosticValue
          label="Oscillator"
          value={diagnostics.oscillatorType}
        />
        <DiagnosticValue
          label="Voice gain target"
          value={formatNumber(diagnostics.voiceGainTarget)}
        />
        {audioDiagnosticMode && (
          <DiagnosticValue
            label="Voice gain current"
            value={formatNumber(diagnostics.voiceGainCurrent)}
          />
        )}
        <DiagnosticValue
          label="Master gain"
          value={formatNumber(diagnostics.masterGain)}
        />
        {audioDiagnosticMode && (
          <DiagnosticValue
            label="Master gain current"
            value={formatNumber(diagnostics.masterGainCurrent)}
          />
        )}
        <DiagnosticValue
          label="Effective gain"
          value={formatNumber(diagnostics.effectiveGain)}
        />
        <DiagnosticValue
          label="Last command"
          value={diagnostics.lastCommand ?? '—'}
        />
        <DiagnosticValue
          label="Last error"
          value={`${diagnostics.errorCode ?? 'none'}${diagnostics.errorMessage ? ` — ${diagnostics.errorMessage}` : ''}`}
        />
      </dl>
      {audioDiagnosticMode && (
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
      )}
    </details>
  );
}

function DiagnosticValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
