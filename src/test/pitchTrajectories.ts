/** Synthetic cents observations, not audio or a model of a particular singer. */
export function createPitchTrajectory(
  name:
    | 'center'
    | 'vibrato'
    | 'biased-vibrato'
    | 'flat15'
    | 'flat30'
    | 'approach'
    | 'random'
    | 'silence',
  cadenceHz = 15,
  phase = 0,
) {
  let seed = 12345;
  return Array.from({ length: cadenceHz * 4 }, (_, index) => {
    const seconds = index / cadenceHz;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const vibrato = 30 * Math.sin(2 * Math.PI * 5 * seconds + phase);
    const cents =
      name === 'center'
        ? 0
        : name === 'vibrato'
          ? vibrato
          : name === 'biased-vibrato'
            ? -15 + vibrato
            : name === 'flat15'
              ? -15
              : name === 'flat30'
                ? -30
                : name === 'approach'
                  ? -40 + (40 * index) / (cadenceHz * 4 - 1)
                  : name === 'random'
                    ? (seed / 2 ** 32 - 0.5) * 80
                    : null;
    return { timestampMs: 1 + (index * 1000) / cadenceHz, cents };
  });
}
