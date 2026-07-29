import { formatCompactBuildInfo } from '../config/buildInfo';
import type { BuildInfo } from '../types/buildInfo';
import type { AudioDiagnosticReportContext } from '../types/audioDiagnostics';
import type { ReferenceDroneDiagnostics } from '../types/referenceDrone';

const value = (input: string | number | boolean | null): string =>
  input === null ? 'not available' : String(input);

export function formatAudioDiagnosticReport(
  diagnostics: ReferenceDroneDiagnostics,
  buildInfo: BuildInfo,
  context?: AudioDiagnosticReportContext,
): string {
  const rows: Array<[string, string | number | boolean | null]> = [
    ['Deployment', formatCompactBuildInfo(buildInfo)],
    ['Build SHA', buildInfo.gitCommitSha],
    ['Build ref', buildInfo.gitRef],
    ['User agent', diagnostics.userAgentSummary],
    [
      'Apple mobile browser',
      summarizeAppleMobileBrowser(diagnostics.userAgentSummary),
    ],
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
    ['Selected backend', diagnostics.backend],
    ['Timbre profile', diagnostics.timbreProfile],
    ['Predicted peak', diagnostics.predictedPeak],
    [
      'Partials',
      diagnostics.partials.length
        ? diagnostics.partials
            .map(
              (partial) =>
                `${partial.harmonic}x=${partial.frequencyHz.toFixed(6)}Hz@${partial.normalizedAmplitude.toFixed(6)}`,
            )
            .join(', ')
        : 'not available',
    ],
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
    ['Persistent signal', diagnostics.persistentSignal.classification],
    ['Persistent RMS', diagnostics.persistentSignal.rms],
    ['Persistent peak', diagnostics.persistentSignal.peak],
    [
      'Persistent analyser generation',
      diagnostics.persistentSignal.analyserGenerationId,
    ],
    [
      'Persistent analyser connected',
      diagnostics.persistentSignal.analyserConnectedToDestination,
    ],
    ...formatTestRows('Engine test', diagnostics.engineOutputTest),
    ...formatTestRows('Direct test', diagnostics.directOutputTest),
    ...formatTestRows('Constant-gain test', diagnostics.constantGainOutputTest),
    ...formatTestRows(
      'Recreated-context test',
      diagnostics.recreatedContextOutputTest,
    ),
    ['Previous context generation', diagnostics.previousContextGenerationId],
    ['Context close result', diagnostics.contextCloseResult],
    ['Voice automation method', diagnostics.voiceAutomation.method],
    [
      'Voice automation context time',
      diagnostics.voiceAutomation.schedulingContextTime,
    ],
    [
      'Voice automation after running',
      diagnostics.voiceAutomation.scheduledAfterRunning,
    ],
    ['Master automation method', diagnostics.masterAutomation.method],
    [
      'Master automation context time',
      diagnostics.masterAutomation.schedulingContextTime,
    ],
    ['AudioSession available', diagnostics.audioSession.available],
    ['AudioSession type', diagnostics.audioSession.type],
    ['AudioSession state', diagnostics.audioSession.state],
    ['AudioSession preparation', diagnostics.audioSession.preparationResult],
    ['AudioSession prior type', diagnostics.audioSession.priorType],
    ['AudioSession restored type', diagnostics.audioSession.restoredType],
    ['AudioSession error', diagnostics.audioSession.errorMessage],
    ['Last error code', diagnostics.errorCode],
    ['Last error message', diagnostics.errorMessage],
  ];
  return [
    'Vocal Tuner audio diagnostic report',
    'No microphone audio or samples are included.',
    '',
    ...rows.map(([label, input]) => `${label}: ${value(input)}`),
    ...(context
      ? [
          '',
          'Manual audibility:',
          `Persistent drone: ${context.manualResults.persistentDrone}`,
          `Direct Web Audio: ${context.manualResults.directWebAudio}`,
          `Constant-gain Web Audio: ${context.manualResults.constantGainWebAudio}`,
          `Native audio: ${context.manualResults.nativeAudio}`,
          `Recreated context: ${context.manualResults.recreatedContext}`,
          '',
          'Native media:',
          `Status: ${context.nativeAudio.status}`,
          `Play result: ${context.nativeAudio.playResult}`,
          `Playing event: ${context.nativeAudio.playingEventReceived}`,
          `Timeupdate: ${context.nativeAudio.timeUpdateReceived}`,
          `Current time: ${context.nativeAudio.currentTime}`,
          `Ended event: ${context.nativeAudio.endedEventReceived}`,
          `Paused: ${context.nativeAudio.paused}`,
          `Error code: ${value(context.nativeAudio.errorCode)}`,
          `Error message: ${value(context.nativeAudio.errorMessage)}`,
          `Events: ${context.nativeAudio.events.join(', ') || 'none'}`,
          ...(context.audioSessionTimeline
            ? [
                '',
                'Audio-session snapshots:',
                ...(context.audioSessionTimeline.snapshots.length
                  ? context.audioSessionTimeline.snapshots.map(
                      (entry) =>
                        `${entry.sequence}. +${entry.relativeTimeMs.toFixed(1)} ms — ${entry.label} — session=${value(entry.audioSessionType)}/${value(entry.audioSessionState)}; drone=${entry.droneContextState}#${value(entry.droneContextGeneration)}@${value(entry.droneSampleRate)}Hz; microphone=${entry.microphoneContextState}@${value(entry.microphoneSampleRate)}Hz; tracks=${entry.activeMicrophoneTrackCount}:${entry.microphoneTrackReadyState}; channels=${value(entry.destinationChannelCount)}; visibility=${entry.visibilityState}; focus=${value(entry.pageHasFocus)}; RMS=${value(entry.outputRms)}; peak=${value(entry.outputPeak)}`,
                    )
                  : ['(empty)']),
              ]
            : []),
        ]
      : []),
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

function formatTestRows(
  label: string,
  test: ReferenceDroneDiagnostics['directOutputTest'],
): Array<[string, string | number | boolean | null]> {
  return [
    [`${label} status`, test.status],
    [`${label} graph`, test.graphPath],
    [`${label} RMS`, test.signal.rms],
    [`${label} peak`, test.signal.peak],
    [`${label} signal`, test.signal.classification],
    [`${label} automation`, test.automation.method],
  ];
}

export function summarizeAppleMobileBrowser(userAgent: string): string {
  const ios =
    /(?:CPU (?:iPhone )?OS|iPhone OS) (\d+)[_.](\d+)(?:[_.](\d+))?/.exec(
      userAgent,
    );
  const safari = /Version\/(\d+(?:\.\d+){0,2})/.exec(userAgent);
  if (!ios && !safari) return 'not detected';
  const iosVersion = ios
    ? `iOS ${ios.slice(1).filter(Boolean).join('.')}`
    : 'iOS unknown';
  const safariVersion = safari ? `Safari ${safari[1]}` : 'Safari unknown';
  return `${iosVersion}; ${safariVersion}`;
}
