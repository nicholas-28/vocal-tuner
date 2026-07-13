import type { TargetPitchDirection } from '../types/targetPitch';

export function formatTargetDistance(
  targetRelativeCents: number,
  targetLabel: string,
): string | null {
  if (!Number.isFinite(targetRelativeCents) || targetLabel.length === 0)
    return null;
  const absoluteCents = Math.abs(targetRelativeCents);
  if (absoluteCents <= 10) return `Within 10 cents of ${targetLabel}`;
  const relation = targetRelativeCents < 0 ? 'below' : 'above';
  if (absoluteCents < 100)
    return `${absoluteCents.toFixed(1)} cents ${relation} ${targetLabel}`;

  const wholeSemitones = Math.floor((absoluteCents + 1e-9) / 100);
  const residualCents = absoluteCents - wholeSemitones * 100;
  const octaves = Math.floor(wholeSemitones / 12);
  const semitones = wholeSemitones % 12;
  const parts: string[] = [];
  if (octaves > 0)
    parts.push(`${octaves} ${octaves === 1 ? 'octave' : 'octaves'}`);
  if (semitones > 0)
    parts.push(`${semitones} ${semitones === 1 ? 'semitone' : 'semitones'}`);
  if (residualCents >= 0.05) parts.push(`${residualCents.toFixed(1)} cents`);
  return `${joinParts(parts)} ${relation} ${targetLabel}`;
}

export function getTargetInstruction(
  direction: TargetPitchDirection,
): 'Raise the pitch' | 'On target' | 'Lower the pitch' {
  if (direction === 'below') return 'Raise the pitch';
  if (direction === 'above') return 'Lower the pitch';
  return 'On target';
}

function joinParts(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? '0 cents';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`;
}
