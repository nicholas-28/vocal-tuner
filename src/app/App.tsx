import { PitchMonitor } from '../components/PitchMonitor';
import { PitchDiagnostics } from '../components/PitchDiagnostics';
import {
  MicrophoneControls,
  MicrophoneStatus,
} from '../components/MicrophoneControls';
import { TunerReadout } from '../components/TunerReadout';
import { useMicrophone } from '../hooks/useMicrophone';
import { useMusicalPitchFromDetection } from '../hooks/useMusicalPitch';
import { usePitchHistory } from '../hooks/usePitchHistory';
import { usePitchDetection } from '../hooks/usePitchDetection';

export function App() {
  const pitch = usePitchDetection();
  const history = usePitchHistory();
  const { state, inputLevel, start, stop } = useMicrophone(undefined, {
    onSessionStarted: history.startSession,
    onDetection: (detection) => {
      pitch.onDetection(detection);
      history.onDetection(detection);
    },
    onAnalysisError: pitch.onError,
    onAnalysisReset: () => {
      pitch.reset();
      history.stopSession();
    },
  });
  const musicalPitch = useMusicalPitchFromDetection(
    pitch.diagnostics.detection,
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Pitch monitor</p>
          <h1>Vocal Tuner</h1>
        </div>
      </header>

      <MicrophoneStatus state={state} inputLevel={inputLevel} />
      <TunerReadout pitch={musicalPitch} />
      <PitchDiagnostics
        diagnostics={pitch.diagnostics}
        microphoneState={state}
      />
      <PitchMonitor
        summary={history.summary}
        durationMs={history.durationMs}
        onClear={history.clear}
      />
      <MicrophoneControls
        state={state}
        onStart={() => void start()}
        onStop={() => void stop()}
      />
    </main>
  );
}
