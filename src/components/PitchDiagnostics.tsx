import { pitchAnalysisConfig } from '../audio/pitchAnalysis';
import type { MicrophoneState } from '../types/microphone';
import type {
  PitchAnalysisState,
  PitchDiagnostics as Diagnostics,
} from '../types/pitch';
import type { PitchRejectionReason } from '../types/pitch';
import type { PitchContinuityState } from '../types/pitchContinuity';
import { DEFAULT_PITCH_CONTINUITY_CONFIG } from '../pitch/pitchContinuityConfig';

type PitchDiagnosticsProps = {
  diagnostics: Diagnostics;
  microphoneState: MicrophoneState;
  continuity?: PitchContinuityState;
};

const statusLabels: Record<PitchAnalysisState, string> = {
  inactive: 'Inactive',
  listening: 'Listening',
  silence: 'No stable pitch — silence',
  'low-confidence': 'No stable pitch — low confidence',
  detected: 'Stable input',
  error: 'Detector error',
};

const rejectionLabels: Record<PitchRejectionReason, string> = {
  silence: 'Signal too quiet',
  'no-candidate': 'No YIN candidate',
  'yin-threshold': 'Candidate above YIN threshold',
  'low-confidence': 'Candidate below confidence threshold',
  'invalid-frequency': 'Invalid candidate frequency',
  'out-of-range': 'Candidate outside supported range',
  detected: 'Accepted',
  'detector-error': 'Detector error',
};

export function PitchDiagnostics({
  diagnostics,
  microphoneState,
  continuity,
}: PitchDiagnosticsProps) {
  const state =
    microphoneState === 'active' && diagnostics.state === 'inactive'
      ? 'listening'
      : diagnostics.state;
  const detection = diagnostics.detection;
  const lastAcceptedAgeMs =
    continuity?.lastAcceptedAtMs != null &&
    continuity.lastPublicationAtMs != null
      ? continuity.lastPublicationAtMs - continuity.lastAcceptedAtMs
      : null;
  const uncertainDurationMs =
    continuity?.uncertainSinceMs != null &&
    continuity.lastPublicationAtMs != null
      ? continuity.lastPublicationAtMs - continuity.uncertainSinceMs
      : null;
  const completedUncertainties = continuity
    ? continuity.statistics.uncertaintiesRecovered +
      continuity.statistics.confirmedGaps
    : 0;
  const averageUncertaintyMs =
    continuity && completedUncertainties > 0
      ? continuity.statistics.totalUncertaintyDurationMs /
        completedUncertainties
      : null;

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
        {continuity ? (
          <>
            <div>
              <dt>Continuity</dt>
              <dd>{continuity.status}</dd>
            </div>
            <div>
              <dt>Grace period</dt>
              <dd>{DEFAULT_PITCH_CONTINUITY_CONFIG.gracePeriodMs} ms</dd>
            </div>
            <div>
              <dt>Threshold profile</dt>
              <dd>
                {continuity.status === 'unvoiced' ? 'Entry' : 'Continuation'}
              </dd>
            </div>
            <div>
              <dt>Last accepted age</dt>
              <dd>
                {lastAcceptedAgeMs === null
                  ? '—'
                  : `${Math.round(lastAcceptedAgeMs)} ms`}
              </dd>
            </div>
            <div>
              <dt>Uncertain duration</dt>
              <dd>
                {uncertainDurationMs === null
                  ? '—'
                  : `${Math.round(uncertainDurationMs)} ms`}
              </dd>
            </div>
            <div>
              <dt>Last decision</dt>
              <dd>{continuity.lastDecisionKind ?? '—'}</dd>
            </div>
            <div>
              <dt>Recovered / gaps</dt>
              <dd>
                {continuity.statistics.uncertaintiesRecovered} /{' '}
                {continuity.statistics.confirmedGaps}
              </dd>
            </div>
            <div>
              <dt>Candidate recovery</dt>
              <dd>Disabled</dd>
            </div>
            <div>
              <dt>Raw accepted / rejected</dt>
              <dd>
                {continuity.statistics.rawAcceptedFrames} /{' '}
                {continuity.statistics.rawRejectedFrames}
              </dd>
            </div>
            <div>
              <dt>Total publications</dt>
              <dd>{continuity.statistics.totalDetectorPublications}</dd>
            </div>
            <div>
              <dt>Consecutive accepted / rejected</dt>
              <dd>
                {continuity.consecutiveAcceptedCount} /{' '}
                {continuity.consecutiveRejectedCount}
              </dd>
            </div>
            <div>
              <dt>Candidate MIDI / distance</dt>
              <dd>
                {continuity.rawCandidateMidi?.toFixed(2) ?? '—'} /{' '}
                {continuity.candidateDistanceSemitones?.toFixed(2) ?? '—'}
              </dd>
            </div>
            <div>
              <dt>Average / maximum uncertainty</dt>
              <dd>
                {averageUncertaintyMs?.toFixed(0) ?? '—'} /{' '}
                {continuity.statistics.maximumUncertaintyDurationMs.toFixed(0)}{' '}
                ms
              </dd>
            </div>
            <div>
              <dt>Rejection counts</dt>
              <dd>
                {Object.entries(continuity.statistics.rejectionCounts)
                  .filter(([, count]) => count > 0)
                  .map(([reason, count]) => `${reason} ${count}`)
                  .join(' · ') || '—'}
              </dd>
            </div>
            <div>
              <dt>Last gap</dt>
              <dd>{continuity.lastGapReason ?? '—'}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>Accepted confidence</dt>
          <dd>
            {detection ? `${Math.round(detection.confidence * 100)}%` : '—'}
          </dd>
        </div>
        <div>
          <dt>Raw confidence</dt>
          <dd>
            {detection ? `${Math.round(detection.rawConfidence * 100)}%` : '—'}
          </dd>
        </div>
        <div>
          <dt>Raw candidate</dt>
          <dd>
            {detection?.rawCandidateFrequencyHz
              ? `${detection.rawCandidateFrequencyHz.toFixed(1)} Hz`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Rejection</dt>
          <dd>
            {detection ? rejectionLabels[detection.rejectionReason] : '—'}
          </dd>
        </div>
        <div>
          <dt>Signal RMS</dt>
          <dd>{detection ? detection.rms.toFixed(3) : '—'}</dd>
        </div>
        <div>
          <dt>Signal gate</dt>
          <dd>
            {detection ? (detection.signalPassed ? 'Passed' : 'Rejected') : '—'}
          </dd>
        </div>
        <div>
          <dt>Selected lag</dt>
          <dd>{detection?.selectedLag?.toFixed(2) ?? '—'}</dd>
        </div>
        <div>
          <dt>Minimum CMND</dt>
          <dd>{detection?.minimumYinValue?.toFixed(3) ?? '—'}</dd>
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
          <dt>Sample rate</dt>
          <dd>{detection ? `${detection.settings.sampleRate} Hz` : '—'}</dd>
        </div>
        <div>
          <dt>Window</dt>
          <dd>
            {detection
              ? `${detection.settings.fftSize} / ${detection.settings.windowDurationMs.toFixed(1)} ms`
              : `${pitchAnalysisConfig.fftSize} samples`}
          </dd>
        </div>
        <div>
          <dt>Thresholds</dt>
          <dd>
            {detection
              ? `RMS ${detection.settings.minimumRms} · YIN ${detection.settings.yinThreshold} · conf ${detection.settings.minimumConfidence}`
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
