# Realtime PitchSource boundary

## Current production flow audit

Before this boundary, `pitchAnalysis` ran YIN behind a 30 Hz RAF gate, only after the input rendering clock advanced. It stamped each detector result with `performance.now()` at analysis start. A separate 15 Hz gate delivered results to `useMicrophone`, which updated React input level and called App. App updated raw diagnostics, fed the pure continuity transition through its React hook, and ingested continuity decisions into visual history. Musical conversion used continuity's last accepted detector result. Tuner text, cents and target meters used this pitch; their visual smoothing was presentation-only. PitchGridCanvas received history through props and drew it on its own RAF. Practice consumed observation timestamps, accepted pitch and continuity status through a React effect, with timestamp-based evidence accounting.

The only existing consumer of every computed frame was the detector's own analysis loop. Continuity, history and practice intentionally received the published subset, including uncertainty decisions; changing their cadence could change accounting. Future realtime mechanics need the earlier detector observations without waiting for React commits.

## Decision and data flow

```text
Microphone → analyser (4096 samples) → YIN, rendering-clock gated, up to 30 Hz
                                         ├─ PitchSource: current-frame accepted
                                         │  musical interpretation + raw diagnostics
                                         │       └─ realtime getLatest()/subscribe()
                                         └─ existing 15 Hz presentation callback
                                             → React continuity
                                             ├─ musical pitch → text/cents/target
                                             ├─ history → Canvas RAF
                                             └─ practice observation effect
```

Source samples are current-frame observations, **before continuity**. A rejected frame has no accepted frequency/MIDI/cents even when UI continuity temporarily holds the preceding note. This preserves existing product behavior and avoids creating a competing continuity filter. Games can explicitly implement their own presentation/uncertainty handling; neither UI smoothing nor held pitch is fresh source evidence. No game is implemented here.

Practice and visual history remain on their existing path and cadence. Source retention is a short consumer convenience, not visual history or a scoring log. Migrating practice or consolidating ingestion requires a separate evidence-accounting decision.

## Consumer and producer contract

`useMicrophone()` owns one `createPitchSource()` controller for its mounted lifetime and returns its stable `.source` view as `pitchSource`. Pass that view explicitly to a future canvas/game controller. The factory separates `beginSession`, `publish`, `invalidate`, and `clear` owner/producer authority from the consumer’s `subscribe`, `getLatest`, and `getRecent`. Consumers cannot clear the authoritative source: doing so would revoke the microphone session for every consumer while capture continued. There is no singleton, Context store, or event-emitter dependency.

`PitchSample` contains nullable frequency, fractional MIDI, nearest MIDI and cents derived with the existing pure musical conversion, plus detector confidence, voicing, freshness, and session generation. `raw` is an immutable copy of `RawPitchDetection` including its original candidate/rejection diagnostics and settings. It contains no waveform. Musical fields are non-null only when the current detector frame was accepted and musical conversion succeeds. Silence is `unvoiced`; other rejected frames are `uncertain`. These names reuse the existing voicing vocabulary but do not carry UI continuity state or its last accepted note. Raw data is never overwritten with filtered/display values.

Subscribers receive immutable samples synchronously; `null` signals an explicit owner `clear()`. Subscription does not immediately replay: read `getLatest()` for the initial value. Unsubscribe is idempotent. Listener exceptions are isolated, additions are not appended to an in-progress notification snapshot, removals are respected, and a reentrant publication stops delivery of the superseded snapshot. Consumers must keep callbacks short and unsubscribe on disposal.

## Session and freshness

The producer uses `useMicrophone`'s existing operation token; it does not maintain another microphone generation counter. It begins a source session after valid tracks are acquired, before analysis construction. A new session publishes an inactive marker with the new generation and a null observation timestamp until actual rendering evidence arrives. Samples must match the active generation and have finite, nonnegative, strictly increasing timestamps. Obsolete generation callbacks are rejected both by the hook and source.

`timestampMs` is the detector observation time from `performance.now()`, not an audio-context time, React commit time, visual-history effective time, or a new timestamp for a held note. Stop, cancellation, failure and unmount revoke publications synchronously, including while context closure remains pending. Stop/unmount publish `inactive`; analysis/track failure publishes `stale`. These markers clear pitch and preserve the last observation's timestamp, or null if none existed. Startup reset also clears the previous session; failures do not auto-resume.

`freshness` is the last published lifecycle state, not a wall-clock calculation inside `getLatest()`. A browser can delay all JavaScript/lifecycle callbacks. A realtime consumer must also call the pure, allocation-free `isFreshPitchSample(sample, performance.now())`, which rejects observations older than 250 ms, and check `voicing === 'voiced'` before treating pitch as evidence. The 250 ms age budget matches the input clock-stall allowance. Applications may apply a stricter age policy. Frame reads must never create new timestamps or extend evidence duration by rereading the same sample.

```ts
const sample = pitchSource.getLatest();
if (
  isFreshPitchSample(sample, performance.now()) &&
  sample?.voicing === 'voiced'
) {
  // Consume sample.fractionalMidi; deduplicate evidence by generation + timestamp.
} else {
  // No current accepted pitch evidence. A visual may show its own explicit gap.
}
```

## Cadence and memory

- Analysis: unchanged 30 Hz maximum, RAF-quantized, with the existing YIN settings and rendering-clock guards.
- PitchSource: every computed observation, before the UI throttle, including rejections and silence. No extra detector invocation.
- React/UI, continuity, practice and visual history: unchanged 15 Hz maximum publication path. Source publication alone does not set React state. The microphone active indicator still follows the presentation callback.
- Future render loop: display refresh, typically 60/120 Hz, reading the last completed observation. Faster reads do not imply faster acquisition or lower physical latency.

`getLatest()` is one closure-variable read: O(1), no allocation, clock read, mutation, notification, or React update. Publication does fixed-size conversion/copy work plus O(subscribers) delivery. The ring retains at most 256 immutable observations, roughly 8.5 seconds at 30 Hz (longer at lower delivered cadence). Insertion/eviction is O(1). It is bounded by count rather than permanent duration. `getRecent(windowMs)` scans at most 256 entries, allocates a new chronological result, and filters using the supplied monotonic clock; it is not intended for each animation frame. Lifecycle markers are not retained as observations. Session start, invalidation and clear release the ring's references.

The owner/controller’s `clear()` yields null, empties retention and revokes the current producer session. A higher-generation `beginSession` is required to publish again; it is an ownership/reset operation, not the visual history Clear button. Source subscribers remain installed until unsubscribed.

## Deterministic fixtures

`src/test/stubPitchSource.ts` accepts existing detector-shaped fixtures and exposes the same read/subscription-only consumer contract through `.source`. Fixture mutation stays on its separate controller: `step()` advances its explicit clock to the next timestamp; exhaustion invalidates it; `reset()` starts a new synthetic generation. Fixtures must have strictly increasing timestamps. Unit tests cover C4 → D4 → E4 → silence → G4 without timers. The module is not imported by production code, cannot replace microphone input through query flags, and adds no UI controls.

## Diagnostic-only analysis cost

Only `?audioDiagnostics=1` constructs the rolling timing probe and displays “Pitch analysis performance.” It records the existing `analysisDurationMs` metadata from every analysis observation in a 128-value buffer. It resets at session start and retains the last summary after Stop. Count, nearest-rank p50/p95, maximum and count strictly above 8 ms are calculated on the existing presentation renders, never in the render-read path. No detector optimization or latency claim follows from desktop measurements. On a physical iPhone, enable the flag, start capture and compare silence, sustained low/high notes, and exercise-like transitions; review p95, maximum and above-8-ms counts.

## Validation and limitations

Core tests exercise immutable reads, bounded retention, age checks, generations, invalidation, listener mutation/errors and deterministic fixtures. The hook test publishes observations without presentation callbacks and reads 120 times, asserting no React rerender or read-triggered notification; the analysis test verifies four computed observations versus two UI publications and no additional detection for a frozen render clock. Existing product tests remain the behavior contract.

This remains main-thread RAF analysis, not AudioWorklet processing. Background suspension can delay publication; consumers must use age as well as lifecycle freshness. Physical microphone freshness and latency cannot be established by mocked tests. UI continuity/statistics and source voicing can differ deliberately because they observe different cadences and have different semantics. Practice still receives the legacy published subset; direct-source scoring and synthetic exercise design are follow-up work, not part of this milestone.
