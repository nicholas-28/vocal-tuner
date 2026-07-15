import { useMemo } from 'react';
import { PitchMonitor } from '../components/PitchMonitor';
import { PitchDiagnostics } from '../components/PitchDiagnostics';
import { DeveloperBuildInfo } from '../components/DeveloperBuildInfo';
import {
  MicrophoneControls,
  MicrophoneStatus,
} from '../components/MicrophoneControls';
import { TunerReadout } from '../components/TunerReadout';
import { useMicrophone } from '../hooks/useMicrophone';
import { useMusicalPitchFromDetection } from '../hooks/useMusicalPitch';
import { usePitchHistory } from '../hooks/usePitchHistory';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { usePitchContinuity } from '../hooks/usePitchContinuity';
import { useVisiblePitchRange } from '../hooks/useVisiblePitchRange';
import { useCentsMeterDemo } from '../hooks/useCentsMeterDemo';
import { createRuntimeFeaturePolicy } from '../config/runtimeFeatures';

export function App() {
  const runtimeFeatures = useMemo(
    () => createRuntimeFeaturePolicy(window.location.search),
    [],
  );
  const pitch = usePitchDetection();
  const continuity = usePitchContinuity();
  const history = usePitchHistory();
  const visiblePitchRange = useVisiblePitchRange();
  const { state, inputLevel, start, stop } = useMicrophone(undefined, {
    onSessionStarted: () => {
      continuity.reset();
      history.startSession();
    },
    onDetection: (detection) => {
      pitch.onDetection(detection);
      history.onContinuityDecision(continuity.onDetection(detection));
    },
    onAnalysisError: pitch.onError,
    onAnalysisReset: () => {
      pitch.reset();
      continuity.reset();
      history.stopSession();
    },
  });
  const musicalPitch = useMusicalPitchFromDetection(
    continuity.state.lastAcceptedPitch,
  );
  const centsMeterDemo = useCentsMeterDemo(
    runtimeFeatures.enableCentsMeterDemo,
  );
  const readoutPitch =
    centsMeterDemo === null ? musicalPitch : centsMeterDemo.pitch;
  const readoutContinuityStatus =
    centsMeterDemo?.status ?? continuity.state.status;
  const readoutTimestampMs =
    centsMeterDemo === null
      ? continuity.state.lastAcceptedAtMs
      : centsMeterDemo.timestampMs;
  const observationTimestampMs =
    centsMeterDemo === null
      ? continuity.state.lastPublicationAtMs
      : centsMeterDemo.timestampMs;
  const practiceMicrophoneActive =
    centsMeterDemo?.practiceMicrophoneActive ?? state === 'active';

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Pitch monitor</p>
          <h1>Vocal Tuner</h1>
        </div>
      </header>

      <MicrophoneStatus state={state} inputLevel={inputLevel} />
      <TunerReadout
        pitch={readoutPitch}
        continuityStatus={readoutContinuityStatus}
        lastAcceptedAgeMs={
          centsMeterDemo !== null
            ? 0
            : continuity.state.lastAcceptedAtMs === null ||
                continuity.state.lastPublicationAtMs === null
              ? null
              : continuity.state.lastPublicationAtMs -
                continuity.state.lastAcceptedAtMs
        }
        measurementTimestampMs={readoutTimestampMs}
      />
      {runtimeFeatures.showDeveloperDiagnostics && (
        <PitchDiagnostics
          diagnostics={pitch.diagnostics}
          microphoneState={state}
          continuity={continuity.state}
        />
      )}
      <PitchMonitor
        history={history.history}
        summary={history.summary}
        active={state === 'active'}
        captureState={history.captureState}
        sessionVersion={history.sessionVersion}
        toEffectiveTimestamp={history.toEffectiveTimestamp}
        durationMs={history.durationMs}
        onClear={history.clear}
        onPause={history.pause}
        onResume={history.resume}
        visibleRange={visiblePitchRange.range}
        selectedRangePresetId={visiblePitchRange.selectedPresetId}
        canShiftRangeDown={visiblePitchRange.canShiftDown}
        canShiftRangeUp={visiblePitchRange.canShiftUp}
        currentMidi={musicalPitch?.fractionalMidi ?? null}
        onSelectRangePreset={visiblePitchRange.selectPreset}
        onShiftRangeDown={visiblePitchRange.shiftDownOctave}
        onShiftRangeUp={visiblePitchRange.shiftUpOctave}
        onResetRange={visiblePitchRange.reset}
        detectedPitch={readoutPitch}
        continuityStatus={readoutContinuityStatus}
        measurementTimestampMs={readoutTimestampMs}
        observationTimestampMs={observationTimestampMs}
        practiceMicrophoneActive={practiceMicrophoneActive}
        showReferenceDroneDiagnostics={
          runtimeFeatures.showReferenceDroneDiagnostics
        }
      />
      <MicrophoneControls
        state={state}
        onStart={() => void start()}
        onStop={() => void stop()}
      />
      {runtimeFeatures.showDeveloperDiagnostics && <DeveloperBuildInfo />}
    </main>
  );
}
