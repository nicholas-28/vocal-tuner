# Short-window pitch evidence

## Existing path and boundary

`pitchAnalysis` publishes every rendering-clock-validated YIN result to `PitchSource` at nominal 30 Hz. Its immutable current-frame `fractionalMidi` exists only for accepted detector results. Rejections and silence have no accepted musical pitch. The 15 Hz React callback separately feeds continuity, target guidance, visual history and Practice. Continuity may briefly hold a rejected pitch for presentation; the main/target markers additionally smooth geometry. Practice uses capped previous-observation intervals but summarizes a whole session with a weighted mean and standard deviation and still receives only the React subset. None of those values or timings are input to this estimator.

The module subscribes directly to the read-only `PitchSource` and supports late attachment with its bounded `getRecent` backfill. It owns no microphone, detector, React state, audio, target, history, or Practice state. Stop, failure and new sessions clear its observations through source lifecycle publications. A consumer must dispose its subscription when finished.

## Semantics and API

`createShortWindowPitchEvidence(source)` returns `getSnapshot(nowMs)` and `dispose()`. The caller supplies a monotonic time from the same clock as `PitchSource` (`performance.now()` in production), at or after the newest observation. Reads are pure with respect to evidence: advancing the clock without new observations can only preserve or reduce credited voice as the window slides. Invalid snapshot time throws. The fixed window is the last 500 ms, clipped to time zero in synthetic startup fixtures.

The public snapshot shape is:

```ts
type ShortWindowPitchEvidence = Readonly<{
  windowStartMs: number;
  windowEndMs: number;
  windowDurationMs: number;
  sessionGeneration: number | null;
  freshSampleCount: number;
  voicedSampleCount: number;
  voicedDurationMs: number;
  voicedCoverage: number;
  unvoicedDurationMs: number;
  uncertainDurationMs: number;
  unobservedDurationMs: number;
  centerFractionalMidi: number | null;
  spreadCents: number | null;
  latestState: 'voiced' | 'unvoiced' | 'uncertain' | 'stale' | 'inactive';
  latestFractionalMidi: number | null;
  windowSufficiency:
    'sufficient' | 'insufficient-samples' | 'insufficient-duration';
}>;
```

`freshSampleCount` counts actual observations stamped within the window and fresh **at publication**, including silence/rejections; `voicedSampleCount` counts their voiced subset. Neither is a count of statistically independent measurements. A rejected frame cannot inherit the preceding pitch. The center is absolute fractional MIDI, independent of a selected note; spread is in cents.

`latestState` describes current observation availability independently of the window. `voiced`, `unvoiced` (detector silence) and `uncertain` (other rejection) all require passing the source's 250 ms consumer-clock freshness check. `stale` includes expired samples and explicit source failure; `inactive` includes no source sample, session startup, Stop, clear and disposal. `latestFractionalMidi` is non-null only for `voiced`. Historical center/spread and window sufficiency remain descriptive even when the latest frame is rejected or expires. An explicit `stale` or `inactive` lifecycle publication clears retained history as before; the resulting empty window is `insufficient-samples`, while `latestState` carries the lifecycle distinction.

`projectEvidenceToTarget(snapshot, integerMidi)` adds only signed center and latest offsets in cents. It never wraps through the nearest note or mutates the voice evidence. Target changes do not change source collection. A future target mechanic should reset its own progress on target changes.

`windowSufficiency` depends only on the window: fewer than six voiced observations gives `insufficient-samples`; otherwise fewer than 300 ms of closed voiced intervals gives `insufficient-duration`; otherwise it is `sufficient`. The latest observation does not veto a voiced window. For example, 450 ms of credited voice followed by a single rejected frame and a 50 ms open tail yields a sufficient window, 90% voiced coverage, `latestState: 'uncertain'` and no latest pitch. These sample/duration cutoffs remain provisional descriptive defaults, not a claim of independent sample size, physiological quality or successful singing. Silence and uncertainty durations remain visible even when a window qualifies. No exercise pass policy is implemented.

## Freshness, credit and coverage

**Freshness horizon is not evidence-credit horizon.** `PITCH_SOURCE_MAX_AGE_MS` remains 250 ms and controls only current latest-sample validity through `isFreshPitchSample`. `SHORT_WINDOW_MAX_EVIDENCE_CREDIT_MS` is a separate 100 ms duration-accounting cap. Each observation receives the interval from its timestamp to its successor, capped at 100 ms and clipped to the 500 ms window. This applies equally to voiced, silent and uncertain observations. No interval before an observation is credited to it, and a gap beyond its cap stays unobserved on recovery.

The 100 ms initial cap is an engineering bound motivated by the existing 4096-sample analyser: about 85.3 ms at 48 kHz and 92.9 ms at 44.1 kHz. It permits roughly three nominal 33.3 ms analysis intervals, including modest missed-frame jitter, while preventing a pre-stall frame from receiving 250 ms of weight. At 15 Hz, regular 66.7 ms intervals still fit. Missed analysis slots are skipped by the producer, never replayed. The analyser describes a trailing audio window, so its duration does **not** prove that its pitch persisted forward for 100 ms. The cap is a conservative approximation requiring physical evaluation, not a new detector setting or a guarantee for every sample rate (at 96 kHz, 4096 samples span about 42.7 ms).

The newest observation remains an **open tail with zero duration credit** until its actual successor arrives. A read after the newest frame therefore normally has less than 100% coverage even during continuous singing. Reads do not settle the tail; they only clip already closed intervals to the moving window. At regular 15–30 Hz, a read between arrivals has at most approximately one analysis interval of open tail; scheduler stalls may create much larger unobserved spans. After a 300 ms stall, the preceding observation earns at most 100 ms when recovery closes its interval, leaving at least 200 ms unobserved. In the moving-pitch regression, the old cap let a −80-cent pre-stall frame determine the recovered median; the new cap leaves the median among the subsequent moving-pitch observations.

`voicedCoverage = voicedDurationMs / windowDurationMs` (zero for a zero-duration window). Credited observed duration, if needed by a consumer, is the sum of voiced, unvoiced and uncertain durations; it includes classified non-voice time and is not a confidence score. That sum plus `unobservedDurationMs` equals the window duration within floating-point tolerance. Unobserved time includes startup before evidence, capped scheduler gaps, any capacity-evicted boundary and the open tail. Durations are interval estimates from observations, not direct acoustic voice-onset/offset measurements.

## Statistics choice

All pitch statistics use the credited interval duration as weight, not a nominal 30 Hz frame count or detector confidence. Confidence has already participated in raw acceptance; weighting again by it would obscure how much voice time was accepted. The center is a duration-weighted median of absolute pitch cents (`fractionalMidi × 100`). The spread is half the distance from the duration-weighted 10th to 90th percentiles. Weighted quantiles use the first sorted value whose cumulative duration reaches the requested fraction. They avoid interpolation that would invent unsampled pitch.

An arithmetic mean or duration-weighted mean is easy to interpret but one bad accepted octave/frame can drag it; a trimmed mean needs a trimming policy and still blends attack and settled portions. An unweighted median ignores scheduler jitter; a duration-weighted median resists isolated outliers and respects credited time. Standard deviation gives outliers large squared influence. Median absolute deviation (MAD) is robust but may be zero for a window that dwells near its center while periodically moving away, especially with a short, phase-dependent vibrato sample. The 10th–90th half-range retains a descriptive modulation width while ignoring the rarest extremes.

**Spread is not stability.** It can represent vibrato, drift, glide, jumps, irregular movement or detector errors; a small spread can describe a sustained wrong note or wrong octave. It does not preserve temporal order or classify any of those causes. Sustained accepted octave errors remain a full ±1200-cent displacement, with no correction or folding. A brief octave error can leave the median near the intended pitch while substantially increasing spread.

The 500 ms window has known vibrato phase bias. At nominal 30 Hz, a 5 Hz oscillation is represented by only six observations per cycle; lower or commensurate cadences can repeatedly sample the same phases. The deterministic 15–30 Hz fixtures for a centered ±20-cent, 5 Hz sinusoid allow up to 10 cents of apparent median bias. This is a bound for those fixtures, not for every voice, phase or cadence. Weighted quantiles also have **percentile cliffs**: with small sample counts, a single interval moving across the 10%, 50% or 90% cumulative-weight boundary can abruptly change center or spread. An outlier below the tail-weight cutoff can be hidden by the robust summary; one above it can widen spread sharply. No smoothing is applied to conceal those changes.

The analyser's approximately 85–93 ms frames overlap at 30 Hz (and usually at 15 Hz), so adjacent observations share audio and are not independent observations. Counts and credited durations are descriptive, not an effective statistical sample size or proof of sustained vocal behavior. Physical voice testing must assess phase, attacks, timing and detector error before any exercise layer chooses thresholds.

A centered voice with roughly 18-cent spread and high coverage differs from a stable −21-cent voice with roughly 3-cent spread by target-relative center and spread independently. Neither collapses into a composite score. A quick symmetric crossing can also have near-zero center; its broad spread and nonzero latest offset make the snapshot unlike a steady hold, but this layer does not certify Hold or classify trajectory.

## Trajectory and integration

Center, spread, latest, durations and sufficiency are primitives for later mechanics. Approach, crossing, remaining and departing require comparison across successive windows and probably a separate onset/dwell/transition layer. The estimator does not journal window snapshots or implement Find/Approach/Hold/Leave/Return. It has no React render path; a future canvas/game controller can hold the estimator beside `PitchSource` and read snapshots on its own clock. Practice remains on its current accounting path until an explicit migration decision.

## Bounded work and validation

The subscription retains at most 64 source observations. Publication is constant-time ring insertion; snapshot scans at most 64 samples and sorts at most 64 weighted voiced intervals, so time is bounded by `O(64 log 64)` and memory by `O(64)`. At nominal 30 Hz this covers over two seconds; extreme bursts can evict a window boundary, which becomes unobserved rather than invented voice. No dependency or high-frequency React updates are added. The source still retains its separate 256-sample ring and does not store waveform/audio.

Deterministic tests cover steady centered/sharp pitch, centered/biased vibrato, crossing, approach/settle, hold, silence, intermittent silence, rejected and stale observations, one-frame outliers, irregular timing, note transitions, startup insufficiency, scheduler gaps and session cleanup. Regression cases cover the 100 ms cap for all observation classes, moving pitch across a stall, sufficient windows with a latest rejection/silence, advancing-time reads, seeded time-accounting invariants, post-observation snapshot timing, 15/20/24/30 Hz plus jitter, and brief/sustained octave errors. The synthetic pitch functions are not proof of detector accuracy or physical cadence.

Physical acceptance should inspect actual voiced coverage and center/spread while singing a steady note, natural and larger vibrato, a deliberately flat stable note, an attack, a glide through target, a quick accidental crossing, a transition between notes, breathy/consonant interruptions and silence on mobile Safari and Android Chrome. Compare what is heard with the source diagnostics and the existing 15 Hz UI; test main-thread stalls and low-power mode. Teacher/singer feedback should set exercise-specific dwell, tolerance, continuity and vibrato policies in a later milestone. Octave errors and accepted detector outliers remain possible; percentile robustness does not repair a sustained wrong octave.
