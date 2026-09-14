import { useState } from 'react';
import { transitionAccuracyLabel } from '../tuner/labelHysteresis';

export function useAccuracyLabel(
  cents: number | null,
  identity: string | number | null,
) {
  const [state, setState] = useState(() => ({
    cents,
    identity,
    label: transitionAccuracyLabel(null, cents),
  }));
  if (!Object.is(state.cents, cents) || state.identity !== identity) {
    const label = transitionAccuracyLabel(
      state.identity === identity ? state.label : null,
      cents,
    );
    setState({ cents, identity, label });
    return label;
  }
  return state.label;
}
