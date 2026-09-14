# Realtime pitch response polish

## Cadence audit

Scope: the supplied realtime response milestone on `feat/realtime-pitch-response-polish`. YIN mathematics, detector settings, range, calibration and Practice scoring rules remain unchanged.

The previous analyser set `lastAnalysisAt = timestamp` after a `>= 1000 / 30` gate. UI publication repeated that pattern with `1000 / 15`, nested inside accepted analysis scheduling (including fresh rejected pitch observations). Both gates discarded fractional-frame remainder. Exact display timestamps can also fall just below an interval through floating-point subtraction. Fable's approximate rates are therefore not universal.

`src/audio/frameCadence.test.ts` models 60 seconds using `i * 1000 / displayHz`, including a frame at zero. It reproduces the original nested gates and compares the new implementation. These are deterministic synthetic timing results, **not measured iPhone rates**:

| Display Hz | Old analysis Hz | Old UI Hz | Old analysis median / p95 ms | Old UI median / p95 ms | New analysis / UI Hz |
| ---------- | --------------- | --------- | ---------------------------- | ---------------------- | -------------------- |
| 60         | 20.09           | 10.04     | 50 / 50                      | 100 / 100              | 30 / 15              |
| 120        | 26.65           | 13.33     | 41.67 / 41.67                | 75 / 75                | 30 / 15              |
| 30         | 19.96           | 10.01     | 66.67 / 66.67                | 100 / 100              | 30 / 15              |

The new exact model yields 1,800 analyses and 900 publications in every case; analysis median/p95 are 33.33 ms, presentation median/p95 66.67 ms, with no interval variation beyond numerical rounding. Separate cases introduce deterministic ±0.4 ms timestamp jitter. They retain approximately 30/15 Hz; interval variation remains bounded by the display period. Production-loop tests run the actual analyser at all three display rates and verify detector reads, callback counts and raw observation identity.

## Scheduling decision

`createFrameCadence` anchors a next deadline on the first eligible RAF. A due call advances that deadline by the number of elapsed slots. It permits 1 ms early eligibility to avoid dropping an entire low-power frame for sub-millisecond RAF timestamp jitter. The allowance does not accumulate or shorten the nominal interval. A pure numerical epsilon was insufficient under the jittered 30 Hz test.

Each RAF performs at most one analysis. Missed slots are skipped; neither detector work nor old samples are replayed. UI deadlines advance only on fresh computed observations. Rendering-clock progress, context-running checks, startup/stall deadlines, analyser cleanup and microphone ownership remain intact. Detector observations retain their `performance.now()` analysis-start timestamps. There is no setInterval, audio worklet, worker or added dependency.

This fixes nominal cadence, not arbitrary main-thread starvation. RAF slower than 30 Hz or irregularity larger than the allowance can still reduce actual rates. Neighboring intervals may be shorter than the nominal period when recovering phase; long-term computation stays at the intended rate.

## Marker and response

The primary ribbon consumes the existing PitchSource through `useLiveCentsMarker`. Publication acquires new evidence immediately; RAF interpolates SVG geometry directly between observations. There is no React state update per source observation or display frame, and no detector call from rendering. React continues publishing raw note/frequency/cents, accessible measurement text and product state at approximately 15 Hz. The demo path retains its prop-driven presentation.

`transitionLiveCentsDisplay` requires `isFreshPitchSample`, voiced status and an accepted raw observation. Rejected, stale (over 250 ms), future, inactive or absent evidence hides geometry and resets interpolation. Note and session changes acquire directly. Reading the same fresh sample animates only the display; it cannot refresh the observation timestamp. Subscription cleanup cancels RAF. Empty/stale input stops animation until another publication arrives.

Both main and target smoothing use the same pure `smoothVisualCents` function:

- Above 3 cents of remaining display error: exponential time constant 25 ms.
- Within 3 cents: time constant 65 ms to calm small jitter.
- Integrate exactly to the 3-cent crossing, then use the remaining elapsed time for the slower portion. This makes a held step independent of how elapsed time is partitioned across frames.
- First evidence, nearest-note changes, selected-target changes and reduced motion use raw values directly. There is no overshoot, predictive motion or dead zone.

Synthetic 10/30-cent corrections reach less than 2 cents remaining error by 100 ms, versus the old 150/180 ms time constants. ±10/±30-cent, 5 Hz trajectories retain over 65% of their amplitude and more than twice the old filter's amplitude. An additional source-driven test holds actual 30 Hz observations between 60 Hz display reads and retains over 60% amplitude. These tests establish presentation response, not microphone-to-photon latency. The unchanged analyser window, detector work and browser rendering still add delay.

Target guidance retains its existing 15 Hz React presentation path and explicit uncertain hold, shares the new smoothing law, and resets when either the selected target or detected nearest note changes. This avoids a broader target/Practice plumbing migration. The primary ribbon can lead target geometry or text by one presentation interval; physical acceptance should evaluate that remaining difference.

## Categorical labels and measurement truth

`transitionAccuracyLabel` centralizes a 2-cent Schmitt band around the existing absolute 5/10/25-cent boundaries. Initialization uses raw classification. Moving outward requires exceeding boundary + 2; moving inward requires going below boundary − 2. Large corrections traverse multiple bands immediately. New note identity or absent evidence resets label memory.

Main Dead center/In tune/Close labels and target directional instructions use this policy. Numeric cents, accessible numeric measurements, target distance formatting, calibration classification and Practice tolerance remain raw. A remembered label is a presentation category, not a claim that the raw threshold moved. Tests alternate ±0.8 cents around both signs of each boundary: raw categories alternate; displayed categories stay steady until a deliberate crossing.

## Silence versus uncertainty

Core continuity retains its original grace and history/Practice accounting. Presentation checks the published detector's `silence` state separately:

- RMS silence: the direct primary ribbon disappears at the source publication; tuner text and target guidance clear at the next UI publication. No animation toward center.
- Ambiguous rejection: the direct ribbon also disappears immediately. Text and target may retain the existing explicitly uncertain last measurement during continuity's short grace. Rejected candidates never create pitch.
- Stop, stale evidence and failures retain source invalidation and cleanup.

An App integration test gives silence and low-confidence rejection the same timestamp sequence: presentation differs, while live Practice metrics remain identical. Practice and calibration modules are not modified.

## Actual diagnostics

Open `?audioDiagnostics=1` and expand **Pitch analysis performance**. The existing computation timings are joined by **Analysis ~29.8 Hz** and **Presentation ~14.9 Hz** style readouts, each with median interval, p95 interval and observation count. Values come from actual callback wall-clock timestamps, not configured constants or one interval's reciprocal.

Each stream keeps at most 128 timestamps. Rate is `(count - 1) / elapsed span`; interval statistics use that same bounded window. Collection never sets React state. The panel refreshes with existing presentation renders, resets at microphone Start, retains interval statistics after Stop and shows no active rate when stopped or stale. Since there is no independent diagnostics timer, a fully blocked browser may leave the last DOM readout visible until rendering resumes. Default production pages instantiate no cadence probes or diagnostic UI.

## Physical iPhone acceptance: compare BEFORE / AFTER

Use the same iPhone, Safari, room and microphone distance. Compare an already available previous build against this working build; no branch switch is needed. Record iPhone model, iOS version, browser, Reduced Motion and Low Power Mode. For each item, note before/after feel and any visible disagreement:

1. Sustain one note: is small jitter calm without appearing frozen?
2. Correct from about 30 cents flat to center: does the ribbon contract promptly?
3. Glide slowly through center and the ±5/±10/±25 boundaries: do labels stay readable without sticking through a deliberate correction?
4. Sing with natural vibrato, then larger vibrato: does the visual preserve motion?
5. Attack repeated short notes: does each note acquire promptly and reset on note changes?
6. Stop voice abruptly; separately try a breathy/consonant interruption: silence clears, uncertainty is explicitly labeled, and neither invents pitch.
7. Compare ribbon motion with raw cents text and selected-target guidance. Check a nearest-note boundary and Reduced Motion too.
8. Repeat with Low Power Mode if available. Check portrait/landscape and the narrow viewport.
9. After several seconds of singing, record actual Analysis/Presentation Hz, median/p95 intervals and counts from diagnostics for both builds/modes. Record any slowdowns rather than substituting nominal rates.

**Does this now feel more like an instrument and less like a delayed meter?**

Physical singing feel, device microphone freshness, VoiceOver usability and true end-to-end latency remain manual acceptance items. Mobile WebKit mocks validate behavior and layout, not a physical microphone.
