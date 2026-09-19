import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { createRuntimeFeaturePolicy } from './config/runtimeFeatures';
import { PlayModeApp } from './pad/PlayModeApp';
import './styles.css';

const features = createRuntimeFeaturePolicy(window.location.search);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      {/* These trees stay exclusive so they can never own parallel microphone graphs. */}
      {features.enablePlayMode ? <PlayModeApp /> : <App />}
    </AppErrorBoundary>
  </StrictMode>,
);
