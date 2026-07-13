import type { ReferenceDroneDiagnostics as Diagnostics } from '../types/referenceDrone';

type ReferenceDroneDiagnosticsProps = {
  diagnostics: Diagnostics;
};

function formatNumber(value: number | null, digits = 3): string {
  return value === null ? 'not set' : value.toFixed(digits);
}

export function ReferenceDroneDiagnostics({
  diagnostics,
}: ReferenceDroneDiagnosticsProps) {
  return (
    <details className="reference-drone-diagnostics">
      <summary>Reference-drone diagnostics</summary>
      <dl aria-label="Reference-drone diagnostics values">
        <div>
          <dt>Context</dt>
          <dd>{diagnostics.contextState}</dd>
        </div>
        <div>
          <dt>Engine</dt>
          <dd>{diagnostics.engineState}</dd>
        </div>
        <div>
          <dt>Voice</dt>
          <dd>{diagnostics.voiceState}</dd>
        </div>
        <div>
          <dt>Graph connected</dt>
          <dd>{diagnostics.graphConnected ? 'yes' : 'no'}</dd>
        </div>
        <div>
          <dt>Destination connected</dt>
          <dd>{diagnostics.destinationConnected ? 'yes' : 'no'}</dd>
        </div>
        <div>
          <dt>Oscillator started</dt>
          <dd>{diagnostics.oscillatorStarted ? 'yes' : 'no'}</dd>
        </div>
        <div>
          <dt>MIDI</dt>
          <dd>{diagnostics.midiNote ?? '—'}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>
            {diagnostics.frequencyHz === null
              ? 'not set'
              : `${formatNumber(diagnostics.frequencyHz, 2)} Hz`}
          </dd>
        </div>
        <div>
          <dt>Oscillator</dt>
          <dd>{diagnostics.oscillatorType}</dd>
        </div>
        <div>
          <dt>Voice gain target</dt>
          <dd>{formatNumber(diagnostics.voiceGainTarget)}</dd>
        </div>
        <div>
          <dt>Master gain</dt>
          <dd>{formatNumber(diagnostics.masterGain)}</dd>
        </div>
        <div>
          <dt>Effective gain</dt>
          <dd>{formatNumber(diagnostics.effectiveGain)}</dd>
        </div>
        <div>
          <dt>Last command</dt>
          <dd>{diagnostics.lastCommand ?? '—'}</dd>
        </div>
        <div>
          <dt>Last error</dt>
          <dd>
            {diagnostics.errorCode ?? 'none'}
            {diagnostics.errorMessage ? ` — ${diagnostics.errorMessage}` : ''}
          </dd>
        </div>
      </dl>
    </details>
  );
}
