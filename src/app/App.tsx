import { PitchMonitor } from '../components/PitchMonitor';
import { PitchDiagnostics } from '../components/PitchDiagnostics';
import {
  MicrophoneControls,
  MicrophoneStatus,
} from '../components/MicrophoneControls';
import { TunerReadout } from '../components/TunerReadout';
import { useMicrophone } from '../hooks/useMicrophone';
import { useMusicalPitchFromDetection } from '../hooks/useMusicalPitch';
import { usePitchDetection } from '../hooks/usePitchDetection';

export function App() {
  const pitch = usePitchDetection();
  const { state, inputLevel, start, stop } = useMicrophone(undefined, {
    onDetection: pitch.onDetection,
    onAnalysisError: pitch.onError,
    onAnalysisReset: pitch.reset,
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
      <PitchMonitor />
      <MicrophoneControls
        state={state}
        onStart={() => void start()}
        onStop={() => void stop()}
      />
    </main>
  );
}
