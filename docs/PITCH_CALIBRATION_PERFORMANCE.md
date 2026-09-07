# Pitch calibration and performance baseline

## Decision and scope

The milestone establishes provisional feedback semantics and descriptive measurements before a game. It does not establish a validated singing pass/fail standard. Optimization verdict: **WATCH**. Keep YIN, the current cadence, microphone lifecycle, continuity, PitchSource, history, and drone. Fix a demonstrated reusable-buffer sizing error. Do not turn current band occupancy into a Find → Approach → Hold → Return score.

## Threshold audit: before and after

All cents below are relative to equal temperament with A4 = 440 Hz. Frequency becomes fractional MIDI through `69 + 12 log2(f/440)`; nearest-note MIDI uses `Math.round`. Nearest-note cents are `(fractionalMidi - nearestMidi) * 100`, while selected-target cents are `(fractionalMidi - targetMidi) * 100` and never wrap. Target selection can differ from the nearest note. A perfectly centered A#4 is zero nearest-note cents and +100 target cents against A4, without contradiction.

| Location / purpose                               | Before                                        | Now / meaning                                                       |
| ------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------- |
| Primary `classifyCents`, in-tune text and accent | Inclusive ±5                                  | Inclusive ±10, shared immediate in-tune feedback                    |
| Primary center region                            | ±5 called in tune                             | ±5 dead-center band, inside ±10 in tune                             |
| Primary close feedback                           | None                                          | >10 through ±25, explicitly Close · flat/sharp                      |
| Target direction and Within N cents formatting   | Inclusive ±10 (formatting duplicated literal) | Inclusive ±10 from shared config                                    |
| Practice on/off-target accounting                | Inclusive ±10 via target direction helper     | Explicit `PRACTICE_BAND_CENTS = inTuneCents`; same occupancy values |
| Target distance: close                           | >10 through ±35                               | >10 through ±25, shared close band                                  |
| Target distance: far                             | >35 and <100                                  | >25 and <100; not a success rule                                    |
| Different-note distance label                    | Absolute cents ≥100                           | Unchanged; semitone-scale distance label                            |
| Target-note neighborhood                         | Absolute cents <50 (boundary excluded)        | Unchanged; closer-than-neighbor relation                            |
| Primary/target visual extent and overflow        | ±50                                           | Unchanged; clamped geometry, raw values retained                    |
| Primary quarter-scale labels                     | ±25                                           | Unchanged positions, now also the close-band boundary               |
| Signed numeric display                           | Absolute cents <0.05 displays zero            | Unchanged; decimal formatting, not evidence rounding                |
| Target residual formatting                       | Residual ≥0.05 shown to one decimal           | Unchanged; not a tolerance                                          |
| `music/pitchDisplay` legacy percentage helper    | Clamps ±50; unavailable → center              | Unchanged; not used to create current primary evidence              |
| ±15 / ±20                                        | No production success thresholds              | Fixture values, not new thresholds                                  |

The original mismatch was conservative in the main tuner: +7 cents could read Sharp while guidance/Practice called it On target. There was no path where display smoothing entered practice accounting. The new shared module is `src/calibration/pitchCalibration.ts`; feature-specific names remain explicit. CSS zone geometry and target formatting now derive from config instead of duplicating their tolerance values.

## Accuracy, variation, and human voice

Accuracy describes the center's relation to the intended pitch. Variation describes movement around that center. A steady −15-cent note has bias but no spread; symmetric vibrato can have zero bias with appreciable spread. A centered average can also result from erratic movement or repeated crossings. None of those facts alone establishes vocal quality, technique, or a medical/style judgment.

Published work supports distinguishing these dimensions, not a universal ±N-cent success cutoff. A primary [Acoustical Society of America study presentation](https://acoustics.org/pressroom/httpdocs/165th/2aMU8_Pecoraro.html) describes periodic modulation and rates commonly around 4–7 Hz. [Bottalico, Graetzer and Hunter's singing-accuracy study](https://experts.illinois.edu/en/publications/effect-of-training-and-level-of-external-auditory-feedback-on-the-2/) explicitly examines context such as tempo, articulation, tessitura and training. These sources motivate context-sensitive measurement; they do not validate the exact product bands chosen here.

Provisional accuracy vocabulary: dead center ≤5, in tune ≤10, close ≤25, outside >25 cents (all absolute/inclusive upper bounds). Dead center is a small band, not a claim that the measurement is exactly zero. Ten cents preserves the existing selected-target band while resolving contradictory feedback; 15 would be a possible later pedagogical policy, but widening to it would neither distinguish biased from centered vibrato nor cure cadence sensitivity. Twenty-five is a readable quarter-semitone feedback landmark within the ±50 display. These values require teacher/singer acceptance, not justification by existing tests.

Variation vocabulary for a future exercise could distinguish low variation, periodic modulation, and irregular movement. **No automatic stable/vibrato/unstable classifier is implemented.** Standard deviation cannot distinguish a regular oscillation from random motion with the same spread. The readout's former “Stable” continuity label has been replaced with “Pitch detected”: accepted pitch is not a measured steadiness rating.

## Practice accounting and deterministic reproduction

Start locks the selected integer MIDI target and begins unobserved. Each forward timestamp settles the previous observation for at most 250 ms, then installs the next observation. The first observation earns no retroactive pitch time. Excess scheduler gaps become unobserved; paused wall time is excluded from active time. Resume starts unobserved. Duplicate/backward timestamps are ignored, and paused/completed sessions reject observations. A 250 ms UI timer only previews this accounting and cannot repeatedly extend evidence.

`measurableVoicedMs = onTargetMs + offTargetMs`. Active time is measurable voice + uncertainty + no pitch + unobserved time. The share denominator is measured voice only; zero voice returns unavailable, not 0%. There is no required target duration, hold criterion, or successful exercise duration in this feature. The old “on-target share” can be mistaken for those concepts but is only raw instantaneous ±10-cent occupancy.

Continuity uses a 160 ms grace interval. Rejected publications during grace are uncertain with an explicitly held display pitch. Practice tests status first and counts uncertainty separately, never passing the held pitch into its metrics. Confirmed unvoiced input is no pitch. Accepted raw target cents, not either visual smoothing hook, enter practice.

Fixtures in `src/test/pitchTrajectories.ts` produce four seconds of timestamped observations, beginning at 1 ms after Start, with no microphone input. The tests exercise the real practice state machine, not a replacement scoring implementation:

| Trajectory                          | What the accounting demonstrates                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| A: steady 0                         | 100% occupancy, mean 0, spread 0                                                                    |
| B: centered 5 Hz, ±30-cent sinusoid | At 15 Hz, phase 0: 33.33% occupancy; phase π/2: 0%. Both have mean 0 and spread about 21.21 cents   |
| Biased vibrato (−15 center)         | Mean −15 and the same spread; distinct from centered modulation                                     |
| C: steady −15                       | 0% occupancy, mean −15, spread 0; close but biased                                                  |
| D: steady −30                       | 0% occupancy, mean −30, spread 0; outside and biased                                                |
| E: linear −40 → 0                   | Mean −20 over the whole approach; spread is movement, not a hold-failure label                      |
| F: seeded random ±40                | Mean and spread computed independently from raw fixtures; a near-zero mean cannot establish success |
| G: silence/gaps                     | No pitch excluded from voice/percentage; no synthesized center statistic                            |

At 120 Hz the same sampled sinusoid has 25% occupancy. Its continuous-time fraction inside ±10 is `2 asin(10/30) / π ≈ 21.6%`. The fixture is an illustrative trajectory, not a claim about one correct vibrato amplitude. These differences show both the weakness of binary band grading and sampling-phase effects. Merely widening a band or smoothing the input would conceal the issue.

## Measurements implemented and deferred

Practice now labels the percentage **Time in ±10-cent band**, explains that it is not a grade, and adds only two measurements:

- Average offset: time-weighted signed mean target cents, expressing pitch-center bias.
- Pitch spread: time-weighted population standard deviation around that mean, expressing variation without a good/bad label.

The two scalar accumulators use weighted Welford updates from exactly the intervals credited as measured voice. They preserve raw cents precision, use O(1) work and space, and exclude uncertain/no-pitch/unobserved/paused time. Preview is pure; completion copies the scalars into the frozen summary. They retain no audio or pitch sample history. They cannot reconstruct a trajectory, and are session-wide descriptive statistics, not perceptual pitch estimates or a newly smoothed truth.

Mean absolute error mixes bias and variation; occupancy is phase sensitive; an unweighted median ignores interval duration; range is outlier sensitive. A short-window center/spread model may eventually help a hold exercise, but must first choose evidence coverage, window duration, attack handling, target reset, and periodicity policy. None is silently introduced here. Current approximately 15 Hz practice input is especially unsuitable for claiming detailed vibrato shape at 4–7 Hz. A future evaluation experiment should compare fresh accepted PitchSource observations, at the actual measured analysis cadence, with this presentation path; never count repeated reads as new evidence or include rejected/held frames.

## Performance collection and reproducibility

Open `?audioDiagnostics=1` to enable the existing probe and the “Pitch analysis performance” disclosure below the primary tuner. The probe records detector `analysisDurationMs` from every computed observation, before the UI throttle, into a 128-slot Float64Array. Invalid/negative durations are ignored. Collection is O(1); summaries sort at most 128 numbers on existing presentation renders. Normal mode constructs no probe. Start resets it; Stop retains the last window.

- **p50:** typical analysis duration, the median.
- **p95:** 95% of the recorded analyses finished within this duration (nearest-rank percentile).
- **Maximum:** slowest analysis in this rolling window, not lifetime maximum.
- **Above 8 ms:** count strictly exceeding 8 ms, not a percentage or a diagnostic of microphone delay.
- **Count:** at most 128; a full window spans roughly 4.3 seconds at 30 Hz, longer if actual cadence is lower.

Run from the repository, without microphone access:

```bash
node scripts/pitch-performance-baseline.mjs > /tmp/pitch-baseline.json
node scripts/pitch-performance-baseline.mjs > /tmp/pitch-baseline-repeat.json
node scripts/pitch-performance-baseline.mjs --reverse > /tmp/pitch-baseline-reverse.json
```

The script uses existing Vite to load production TypeScript without listening on a server. No dependency was added. Each rate (44.1/48/96 kHz) uses the production 4096-sample window and thresholds, reusable detector buffers, three harmonic-rich tones at 82.41/220/880 Hz, silence, and seeded noise. Eight prebuilt phase-shifted windows per case avoid timing signal generation. Each case warms up for 64 analyses, then uses three independent 128-observation probes. Timing comes from the detector itself; timestamps supplied to detection are fixture metadata and the loop is unpaced. Accepted counts and maximum cents error accompany timing so a fast rejection cannot be mistaken for successful voice analysis.

## Recorded desktop baseline

Measured 2026-09-07 on Apple M4, macOS arm64, Node v24.15.0. The repository declares Node 22.x; Node 22 was not installed in the checked standard locations, so this is explicitly a Node 24 development-environment result. Do not extrapolate it to Safari, iPhone, browser frame rate, or whole-app latency. [All 135 per-run summaries](benchmarks/pitch-analysis-baseline.csv) preserve both ordinary invocations and the reverse-order invocation.

The following p50 column is the median of nine run medians, **not** a pooled median; the p95 column is the worst individual run p95. Each row has 1,152 timed observations. Keeping tail and per-run data matters because the first rate showed strong order sensitivity.

| Rate  | Signal  | Median run p50, ms | Worst run p95, ms | Maximum, ms | >8 ms / 1152 |
| ----- | ------- | ------------------ | ----------------- | ----------- | ------------ |
| 44100 | 82.41   | 1.909              | 1.989             | 9.316       | 4            |
| 44100 | 220     | 7.086              | 9.297             | 10.368      | 461          |
| 44100 | 880     | 7.070              | 9.288             | 10.341      | 459          |
| 44100 | silence | 0.015              | 0.016             | 0.023       | 0            |
| 44100 | noise   | 1.921              | 1.991             | 2.047       | 0            |
| 48000 | 82.41   | 2.092              | 2.138             | 2.173       | 0            |
| 48000 | 220     | 2.090              | 2.142             | 2.175       | 0            |
| 48000 | 880     | 2.091              | 2.155             | 2.214       | 0            |
| 48000 | silence | 0.015              | 0.016             | 0.021       | 0            |
| 48000 | noise   | 2.092              | 2.153             | 2.199       | 0            |
| 96000 | 82.41   | 3.732              | 3.788             | 9.440       | 1            |
| 96000 | 220     | 3.731              | 18.090            | 22.703      | 384          |
| 96000 | 880     | 3.732              | 18.139            | 18.441      | 384          |
| 96000 | silence | 0.015              | 0.020             | 0.057       | 0            |
| 96000 | noise   | 3.742              | 3.805             | 3.932       | 0            |

All tone runs accepted 128/128 observations; all silence/noise runs accepted zero. The first sample rate's middle/high tones were much slower: 44.1 kHz first produced p95 near 9.3 ms; 96 kHz first produced p95 near 18.1 ms. Later rates typically used ~1.9/2.1/3.7 ms at 44.1/48/96 kHz respectively. Reversing order moved the slow cases, so sampling rate alone does not explain these results. Runtime tiering, scheduling or other environment effects are hypotheses, not established causes. The harness and retained results make this reproducible for investigation; no favorable-only baseline is reported.

## Avoidable work and optimization verdict

A concrete allocation bug was reproduced before changing code: `pitchAnalysis` allocated `floor(sampleRate / 65) + 1` difference slots, but the detector needs `ceil(sampleRate / 65) + 1`. At all three tested rates the provided buffer was one slot short, forcing a new Float64Array on each voiced analysis. Changing construction to ceil and the detector's named minimum frequency fixes reuse; buffer-identity tests exercise real detector processing at all three rates. No YIN math, threshold, cadence or lifecycle behavior changed. The benchmark intentionally supplies correctly sized reusable buffers; its timings are not a claimed before/after speedup from this fix.

Other audit findings: detector work remains on the main thread; a frame still allocates small result/settings/publication objects, but there is no unbounded PitchSource scan in getLatest and no per-frame React animation loop. The diagnostics sort is bounded and opt-in. Practice's pre-existing immutable timeline journal grows with every settlement and copies the array on append: O(n) per append, O(n²) cumulative copying, with potentially many completed DOM segments. This deserves browser profiling for long sessions; this milestone adds only constant-space pitch aggregates and does not redesign the timeline.

**WATCH**, not an architectural optimization mandate. The 48 kHz desktop cases are comfortably below 8 ms, but order-sensitive tails and 96 kHz cases exceeding a 16.7 ms screen-frame budget cannot be dismissed. Thirty analyses per second is a reasonable current monitoring target; 15 Hz presentation is economical, but insufficient evidence for fine vibrato scoring. RAF gates provide upper limits, not guaranteed rates: frame quantization, scheduling and rendering-clock checks can reduce both. Do not reduce cadence before measuring how it affects observation coverage.

If physical profiling demonstrates sustained main-thread trouble, compare small YIN/allocation changes first, cadence reduction only against lost temporal evidence, a Worker against transfer/scheduling cost, and an AudioWorklet against its real-time execution budget and complexity. FFT autocorrelation/another detector would require accuracy, octave-error and latency comparisons, not only a speed claim. None is implemented here.

## End-to-end latency model

| Stage                                      | What is known                                                                                           | What is not measured here                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Microphone capture / OS / device buffering | Existing local Web Audio input                                                                          | Physical input delay, route and browser buffering                                               |
| Analysis window                            | 4096 samples: 92.9 ms at 44.1 kHz, 85.3 at 48 kHz, 42.7 at 96 kHz                                       | A rolling window spans past audio; its duration is not an extra fixed delay to add mechanically |
| Analysis scheduling                        | Gate ≥33.3 ms, RAF and progressing audio clock required                                                 | Actual device cadence/jitter; not guaranteed 30 Hz                                              |
| YIN computation                            | Probe directly measures detector work                                                                   | Analyser copy, callbacks, React, paint, and capture are outside this timer                      |
| PitchSource publication                    | Synchronous after computation, before UI gate; same analysis-start timestamp                            | No measured publication/paint lag; timestamp is not audio capture time                          |
| React presentation                         | Gate ≥66.7 ms; publishes a newly computed frame at each eligible gate                                   | State scheduling, commit and paint delay; this gate also drops intervening frames               |
| Visual smoothing                           | Same-note time constants 150 ms primary / 180 ms target; about 95% of a sustained step after 450/540 ms | Perceived lag on a real sung correction; this is a response curve, not a fixed transport delay  |
| Continuity                                 | Rejected observations can retain a visibly uncertain display for the 160 ms grace policy                | Not measured voice or pitch-success time; no added onset delay for accepted frames              |

Do not sum worst-case windows, gates and time constants into a purported measured latency. Reduced Motion and first/new-note values bypass visual interpolation. Existing timestamps support analysis-start age, but no capture/paint timestamp exists; adding a render-age number would not measure microphone-to-screen latency. No speculative instrumentation was added.

## Physical iPhone procedure

1. On the intended build, append `?audioDiagnostics=1` to the address (use `&audioDiagnostics=1` if another query already exists), then reload. Expand **Pitch analysis performance**, directly below the main tuner. Start the microphone explicitly. This is metadata-only; do not record or upload audio.
2. Record build/commit, iPhone model, iOS/browser version, input route (built-in/headset), Low Power Mode and whether the device is warm. If the development detector panel is available, also note sample rate/window size; otherwise mark these unknown.
3. For each condition—silence, comfortable low note, middle note, higher note—hold that condition until the count reaches 128 and the window has been fully replaced (at least 10 seconds). While still holding, take three readings a few seconds apart. Record **count, p50, p95, maximum, Above 8 ms** for each. Start resets the window; Stop preserves the last one. A screenshot of numbers is enough.
4. Repeat after a reload and after switching low/high conditions, because the desktop run was order sensitive. Report noticeably sluggish controls, jerky history, or audio interruptions alongside the numbers. Values above 8 ms merit attention; they do not alone prove an audible or visible problem.
5. Describe perceived display latency as immediate, slightly delayed, or distracting while changing pitch; no precise milliseconds are implied. Compare ordinary and Reduced Motion modes to separate interpolation feel from computation.
6. Select a target and start Practice. Try a steady tone, then natural vibrato: note average offset, spread, and time in the band independently. A centered oscillation may have a low band percentage; that is not failed singing. A consistently flat tone should show negative average offset even if very steady.
7. Glide slowly through center and across a nearest-note boundary. Check the ±5 / ±10 / close feedback, the stable center, and the distinction between nearest note and selected target.
8. Pause singing, briefly interrupt the tone, then re-enter. Uncertainty must be explicit, silence must not become a centered note, and resumed observations must not credit the gap. Check labels and controls at narrow width and with VoiceOver.

## Before Find → Approach → Hold → Return

Collect the physical measurements above and teacher/singer feedback on the provisional bands. Then build a **calibration evaluation experiment**, not a scored game: compare actual observation cadence, timestamp jitter, accepted/gap coverage, center/spread across complete cycles, attack/approach durations, phase sensitivity, and false holds from repeated target crossings. Decide a named success policy, target-change resets, minimum fresh coverage, a window duration, and what modulated pitch means for the intended exercise. A global average, narrow occupancy, or visual smoothing value must not silently become that policy.

Remaining uncertainty includes physical Safari/Android performance, Node 22 results, actual main-thread/frame attribution, order-sensitive benchmark causes, perception versus cents-domain mean, and pedagogical acceptance. No medical or vocal-style classification, backend, persistence, analytics, audio logging, or new dependency was introduced.
