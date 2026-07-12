import { pitchAnalysisConfig } from '../audio/pitchAnalysis';
import type { MicrophoneState } from '../types/microphone';
import type {
  PitchAnalysisState,
  PitchDiagnostics as Diagnostics,
} from '../types/pitch';

type PitchDiagnosticsProps = {
  diagnostics: Diagnostics;
  microphoneState: MicrophoneState;
};

const statusLabels: Record<PitchAnalysisState, string> = {
  inactive: 'Inactive',
  listening: 'Listening',
  silence: 'No stable pitch — silence',
  'low-confidence': 'No stable pitch — low confidence',
  detected: 'Stable input',
  error: 'Detector error',
};

export function PitchDiagnostics({
  diagnostics,
  microphoneState,
}: PitchDiagnosticsProps) {
  const state =
    microphoneState === 'active' && diagnostics.state === 'inactive'
      ? 'listening'
      : diagnostics.state;
  const detection = diagnostics.detection;

  return (
    <section className="diagnostics" aria-label="Pitch detector diagnostics">
      <div
        className="diagnostics__status"
        role="status"
        aria-live="polite"
        aria-label="Pitch detector status"
      >
        <span>Detector</span>
        <strong>{statusLabels[state]}</strong>
      </div>
      <dl className="diagnostics__grid">
        <div>
          <dt>Confidence</dt>
          <dd>
            {detection ? `${Math.round(detection.confidence * 100)}%` : '—'}
          </dd>
        </div>
        <div>
          <dt>Signal RMS</dt>
          <dd>{detection ? detection.rms.toFixed(3) : '—'}</dd>
        </div>
        <div>
          <dt>Computation</dt>
          <dd>
            {detection ? `${detection.analysisDurationMs.toFixed(1)} ms` : '—'}
          </dd>
        </div>
        <div>
          <dt>UI cadence</dt>
          <dd>
            {diagnostics.cadenceHz
              ? `${diagnostics.cadenceHz.toFixed(1)} Hz`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Window</dt>
          <dd>{pitchAnalysisConfig.fftSize} samples</dd>
        </div>
      </dl>
    </section>
  );
}
