import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createAnalysisDurationProbe } from '../pitch/analysisDurationProbe';
import { AnalysisPerformanceDiagnostics } from './AnalysisPerformanceDiagnostics';

it('explains typical, tail, rolling maximum, and computation-only timing without new collection', () => {
  const probe = createAnalysisDurationProbe();
  for (let duration = 1; duration <= 100; duration++) probe.record(duration);
  render(<AnalysisPerformanceDiagnostics probe={probe} />);
  expect(
    screen.getByText(/p50 is the typical analysis time/),
  ).toHaveTextContent('95%');
  expect(screen.getByText(/latest 128 analyses/)).toHaveTextContent(
    'not microphone-to-screen delay',
  );
  expect(screen.getByLabelText('Pitch analysis timing')).toHaveTextContent(
    'p5050.00 msp9595.00 msMaximum100.00 msAbove 8 ms92',
  );
  expect(probe.getSummary().count).toBe(100);
});
