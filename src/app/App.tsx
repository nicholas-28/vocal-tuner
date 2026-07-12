import { PitchMonitor } from '../components/PitchMonitor';
import { TunerReadout } from '../components/TunerReadout';

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Pitch monitor</p>
          <h1>Vocal Tuner</h1>
        </div>
        <span className="status" role="status">
          <span className="status__dot" aria-hidden="true" />
          Microphone inactive
        </span>
      </header>

      <TunerReadout />
      <PitchMonitor />

      <section className="controls" aria-label="Microphone controls">
        <button className="primary-button" type="button">
          Start microphone
        </button>
        <p className="privacy-note">
          Your microphone audio will be processed locally on this device.
        </p>
      </section>
    </main>
  );
}
