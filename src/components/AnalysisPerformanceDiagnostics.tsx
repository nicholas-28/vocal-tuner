import type { createCadenceProbe } from '../pitch/cadenceProbe';
import type { createAnalysisDurationProbe } from '../pitch/analysisDurationProbe';

export function AnalysisPerformanceDiagnostics({
  probe,
  cadence,
  active = false,
}: {
  probe: ReturnType<typeof createAnalysisDurationProbe>;
  cadence?: {
    analysis: ReturnType<typeof createCadenceProbe>;
    presentation: ReturnType<typeof createCadenceProbe>;
  } | null;
  active?: boolean;
}) {
  // Refresh on the existing presentation render; collection never sets state.
  const summary = probe.getSummary();
  const milliseconds = (value: number | null) =>
    value === null ? '—' : `${value.toFixed(2)} ms`;
  return (
    <details className="diagnostics analysis-performance">
      <summary>Pitch analysis performance</summary>
      <p>
        p50 is the typical analysis time (the median). p95 means 95% of these
        analyses finished within that time.
      </p>
      <p>
        These values cover the latest 128 analyses, not the whole session.
        Maximum is the slowest in this window; Above 8 ms counts analyses taking
        more than 8 ms. This measures computation, not microphone-to-screen
        delay.
      </p>
      {cadence && (
        <dl aria-label="Actual pitch cadence">
          {(['analysis', 'presentation'] as const).map((kind) => {
            const timing = cadence[kind].getSummary();
            const label = kind === 'analysis' ? 'Analysis' : 'Presentation';
            return (
              <div key={kind}>
                <dt>{label}</dt>
                <dd>
                  {active && timing.hz !== null
                    ? `~${timing.hz.toFixed(1)} Hz`
                    : '—'}{' '}
                  · median {milliseconds(timing.medianMs)} · p95{' '}
                  {milliseconds(timing.p95Ms)} · count {timing.count}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      <dl aria-label="Pitch analysis timing">
        <dt>Rolling observations (up to 128)</dt>
        <dd>{summary.count}</dd>
        <dt>p50</dt>
        <dd>{milliseconds(summary.p50Ms)}</dd>
        <dt>p95</dt>
        <dd>{milliseconds(summary.p95Ms)}</dd>
        <dt>Maximum</dt>
        <dd>{milliseconds(summary.maximumMs)}</dd>
        <dt>Above 8 ms</dt>
        <dd>{summary.above8Ms}</dd>
      </dl>
    </details>
  );
}
