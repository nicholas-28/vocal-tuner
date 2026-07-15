import { formatCompactBuildInfo } from '../config/buildInfo';
import type { BuildInfo } from '../types/buildInfo';
import type { ReferenceDroneDiagnostics } from '../types/referenceDrone';

const value = (input: string | number | boolean | null): string =>
  input === null ? 'not available' : String(input);

export function formatAudioDiagnosticReport(
  diagnostics: ReferenceDroneDiagnostics,
  buildInfo: BuildInfo,
): string {
  const rows: Array<[string, string | number | boolean | null]> = [
    ['Deployment', formatCompactBuildInfo(buildInfo)],
    ['User agent', diagnostics.userAgentSummary],
    ['Secure context', diagnostics.secureContext],
    ['AudioContext available', diagnostics.constructorAvailable],
    ['Constructor', diagnostics.constructorName],
    ['Engine generation', diagnostics.engineGenerationId],
    ['Context generation', diagnostics.contextGenerationId],
    ['Context state', diagnostics.contextState],
    ['Sample rate', diagnostics.contextSampleRate],
    ['Base latency', diagnostics.contextBaseLatency],
    ['Destination channels', diagnostics.destinationChannelCount],
    ['Engine state', diagnostics.engineState],
    ['Voice state', diagnostics.voiceState],
    ['Voice generation', diagnostics.voiceGenerationId],
    ['Active MIDI', diagnostics.midiNote],
    ['Frequency Hz', diagnostics.frequencyHz],
    ['Oscillator type', diagnostics.oscillatorType],
    ['Oscillator created', diagnostics.oscillatorCreated],
    ['Oscillator started', diagnostics.oscillatorStarted],
    ['Oscillator ended', diagnostics.oscillatorEnded],
    ['Voice gain connected', diagnostics.voiceGainConnected],
    ['Master gain connected', diagnostics.masterGainConnected],
    ['Destination connected', diagnostics.destinationConnected],
    ['Voice gain target', diagnostics.voiceGainTarget],
    ['Voice gain current', diagnostics.voiceGainCurrent],
    ['Master gain target', diagnostics.masterGain],
    ['Master gain current', diagnostics.masterGainCurrent],
    ['Effective gain', diagnostics.effectiveGain],
    ['Last user activation ms', diagnostics.lastUserActivationTimestampMs],
    ['Last command', diagnostics.lastCommand],
    ['Resume requested', diagnostics.resumeRequested],
    ['Resume result', diagnostics.resumeResult],
    ['State after resume', diagnostics.contextStateAfterResume],
    ['Rendering clock advanced', diagnostics.renderingClockAdvanced],
    ['Last statechange ms', diagnostics.lastStateChangeTimestampMs],
    ['Last visibility change', diagnostics.lastVisibilityChange],
    ['Document visibility', diagnostics.documentVisibilityState],
    ['Page lifecycle', diagnostics.pageLifecycleState],
    [
      'Explicit reactivation required',
      diagnostics.requiresExplicitReactivation,
    ],
    ['Output test', diagnostics.outputTestStatus],
    ['Last error code', diagnostics.errorCode],
    ['Last error message', diagnostics.errorMessage],
  ];
  return [
    'Vocal Tuner audio diagnostic report',
    'No microphone audio or samples are included.',
    '',
    ...rows.map(([label, input]) => `${label}: ${value(input)}`),
    '',
    'Lifecycle log:',
    ...(diagnostics.lifecycleLog.length
      ? diagnostics.lifecycleLog.map(
          (event) =>
            `${event.sequence}. +${event.relativeTimeMs.toFixed(1)} ms — ${event.name}${event.detail ? ` — ${event.detail}` : ''}`,
        )
      : ['(empty)']),
  ].join('\n');
}
