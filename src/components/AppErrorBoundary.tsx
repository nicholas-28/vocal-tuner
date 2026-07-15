import { Component, type ErrorInfo } from 'react';
import { BUILD_INFO } from '../config/buildInfo';
import type {
  AppErrorBoundaryProps,
  AppErrorBoundaryState,
} from '../types/appError';

const reloadApplication = () => window.location.reload();

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (BUILD_INFO.deploymentEnvironment === 'development')
      console.error('Unexpected application render failure', error, info);
  }

  render() {
    if (this.state.error === null) return this.props.children;
    const showDetail =
      this.props.showDevelopmentDetail ??
      BUILD_INFO.deploymentEnvironment === 'development';
    return (
      <main className="app-shell app-error" role="alert">
        <section aria-labelledby="app-error-heading">
          <p className="eyebrow">Vocal Tuner</p>
          <h1 id="app-error-heading">The application needs to reload</h1>
          <p>
            An unexpected display error occurred. Microphone audio was not
            uploaded or stored.
          </p>
          {showDetail && (
            <pre aria-label="Development error detail">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            className="primary-button"
            onClick={this.props.reload ?? reloadApplication}
          >
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
