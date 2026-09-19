# VOCAL_TUNER_FIRST_PLAYABLE_SPEC_v1

Status: buildable specification for the first playable prototype ("Pad + Home") on the existing Vocal Tuner codebase (`main` @ `c970b56`). Inputs read in full: Canonical Research Evidence Base v1.0, Mechanics Discovery Pass v1, LX Architecture Synthesis v1, Adversarial Design Review v1. Precedence: canonical base > adversarial review > synthesis > discovery pass.

Conventions:
- `TUNE BY PROTOTYPE` — a starting value is given so the build can run; the value is empirical and must be adjusted in the three-learner test, never argued from theory.
- `HUMAN DECISION REQUIRED` — a product choice the evidence and the review did not settle; a default is given so implementation can proceed, but the default must be confirmed by Nikolai before the human test.
- Existing constants are cited by name; new constants are proposed with a value and a tag.
- "Band" always means the coarse band, `PITCH_CALIBRATION.closeCents` = 25 c, never `inTuneCents` = 10.
- "Fast tier" = per-frame, smoothed, sound-only, never writes state. "Slow tier" = settled evidence, the only writer.

---

## 1. PRODUCT THESIS

The first playable is an instrument before it is an exercise: the learner sings and harmony forms immediately around what they actually sang; holding a note makes the harmony move under them; leaving and coming back to one remembered place (Home) is the only thing the session asks, and it is asked musically, once with a reference and once without. Nothing is graded, named "correct", or called learned. The fast sound tier makes the instrument feel causal; the slow evidence tier records what happened in a form that can be re-scored later. If three learners attribute the harmony to their own voice, explore without being told to, and experience the return as play rather than as a test, the thesis survives and the rest of the architecture can be built on it; if not, the architecture changes before a month is spent.

## 2. FIRST-PLAYABLE WALKTHROUGH

Assumes the prototype mounted as its own mode (§10), microphone permission already granted once, headphones question answered on the start screen (§5.2).

**0–10 s.** *Hears:* nothing until the first sound; on the first voiced sound, within ≈200 ms, a soft pitched shimmer at their own pitch and, ≈150 ms after that, a warm chord that contains their note. *Sees:* a dark vertical field with a faint horizontal band (the comfortable range from the first calibration, or the full field if none); a small glowing dot appears at the height of their voice and moves with it; the field's background takes on the chord's colour wash. *Sings:* anything — a hum, a vowel, a word. *System:* fast tier engages (shimmer, pad); slow tier starts an evidence window; logger opens a `roam` segment. *Changes because of their voice:* the dot's height; the chord. *Invited next:* nothing is written; the response itself invites a second sound.

**10–30 s.** *Hears:* as they move pitch, the chord stays while they stay among its tones and changes when they leave them; when they hold, after ≈2 s a bass note appears beneath and begins to walk (one change every ≈2 s), and the pad thickens while they stay where they were and thins when they wander. *Sees:* the dot; the wash changes hue with the chord; when they hold, a faint horizontal line appears at their held height (the settled center), and the wash "breathes" with the bass. *Sings:* they try holding, then sliding; most try a scale or a song fragment. *System:* slow tier marks settled spans (§4); HOLD begins when a span is stable ≥2 s (`TUNE BY PROTOTYPE`); logger writes `settled_span`, `hold_start`. *Changes:* the bass exists only because they held; the pad's thickness is theirs. *Invited next:* the bass line's return to its first note (a cadence if they are still there) is a musical invitation to hold again.

**30 s–2 min.** *Hears:* the pad following; cadences when holds succeed; the shimmer going airy when they breathe or sing unclearly (voice heard, pitch unclear); silence never — when they stop, the pad releases over ≈1.5 s to a barely audible room tone on the last chord. *Sees:* after ≈20 s of voicing, a soft ring appears at one height in the band: Home, proposed from where they dwelt most (§5.1). No text beyond the word "Home" beside the ring (`HUMAN DECISION REQUIRED` on wording/language, §17). *Sings:* they notice the ring and, typically, sing toward it. *System:* Home candidate computed from settled spans; when the learner first settles inside Home's band, the Home tone (the existing drone) enters for ≈2 s *after* the span closes (never during measurement), the ring lights, and Home is confirmed and persisted. *Changes:* Home is now a place that responds (lit ring, a fuller chord voiced around it). *Invited next:* to leave.

**2–5 min.** *Hears:* free play — the pad, holds with bass, the occasional cadence; the Home tone is silent now (reference removed). *Sees:* the dot, the wash, the Home ring at rest, a faint trace of where they have been in the last few seconds (fast-tier dot trail, ≤2 s). *Sings:* roaming, a song if they want (the pad harmonises it; there is no song mode and no lyrics), holds. *System:* logger writes `roam` segments and settled spans; the Home session controller waits for the learner to be away from Home ≥60 s (`TUNE BY PROTOTYPE`). *Changes:* the whole harmonic landscape is theirs. *Invited next:* at ≥60 s away and during a pause in voicing, the Home ring pulses once and the pad thins to room tone: the world quietens and waits. This is the warm return invitation (the pad's last chord — tonal context — is still faintly present).

**5–10 min.** *Hears:* on their next settled note, the pad forms the chord of where they actually are (fast); when the span settles, the Home tone enters and the pad reharmonises so that both their note and Home are chord tones — they hear the relation (unison, or an interval); if they are inside Home's band the ring lights and the chord blooms; otherwise the ring stays soft and a small ring marks where they landed, above or below Home. Then, with the Home tone sounding, they slide to it; when they settle inside the band, the ring lights. It always ends lit. *Sees:* landing ring, Home ring, the wash; no numbers. *Sings:* the return, then the find. *System:* `return_attempt{mode: warm}`, `return_reveal`, `find_settled`, `home_lit`. Later in the session (≥90 s after the last Home tone, and after the pad has fully released to silence so that no tonal context remains), the same invitation occurs once more with no room tone at all — the bare return — and the same reveal and find follow. *Changes:* their voice decided whether the ring lit before the tone came. *Invited next:* the session ends musically: after the last lit Home, the bass walks a final cadence under a held Home and the pad resolves; the learner may keep roaming or press "done".

The learner reads no explanation: the dot moves with the voice (heard → seen), the chord changes with the voice (heard), Home is a ring that lights when they are there (seen + heard), the invitation is the world going quiet (heard + a pulse).

## 3. PAD SPECIFICATION

Smallest viable harmonic responder. Purpose: test whether the environment feels causally connected to the voice.

**Input.** `PitchSource` (`src/pitch/pitchSource.ts`) subscription — published at the analysis cadence (≈30 Hz, `pitchAnalysisConfig.analysisIntervalMs`), `PitchSample{frequencyHz, fractionalMidi, confidence, voicing, freshness, raw}`. Not the 15 Hz `onDetection` path. Also `raw.rms` and `raw.rejectionReason` for the airy shimmer.

**Pitch representation.** Fast tier works in `fractionalMidi` (from the sample) and in *pitch class* (`fractionalMidi mod 12`, octave-invariant) for harmony. Two smoothers, both first-order exponential in the time domain (as `smoothVisualCents` in `src/tuner/visualResponse.ts` does for cents):
- shimmer smoother: `VISUAL_RESPONSE.fastTimeConstantMs` (25 ms) when moving, `quietTimeConstantMs` (65 ms) when within `quietDisplacementCents` — reuse the existing function on a midi-cents scale; the shimmer follows vibrato (expressive).
- harmony smoother: time constant `PAD_HARMONY_SMOOTHING_MS = 180` (`TUNE BY PROTOTYPE`, range 120–250) applied to fractionalMidi before pitch-class quantisation; this is what keeps ±50 c vibrato from flipping chords.

**Hysteresis.** Pitch-class quantisation uses a dead zone: the quantised pitch class changes only when the smoothed value crosses the semitone boundary by more than `PAD_PC_HYSTERESIS_CENTS = 20` (`TUNE BY PROTOTYPE`, 15–30); plus a minimum chord dwell `PAD_CHORD_DWELL_MS = 250` (`TUNE BY PROTOTYPE`) during which a new chord cannot be selected. The existing `LABEL_HYSTERESIS_CENTS` (2 c) is for labels and is not reused here.

**Octave-flip handling.** Harmony is pitch-class based, so a detector octave error (C054: mixed windows read the lower octave) changes nothing harmonic. The shimmer's octave is protected: if a new sample differs from the shimmer smoother's value by 1100–1300 c and the previous voiced sample was <150 ms ago, the shimmer keeps its octave for up to `PAD_OCTAVE_SUPPRESS_MS = 300` (`TUNE BY PROTOTYPE`); if the new octave persists beyond that, the shimmer glides to it over 120 ms. Bass and pad voicings use fixed registers (§3 "musical mapping") and never follow the sung octave.

**Voiced / unvoiced behaviour.** From `sample.voicing` (`voiced | unvoiced | uncertain`) and `freshness`:
- `voiced`: pitched shimmer + harmony active.
- `uncertain` (signal present, pitch rejected: low confidence, out of range) with `raw.rms ≥ minimumRms`: *airy shimmer* — a band-limited noise swell at low level following `raw.rms`; harmony holds its last chord (no change). This is the "voice heard, pitch unclear" acknowledgement; silence is never the response to sound.
- `unvoiced` or `stale`/`inactive`: shimmer releases (≈150 ms); harmony sustains through the continuity grace (`DEFAULT_PITCH_CONTINUITY_CONFIG.gracePeriodMs` = 160 ms) then releases to *room tone*: the last chord held at `PAD_ROOM_TONE_GAIN = 0.06` of full level (`TUNE BY PROTOTYPE`) after a `PAD_RELEASE_MS = 1500` release (`TUNE BY PROTOTYPE`). Room tone is cut to true silence only by the bare-return invitation (§5.4) or "done".

**Latency budget** (perceived, onset → audible): detector window 85.3 ms (pitch centred ≈43 ms before its timestamp, C054) + analysis cadence ≤33 ms + shimmer smoother ≈25–65 ms + shimmer attack `PAD_SHIMMER_ATTACK_MS = 20` + output latency (device, typically 10–50 ms) ≈ **150–230 ms to shimmer**; harmony adds the 180 ms smoother, hysteresis and `PAD_CHORD_ATTACK_MS = 90` (`TUNE BY PROTOTYPE`, 60–120) ≈ **350–450 ms to a chord change**. Both are logged per event (§9) so the human test can relate felt causality to measured delay. No component may add buffering beyond this budget; if the three-learner test fails on causality (§16), the first lever is the harmony smoother, the second is the chord attack.

**Musical mapping.** Key = Home's pitch class as tonic, **major** mode (`HUMAN DECISION REQUIRED`: default major; minor or a mode switch is deferred). Before Home exists, key = the pitch class of the first settled span. Diatonic triads I, ii, iii, IV, V, vi (vii° excluded from selection; its tones are covered by V and ii). Chord selection on each quantised pitch class change:
1. If the current chord contains the pitch class → keep it (harmonic stickiness; the chord is a natural hysteresis wider than a semitone).
2. Else choose among diatonic triads containing the pitch class the one with the smallest voice-leading distance from the current voicing (sum of semitone moves); ties → prefer I, then IV, then V.
3. Chromatic pitch class (not in the key) → keep the current chord and add the sung pitch class as a colour tone (a fourth pad voice at low gain); no chord change. (Deferred: borrowed chords.)
Voicing: three pad voices in a fixed middle register (`PAD_VOICING_LOW_MIDI = 48`, `HIGH = 72`, `TUNE BY PROTOTYPE` by timbre), closest-voice-leading; the sung pitch class is always present in the voicing (doubled by the shimmer at the sung octave).

**Harmony behaviour (thin/bloom).** Level of the pad's upper voices follows *distance to the nearest chord tone* of the current chord, computed on the harmony-smoothed pitch (octave-invariant): distance ≤ `closeCents` (25 c) → full ("bloom"); 25–50 c → linear thinning to `PAD_THIN_FLOOR = 0.35` (`TUNE BY PROTOTYPE`); ≥50 c → the quantiser will already have flipped or be flipping. The level passes through a slow envelope `PAD_THIN_ENV_MS = 250` (`TUNE BY PROTOTYPE`) so vibrato produces a steady average thinning, not flutter. The root voice never thins.

**Bass behaviour (HOLD).** Triggered by the slow tier only (§4 state SETTLED with `holdMs ≥ PAD_HOLD_TRIGGER_MS = 2000`, `TUNE BY PROTOTYPE`). The bass plays a progression under the held pitch class, one chord every `PAD_BASS_STEP_MS = 2000` (`TUNE BY PROTOTYPE`; tempo-free), chosen so that the held pitch class is a chord tone in every chord and the last chord is I (or contains I as a resolution). Default tables (`HUMAN DECISION REQUIRED` — musical content; defaults let Codex proceed): held 1 → I · vi · IV · V(sus4→3) · I; held 3 → I · iii · vi · IV · I; held 5 → I · iii · V · IV? (5 is not in IV) → I · iii · V · vi · I; held 2, 4, 6, 7 → I · (the two diatonic triads containing the degree, in the voice-leading order) · V · I. While the bass walks, the pad reharmonises around the *held* pitch class; thin/bloom continues to follow the *current* voice. On the final chord: if the voice is still inside the band of the held pitch → resolution (a fuller I voicing with a soft swell, "cadence"); otherwise the bass returns to I and the pad reharmonises to wherever the voice is now — the music goes where the singer is. Bass register `PAD_BASS_MIDI_LOW = 36–47`.

**Silence behaviour.** See voiced/unvoiced: shimmer release → pad release → room tone. Room tone must be inaudible enough not to act as a drone and must be *muted entirely* during the bare-return invitation and measurement (§5.4), because a sounding chord is tonal context (partial reference).

**Transition behaviour.** Chord changes are cross-faded (`PAD_CHORD_CROSSFADE_MS = 120`, `TUNE BY PROTOTYPE`) with voice-leading (each pad voice glides ≤2 semitones or re-attacks if further). The shimmer glides continuously (it is the voice). Bass notes have a short attack and a release equal to the step so they overlap slightly. No transition may exceed 200 ms end-to-end except the release to room tone.

**Tolerances the fast tier must meet** (verified in §13): ±50 c vibrato without chord flips or audible flutter; ±100 c vibrato without more than one chord change per second; slow scoops produce a glide of the shimmer and at most one chord change; fast scoops (≤150 ms) produce no chord change before the settled pitch; a 100–300 ms unvoiced gap changes nothing (grace + release); breath noise produces airy shimmer, not chords; a very quiet singer still gets shimmer if `raw.rms ≥ minimumRms` (0.005) — below that the microphone level indicator is the only feedback (`HUMAN DECISION REQUIRED`: whether to lower `minimumRms` for the prototype; default unchanged); a very loud singer produces no clipping in the pad (fixed gains; the pad does not follow RMS except the airy shimmer); an unstable novice produces chord changes no faster than the dwell allows; rapid note changes (≥3 per second) produce shimmer that follows and a chord that lags — acceptable.

**Timbre.** `HUMAN DECISION REQUIRED` (musical taste). Default for the build: pad voices = two detuned sawtooth oscillators per voice through a low-pass (cutoff ≈1.2 kHz) with 90 ms attack; shimmer = a sine an octave above the sung pitch plus its fifth at low level, 20 ms attack; airy shimmer = band-passed noise (1–4 kHz) at low level; bass = a sine with a soft second partial. The existing drone timbre profiles (`referenceDroneTimbre.ts`) are reserved for the Home tone so that the Home reference is timbrally distinct from the pad.

## 4. FAST / SLOW STATE MACHINE

Two machines run concurrently and communicate only in one direction: the slow machine may *command* the fast tier (start bass, mute for bare return, play reveal); the fast tier never informs the slow machine's state, and the slow machine never reads fast-tier smoothed values for outcomes.

### 4.1 Fast tier machine (per `PitchSample`)

| State | Entry | Exit | Audio | Visual | Log |
|---|---|---|---|---|---|
| F_IDLE | session start, or ≥`PAD_RELEASE_MS` after last voiced/uncertain sample | any sample with `voicing ≠ unvoiced` or `raw.rms ≥ minimumRms` | room tone (or silence if muted) | dot hidden; wash at rest | none (fast tier logs nothing except trace rows, §9) |
| F_HEARD | sample uncertain with rms ≥ minimumRms | voiced sample → F_VOICED; rms < minimumRms for >160 ms → F_RELEASING | airy shimmer following rms | dot shown faint at last known height (or centre), pulsing with rms | trace row |
| F_VOICED | voiced sample | unvoiced/uncertain → F_HEARD or F_RELEASING after grace 160 ms | pitched shimmer (fast smoother); harmony from harmony smoother + quantiser + chord selector; thin/bloom | dot at smoothed height; wash hue = chord; trail ≤2 s | trace row |
| F_RELEASING | no voiced/uncertain sample for 160 ms | voiced → F_VOICED; timeout `PAD_RELEASE_MS` → F_IDLE | shimmer released; pad releasing toward room tone | dot fading | trace row |
| F_MUTED | command `mute` from slow tier (bare invitation) | command `unmute` | shimmer stays active on voice; pad and room tone silent | wash off; dot on | none |

Race conditions in the fast tier: samples arriving out of order are impossible (single producer), but `freshness: 'stale'` (≥`PITCH_SOURCE_MAX_AGE_MS` = 250 ms) must be treated as no sample (do not smooth toward a stale value). A `sessionGeneration` change resets both smoothers and the chord to none.

### 4.2 Slow tier machine (per `ShortWindowPitchEvidence` snapshot, polled at the presentation cadence, 15 Hz)

| State | Entry condition | Exit condition | Slow-tier behaviour | Command to fast tier | Visual | Log event |
|---|---|---|---|---|---|---|
| S_IDLE | no voiced run | first voiced sample (`latestState = voiced`) → S_TRACKING | opens a *voiced run* record: `onsetMs` = timestamp of the first voiced sample | none | — | `run_open{onsetMs}` |
| S_TRACKING | voiced run open, not settled | settled criterion met → S_SETTLED; run ends (unvoiced > 160 ms) → S_RUN_END | accumulates the run; computes snapshot each poll | none | settled line hidden | — |
| S_SETTLED | `windowSufficiency` sufficient AND `spreadCents ≤ PAD_SETTLE_SPREAD_CENTS` (60, `TUNE BY PROTOTYPE`; internal gate only) AND `|Δcenter|` between consecutive snapshots ≤ 15 c for 2 polls | center moves by > `closeCents` (25) between snapshots → S_TRACKING (span closes); run ends → S_RUN_END; `holdMs ≥ 2000` → HOLD command (stays S_SETTLED) | opens a *settled span*: `settledStartMs`, running `centerFractionalMidi` (duration-weighted median, existing), uniform mean (computed from the run's samples in this module), `spreadCents` (internal), `voicedCoverage` | at `holdMs ≥ 2000`: `startBass(heldPitchClass)`; on span close: `stopBass` at the next chord boundary | faint settled line at center height | `settled_span_open`, `hold_start` |
| S_RUN_END | unvoiced beyond grace | immediately → S_IDLE (after closing records) | closes span and run; finalises center definitions available now; writes outcome if a return attempt was pending (§5) | `stopBass` (at boundary) | line fades | `settled_span_close{center, uniformMean, spread, durations}`, `run_close` |
| S_REVEAL | a return attempt closed (§5) | reveal audio finished (≈2.5 s) | computes `offsetCents = 1200·(center − homeMidi)/12`… precisely `100·(centerFractionalMidi − homeMidi)`; category by `closeCents`/`visualLimitCents` | `playHomeTone(2 s, after span close)`, `reharmoniseAround(home, landing)`, `bloom` if in band | landing ring; Home ring lit if in band | `return_reveal` |
| S_FIND | reveal finished and Home not lit | first settled span with center inside Home band → S_LIT | Home tone keeps sounding (reference available); measurement windows during the tone are flagged `referenceSounding=true` and *do* count for FIND (this is a reference-available action by definition), but never for a return attempt | Home tone on | Home ring soft, dot | `find_settled{…, referenceSounding: true}` |
| S_LIT | Home found (with or without reference) | next invitation | Home confirmed/persisted; exposure timestamp updated when the tone last sounded | `homeToneOff`, `bloom` | Home ring lit | `home_lit{how: cold\|warm\|found}` |

"Settled" is a measurement policy, not a learner-facing claim; `spreadCents` is used only as an internal stationarity gate and is never displayed (Product Firewall).

### 4.3 Race conditions and edge cases

- **Voice disappears during settling.** S_TRACKING → S_RUN_END without a span; nothing is written as an outcome; if a return attempt was pending, it remains pending (the invitation stays open; no "failed" state exists). Log `run_close{settled: false}`.
- **Octave flip mid-span.** The evidence window's median will jump by ≈12 semitones if the flip persists for >50% of the window; the `|Δcenter| > 25 c` rule closes the span. A span closed by an octave jump is logged with `closeReason: 'center_jump'` and `octaveSuspect: true` if `|Δ| ∈ [1100, 1300] c`. Harmony (pitch-class) is unaffected on the fast tier.
- **Reference audio leaks into the microphone.** Structural rule: **no return-attempt measurement while any reference (Home tone) or room tone is sounding.** The Home tone plays only after the return span has closed; the bare invitation mutes room tone; the warm invitation reduces room tone to `PAD_ROOM_TONE_GAIN` and flags every window in the attempt with `contextSounding: true` (this is why warm and bare are different conditions). Additionally, headphones state is asked and logged; with speakers, the Home tone during FIND is played at ≤`REFERENCE_DRONE_SAFE_MAX_GAIN × 0.5` and FIND spans are flagged `referenceSounding: true`. A leakage self-test (§13) verifies that the Home tone alone through speakers does not produce a `voiced` sample at the Home pitch class for >2 consecutive samples; if it does on a given device, the prototype records `leakageDetected: true` in the session header and the human test treats that device's FIND data as contaminated.
- **Pitch changes during the reveal.** The reveal is about the closed span; new voicing during the reveal is fast-tier only (the pad follows) and opens a new run; if the learner immediately slides to Home during the reveal, that becomes the FIND span (allowed — it is the intended gesture).
- **Learner intentionally glides.** Slow tier: no span (spread gate) → nothing written; fast tier: shimmer glides, harmony changes with hysteresis and dwell. Glides are logged as runs without spans (`settled: false`), which is the honest description.
- **Two notes rapidly.** Two runs or one run with two spans if each lasts ≥300 ms with sufficiency; otherwise none. The fast tier follows both.
- **Outside the expected range.** Detector range is 65–1200 Hz (`MINIMUM_APPLICATION_FREQUENCY_HZ`…); outside → `uncertain`/rejected → airy shimmer. Inside the detector range but outside the comfortable band: fully valid; the visual field scrolls/scales to include it (no clamping of the dot).
- **Session generation change** (mic restart): both machines reset; open runs are closed with `closeReason: 'session_reset'`; the Home session controller returns to its last stable phase.
- **Home tone still sounding when a run starts** (learner sings over the reference during FIND): valid FIND span; flagged.
- **`windowSufficiency` flicker** at 15 Hz polling (coverage flicker 0.934–0.999 observed in probes): the settled criterion requires two consecutive qualifying polls; a single insufficient poll does not close a span (close only on `|Δcenter| > 25 c` or run end).

## 5. HOME SPECIFICATION

The smallest memory/return mechanic. Home is one pitch (a fractional MIDI value, stored as `homeMidi` with its pitch class and octave), persisted across sessions. Home is never a "card": it is the place the world lights up.

### 5.1 First encounter

- Trigger: ≥20 s of cumulative voicing in the session and ≥3 settled spans (`TUNE BY PROTOTYPE`).
- Proposal: `homeMidi` = the center of the settled span cluster with the most cumulative settled duration, restricted to spans whose center lies within the middle 60% of the observed voiced range (avoids edges). Rounded to the nearest semitone (Home is a note, so the Home tone can be played by the existing drone) — `HUMAN DECISION REQUIRED`: system-proposed (default) vs learner-chosen ("make this Home" while holding). The default is chosen because the review's P3 assumes Home is *given and found*; the alternative is one button and can be switched before the test.
- Presentation: a ring appears at Home's height; no tone yet.
- Confirmation: the first settled span whose center is inside Home's band (±25 c) confirms Home. On confirmation: after the span closes, the Home tone (existing drone engine, `play({midiNote, frequencyHz})`) sounds for `HOME_TONE_MS = 2000` (`TUNE BY PROTOTYPE`), the ring lights, `home_set` is logged and persisted. If no span lands inside Home within 60 s of the proposal, the Home tone plays once *as an invitation* (reference available), and the next settled span inside the band confirms; this path is logged `home_set{how: 'with_reference'}` vs `'without_reference'`.

### 5.2 Reference presentation

- The Home tone is the existing reference drone (single voice, `referenceDroneTimbre` profile by register), timbrally distinct from the pad.
- It sounds only: at confirmation (after the span closes); as a FIND aid after a reveal; and never during a return attempt's measurement.
- Headphones: the start screen asks one question — "Headphones or speakers?" (two buttons) — logged as `outputDevice`. With speakers the Home tone plays at reduced gain (§4.3) and FIND spans are flagged. `HUMAN DECISION REQUIRED`: whether speakers are allowed at all in the human test (default: allowed, flagged; recommended: headphones for all three learners).
- Every Home tone start/stop is logged with timestamps (`reference_on`, `reference_off`) so "delay since exposure" is exact.

### 5.3 Free exploration away from Home

- Nothing constrains exploration. The pad follows; holds start the bass.
- "Away" is measured, not enforced: the learner is *away* when no settled span has been inside Home's band for `HOME_AWAY_MS = 60000` (`TUNE BY PROTOTYPE`, 45–90 s).
- The visual Home ring stays visible at rest (a place exists); it does not pulse or count down.

### 5.4 Return

Two return modes, both invited by the world quietening, never by text:

- **Warm return** (tonal context present): when away ≥60 s and the learner is in F_RELEASING/F_IDLE (a pause), the Home ring pulses once and the pad drops to room tone (the last chord, faint). The next settled span is the return attempt. Logged `mode: 'warm'`, `contextSounding: true`, `delaySinceExposureMs`.
- **Bare return** (no context): later in the session (≥90 s after the last `reference_off` and ≥60 s away, `TUNE BY PROTOTYPE`), during a pause, the pad is *muted entirely* (F_MUTED; room tone off) for the invitation; the ring pulses once. The next settled span is the return attempt. Logged `mode: 'bare'`, `contextSounding: false`. Exactly one bare return per session (the review's "one bare probe"); a second is never scheduled.
- Attempt closure: the return attempt is the *first* settled span after the invitation (a run without a span — a glide — does not consume the invitation). The attempt's center is compared to `homeMidi`.
- Reveal (S_REVEAL): after the span closes, the fast tier is unmuted, the pad forms the chord of the landing (already true on the fast tier), then the Home tone enters and the pad reharmonises to contain both pitch classes; if `|offset| ≤ 25 c`: bloom, ring lit, `home_lit{how: mode}`; else: the landing ring appears above/below Home at the landing height, Home ring stays soft, and FIND begins with the tone sounding.
- FIND: with the Home tone on, the first settled span inside the band → ring lit, `home_lit{how: 'found'}`, tone off after 1 s. There is no time limit and no failure; if the learner stops singing, the tone fades after 6 s and the invitation is considered answered (`return_reveal{found: false, abandoned: true}` — a descriptive flag, never shown).
- The learner-facing vocabulary is exactly: the ring (soft / lit), the landing ring (above / below), the tone, the bloom. No words other than "Home" (`HUMAN DECISION REQUIRED`: language, §17). Nothing says test, pass, fail, correct, wrong, learned, remembered, forgot.

### 5.5 Next-session return

- On launch with a persisted Home: the ring is shown at rest immediately; no tone. After ≥20 s of voicing and a pause, the **bare** invitation occurs first (before any Home tone has sounded this session) — this is the next-day cold return, logged `mode: 'bare'`, `delaySinceExposureMs` = time since the last `reference_off` of the previous session, `sessionIndex`. Then the session proceeds as §6 (with the warm return later, and no second bare return).
- Home never changes automatically. `HUMAN DECISION REQUIRED`: whether the learner may re-choose Home (default: yes, via a single "new Home" control that resets the persisted value and logs `home_reset`).

### 5.6 What gets logged (all in §9)

`home_proposed`, `home_set`, `reference_on/off`, `away_reached`, `return_invited{mode}`, `return_attempt{mode, span, offsetCents, category, contextSounding, referenceSounding:false, delaySinceExposureMs, outputDevice}`, `return_reveal`, `find_settled`, `home_lit{how}`, `home_reset`. No mastery state exists; the only persisted Home fields are `homeMidi`, `createdAt`, `lastReferenceOffMs`, `sessionCount`.

## 6. CANONICAL SESSION (7–10 minutes)

| # | Step | Learner action | System action | Fast consequence | Slow measurement | Data logged | Possible next branch |
|---|---|---|---|---|---|---|---|
| 1 | Enter | opens play mode; answers headphones/speakers; starts mic | mic session begins; pad engine activated from the gesture; leakage self-test runs silently if speakers (§13) | silence (F_IDLE) | none | `session_start{outputDevice, device, sampleRate, build, homeExists, leakageDetected}` | Home exists → step 9 first (next-session bare return), else step 2 |
| 2 | Discover response | makes any sound | fast tier engages | shimmer, then chord | first run opens | `run_open`, trace rows | learner explores (3) or holds (4) |
| 3 | Roam | slides, scales, fragments | harmony follows with stickiness | chord changes at pitch-class changes; airy shimmer on breaths | spans open/close as they settle | `settled_span_*`, `roam` segment | Home proposed after 20 s voicing (5) |
| 4 | Hold | holds a note | slow tier reaches holdMs ≥ 2 s | bass walks; thin/bloom; cadence or "goes where you are" | span duration, thin/bloom level trace | `hold_start`, `bass_step`, `hold_end{resolved}` | back to roam |
| 5 | Home proposed | notices the ring | ring appears at the most-dwelt pitch | none (visual only) | candidate computed | `home_proposed{homeMidi, method}` | learner settles inside band (6) or 60 s pass → tone invitation (6b) |
| 6 | Home confirmed | settles inside Home's band | after span close: Home tone 2 s, ring lit | bloom | span center vs homeMidi | `home_set{how}`, `reference_on/off` | free play (7) |
| 7 | Leave / play | roams, sings a song over the pad, holds | pad follows; bass on holds | as 3–4 | spans; away timer | `roam`, spans, `away_reached` | when away ≥60 s and paused → 8 |
| 8 | Warm return | hears the world quieten, sees the ring pulse; sings | room tone faint; next settled span = attempt | pad forms landing chord | offset vs homeMidi | `return_invited{warm}`, `return_attempt` | reveal (9) |
| 9 | Reveal | listens | Home tone enters; pad contains both | relation heard; bloom if in band | category | `return_reveal` | lit → 11; else FIND (10) |
| 10 | Find | slides to the tone | tone stays on; ring lights on the first settled span inside band | bloom | FIND span | `find_settled`, `home_lit{found}` | 11 |
| 11 | Free roam / song door | sings whatever they like; a song if they want | pad follows; no items, no lyrics, no mode | music | spans logged as roam | `roam` | ≥90 s after `reference_off` and paused → 12 |
| 12 | Bare question | hears total silence and a single pulse; sings | pad muted; next settled span = attempt | after span close: unmute, landing chord, Home tone, reveal | offset vs homeMidi, `contextSounding:false` | `return_invited{bare}`, `return_attempt{bare}`, `return_reveal` | lit → 13; else FIND → 13 |
| 13 | Finish musically | holds Home (or anything) | bass walks a final cadence; pad resolves; "done" available | cadence | last span | `session_end{durationMs, spans, returns}` | learner may continue roaming; nothing further is asked |

Timing guide (not enforced): steps 1–6 ≈ 2–3 min; 7–10 ≈ 2–3 min; 11–13 ≈ 3–4 min. Two return attempts per session in total (one warm, one bare) except the first session, which has one of each after Home is set, and later sessions, which open with the bare one. Nothing in the session is timed by a visible clock.

## 7. CONSEQUENCE VOCABULARY

Kept to six. Duplicates removed: "chord bloom on arrival" (synthesis) is subsumed by thin/bloom + reveal; "relation chord" as a separate mechanic is subsumed by the pad's harmonic mapping (the chord that contains what you sang *is* the relation chord) and by the reveal's reharmonisation around Home and the landing; "warmth" as a spoken/word cue is replaced by the landing ring's position (above/below) — no words.

| Consequence | Purpose | Tier | Information carried | Musical role | Failure behaviour | Possible ambiguity |
|---|---|---|---|---|---|---|
| **Always-on shimmer** (pitched; airy when pitch unclear) | the voice is heard; causality at the shortest latency | fast | that sound is heard; where the pitch is (pitched) or only that there is sound (airy) | the singer's own line, doubled an octave up, faint | if the detector rejects: airy shimmer; if rms below floor: nothing (mic indicator only) | airy vs pitched may be misread as "good vs bad" — it must sound like breath, not like a warning |
| **Voice-following pad** (chord containing the sung pitch class) | the environment responds harmonically to *what was sung* | fast | which pitch class you are on, coarsely (chord quality changes are audible; exact pitch is not) | the harmonic bed | on chromatic notes: chord holds, colour tone added; on octave errors: nothing changes (pitch class) | a chord may stay through a small pitch change (stickiness) — the learner may not hear that they moved 40 c; thin/bloom carries that |
| **Thin/bloom** | continuous in/out of the current chord tone's band | fast (slow envelope) | distance from the nearest chord tone, in two zones (≤25 c full; 25–50 c thinning) | texture | with vibrato: steady partial thinning; on dropout: continuity grace then release | thinning from *drifting* vs from *vibrato* is not distinguished — acceptable; both are "not centred" |
| **Bass movement (HOLD)** | reward for staying; makes holding a musical act | slow-triggered, fast-rendered | that a hold was recognised; whether the voice stayed through the progression (cadence vs "goes where you are") | the progression; the cadence | if the voice leaves: the bass returns to I and the pad follows the voice — no resolution, no penalty | the learner may not know *why* there was no cadence (left vs stopped singing); the ring/line visual shows the held height |
| **Reveal** (landing chord → Home tone → reharmonised chord containing both) | the return outcome heard as a relation, then found | slow | interval between landing and Home, as sound; in-band or not, as bloom + ring | the moment of return | out of band: no bloom, landing ring above/below, FIND with the tone — always ends lit | the interval is heard but not named; non-musicians may not identify direction from sound alone — the landing ring position carries direction visually |
| **Room tone / quiet** | silence that is not dead; the invitation | fast | the world is waiting (pulse) | rest | none | warm (faint chord) vs bare (true silence) must be audibly different, or the two conditions are confounded in the learner's experience |

Pleasantness under inaccuracy: every state of every consequence is a consonant sound (a diatonic triad, a shimmer, a bass note in key) or silence. There is no dissonant "error" sound; the only unpleasant thing that can happen is *thinness* or *no cadence*, and both resolve as soon as the voice settles anywhere.

## 8. VISUAL SPECIFICATION

Not a tuner needle. One canvas, one vertical axis (pitch, log-frequency = MIDI), no time axis in the learner view.

### 8.1 Learner view (`PadStage`)

| Element | Communicates | Driven by | Rules |
|---|---|---|---|
| Field | a place with height | static; height range = comfortable band ± margin, auto-extending to include any sung pitch | no note names, no lines per semitone, no cents; a faint horizontal band marks the comfortable range once calibrated |
| Voice dot | the voice is heard; where it is | fast tier (shimmer smoother value); size/brightness from `raw.rms` (log-scaled) | present whenever F_HEARD/F_VOICED; faint and pulsing (no height change) in F_HEARD; fades in F_RELEASING; never hidden while sound is heard |
| Trail | the recent path (≤2 s) | fast tier | fades; no persistence beyond 2 s (this is not the history graph) |
| Wash | the environment is responding | fast tier chord; hue by chord root (12 hues), saturation by thin/bloom level | changes with chord cross-fade timing; off in F_MUTED |
| Settled line | a hold is recognised | slow tier settled span center | thin horizontal line at the span center while a span is open; fades on close; no label |
| Home ring | Home exists / is lit | Home session controller | soft ring at `homeMidi` height when set; lit (brighter, larger halo) on `home_lit`; pulses once on invitation; the word "Home" beside it (`HUMAN DECISION REQUIRED`: language) |
| Landing ring | where the return landed | slow tier return attempt | small ring at the attempt's center height, shown during reveal and FIND; disappears on `home_lit` |
| Bass pulse | the bass is walking | bass step events | a soft pulse of the field's lower edge on each bass step |
| Quiet state | the world is waiting | invitation | wash off (bare) or dimmed (warm); one Home ring pulse |
| Mic level | sound is reaching the app | existing `inputLevel` from `useMicrophone` | small, unobtrusive; the only feedback when rms is below the detector floor |
| Controls | start/stop mic; headphones/speakers (start screen); "done"; "new Home" (`HUMAN DECISION REQUIRED`, §5.5); a hidden long-press to open the research view | — | no other controls; no settings in the learner view |

**Cents.** Do not appear anywhere in the learner view. The landing ring's *position* is the only representation of the return offset; it is a height, not a number. Note names do not appear in the learner view by default; `HUMAN DECISION REQUIRED`: a "show note names" toggle (display only, never verdict) for trained learners (review archetypes C/E) — default off, toggle present but hidden behind the research view.

**Wording rules (Product Firewall).** The learner view contains no text beyond "Home", "Headphones / Speakers", "Start / Stop", "Done", and any `HUMAN DECISION REQUIRED` labels; none of: in tune, correct, wrong, good, bad, learned, mastered, test, score, accuracy, cents.

### 8.2 Research/debug view (`PadDebugPanel`, behind `?padDebug`)

A separate component tree mounted only with the runtime flag (extend `createRuntimeFeaturePolicy` with `showPadDebug`). Shows: fast-tier state, smoothed midi (both smoothers), quantised pitch class, current chord and voicing, thin/bloom level, latency estimate (sample timestamp → audio scheduling time); slow-tier state, open run/span with `onsetMs`, `settledStartMs`, center (median and uniform mean), spread, sufficiency, `holdMs`; Home controller phase, `homeMidi`, delay since exposure, last return attempt with offset in cents and category; the last 20 log events; export button (JSONL download); the existing `TunerReadout`/`PitchDiagnostics` may be mounted here for comparison. This view may show cents and note names because it is not learner-facing; it must never be visible in the learner view, and the human test is run with it closed.

## 9. DATA CONTRACT

All events are JSON lines with `{t: number (performance.now() ms), sessionId, seq, type, ...}` appended to an in-memory ring and persisted to IndexedDB (fallback: localStorage chunks) with a JSONL export. Raw data is preserved: the 30 Hz fast trace is logged in full, so any center definition can be recomputed offline (H010/E-G).

Column key: **LF** learner-facing (shown in the learner view?), **Allowed** scientific interpretation permitted now, **Forbidden** interpretation never permitted for this field.

### 9.1 Session

| Field | Type | Source | When | LF | Allowed | Forbidden |
|---|---|---|---|---|---|---|
| `sessionId` | string (uuid) | logger | `session_start` | no | grouping | — |
| `sessionIndex` | int | homeStorage | start | no | ordering across days | "progress" |
| `startedAtIso`, `endedAtIso` | string | clock | start/end | no | delay computations | — |
| `build` | `{commit, version}` | `buildInfo` | start | no | provenance | — |
| `device` | `{userAgent, platform, sampleRate, fftSize, analysisIntervalMs}` | `PitchDetectorSettings`, `pitchAnalysisConfig` | start | no | timing/latency analysis | — |
| `outputDevice` | `'headphones' \| 'speakers'` | start screen | start | yes (the question) | condition; leakage gating | — |
| `leakageDetected` | bool \| null | self-test | start | no | contamination flag for FIND spans | — |
| `homeExists` | bool | homeStorage | start | no | whether a next-session bare return is possible | — |
| `constants` | object | all `PAD_*`/`HOME_*` values and `PITCH_CALIBRATION` | start | no | reproducibility; versioned tuning | — |

### 9.2 Fast trace (`trace` rows, ≈30 Hz, compact arrays)

`["t", "ts", "f0", "conf", "rms", "voicing", "rr", "shimmerMidi", "harmMidi", "pc", "chord", "thin", "state"]`

| Field | Type | Source | LF | Allowed | Forbidden |
|---|---|---|---|---|---|
| `ts` | number | `PitchSample.timestampMs` (end of analysis window; pitch centred ≈43 ms earlier, C054) | no | raw f0 series; offline centers; onset/settled re-analysis | per-frame values as perceived pitch (FW3) or as skill |
| `f0`, `conf`, `rms`, `voicing`, `rr` | number/enum | `PitchSample` and `raw` | no | detector behaviour; vibrato extent (×0.71 caveat); voicing coverage | any learner-facing quantity |
| `shimmerMidi`, `harmMidi`, `pc`, `chord`, `thin` | number/string | fast tier | no | what the learner heard (for causality analysis); latency | outcomes of any kind — the fast tier never writes state |
| `state` | enum | fast machine | no | timing of responses | — |

### 9.3 Runs and settled spans (slow tier)

| Field | Type | Source | When | LF | Allowed | Forbidden |
|---|---|---|---|---|---|---|
| `runId`, `onsetMs`, `runEndMs`, `closeReason` | ids/ms/enum | slow machine | `run_open/close` | no | onset boundaries (E-D groundwork: onset class is computed offline from the trace, not here) | onset error as skill (H005, FW14) |
| `spanId`, `settledStartMs`, `settledEndMs` | ids/ms | slow machine | `settled_span_open/close` | line only | settled region boundaries | — |
| `centerMedianMidi` | number | `ShortWindowPitchEvidence.centerFractionalMidi` (duration-weighted median, existing) | close | no (height only) | descriptive center v1 (`centerDefinitionVersion`) | "the pitch you sang" (H010); perceptual claims |
| `centerMeanMidi` | number | uniform mean over the span's voiced samples (new, computed in `settledSpanDetector`) | close | no | descriptive center v2; comparison with median | same |
| `centerRecencyMidi`, `centerLast200Midi` | number \| null | computed offline from the trace (not in-app in v1) | — | no | E-G comparisons | same |
| `centerDefinitionVersion` | string | constant `'median-v1'` | close | no | versioning | — |
| `spreadCents` | number | evidence | close | **never** | internal stationarity gate; research | any learner-facing "stability" (Product Firewall) |
| `voicedDurationMs`, `voicedCoverage`, `sufficiency` | number/enum | evidence | close | no | validity of the span | — |
| `octaveSuspect` | bool | slow machine | close | no | ambiguity flag | — |
| `holdMs`, `bassStarted`, `bassResolved` | number/bool | slow machine + pad commands | close | ring/line only | HOLD event description (H013 is *not* assumed) | "drift control skill" (FW15) |
| `contextSounding`, `referenceSounding` | bool | pad/drone state at span start | open | no | reference condition of the span (E-E-relevant) | — |

### 9.4 Home and returns

| Field | Type | Source | When | LF | Allowed | Forbidden |
|---|---|---|---|---|---|---|
| `homeMidi` | int | proposal/confirmation | `home_proposed/set` | ring | the anchor item | "absolute pitch" |
| `proposalMethod` | enum `'dwell' \| 'learner'` | controller | proposed | no | how Home was chosen | — |
| `homeSetHow` | enum `'without_reference' \| 'with_reference'` | controller | set | no | condition | — |
| `reference_on/off` | events `{midi, gain, outputDevice}` | drone hook | each | tone | exposure timing | — |
| `delaySinceExposureMs` | number | `t − lastReferenceOffMs` | attempt | no | delay variable (C014-type curve, day-scale) | L1 attribution as cause (identifiability rule) |
| `mode` | `'warm' \| 'bare'` | controller | invited/attempt | quiet vs silent | condition (tonal context present/absent) | — |
| `offsetCents` | number | `100·(centerMedianMidi − homeMidi)` | attempt | **never** (ring height only) | bias per attempt; precision across ≥4 attempts on later days | any learner-facing number; skill; "ear" or "map" (H001) |
| `category` | `'in_band' \| 'above' \| 'below'` with `|offset|` thresholds 25 c (band) | attempt | ring | descriptive category | verdict wording |
| `found` / `abandoned` | bool | FIND | reveal | ring lit | whether the reference-available find completed | "failed" |
| `homeLitHow` | `'cold' \| 'warm' \| 'found'` | controller | lit | ring | condition under which the ring lit | mastery |
| `attemptIndexInSession`, `attemptsOnItem` | int | controller | attempt | no | precision where ≥4 attempts exist (C011: descriptive) | — |

### 9.5 Segments and session end

| Field | Type | Source | When | LF | Allowed | Forbidden |
|---|---|---|---|---|---|---|
| `roam{startMs, endMs, voicedMs, spanCount, minMidi, maxMidi}` | object | controller | on segment end | no | range metadata (descriptive); exploration behaviour | any skill |
| `session_end{durationMs, spans, returns, holds, cadences}` | object | controller | end | no | descriptive summary | — |
| `annotation{text, raterId}` | object | research view | any | no | teacher notes (C031: log rater) | — |

Retention of raw data: never downsample the trace; never overwrite a center definition; add new versions as new fields.

## 10. EXISTING-SYSTEM INTEGRATION MAP

| Component | Path | Classification | Notes |
|---|---|---|---|
| YIN detector | `src/audio/pitchDetector.ts` | DO NOT TOUCH | all fast/slow behaviour is downstream |
| Analysis loop, cadence, constraints | `src/audio/pitchAnalysis.ts`, `frameCadence.ts`, `microphone.ts` | DO NOT TOUCH | 30 Hz analysis, 15 Hz publish; EC/NS/AGC off |
| Microphone hook + PitchSource producer | `src/hooks/useMicrophone.ts` | REUSE | the pad subscribes to the returned `pitchSource` (30 Hz); no changes |
| PitchSource | `src/pitch/pitchSource.ts` | REUSE | `subscribe`, `getLatest`, `getRecent`; freshness rules respected |
| Short-window evidence | `src/pitch/shortWindowPitchEvidence.ts` | REUSE (EXTEND optional) | `createShortWindowPitchEvidence(pitchSource)` polled at 15 Hz; optional additive extension: expose the window's voiced samples so the uniform mean can be computed without re-reading the source (or compute from `pitchSource.getRecent(500)` — preferred, no change) |
| Pitch continuity | `src/pitch/pitchContinuity.ts`, `usePitchContinuity.ts` | REUSE | grace 160 ms used as the fast tier's release gate; no change |
| Visual smoothing | `src/tuner/visualResponse.ts` (`smoothVisualCents`, `VISUAL_RESPONSE`) | REUSE | shimmer smoother; the harmony smoother is a new instance with its own constant |
| Label hysteresis | `src/tuner/labelHysteresis.ts` | DO NOT TOUCH | not used by the pad (2 c is for labels) |
| Calibration bands | `src/calibration/pitchCalibration.ts` | REUSE (`closeCents`, `visualLimitCents`) | `inTuneCents`/`deadCenterCents` are never referenced by play mode |
| Reference drone engine + hook | `src/audio/referenceDroneEngine.ts`, `hooks/useReferenceDrone.ts` | WRAP | the Home tone; `ReferenceController` wraps `useReferenceDrone` (`play`, `stop`, `setVolume`, snapshot) and emits `reference_on/off`; engine internals untouched |
| Audio context selection | `src/audio/referenceDroneContext.ts` | REUSE | `selectAudioContextConstructor` for the pad engine's own context (a separate context is acceptable for v1; sharing is a nice-to-have) |
| Drone timbre | `src/audio/referenceDroneTimbre.ts` | REUSE | Home tone timbre; the pad has its own |
| Reference keyboard | `src/reference/*`, `hooks/useReferenceKeyboard.ts`, `components/ReferenceKeyboard.tsx` | HIDE (in play mode) | not shown; `HUMAN DECISION REQUIRED` if a "learner-chosen Home" variant is enabled (then the keyboard is a candidate UI) |
| Centered tension tuner / cents meter / readout | `components/TunerReadout.tsx`, `CentsMeter.tsx`, `tuner/*` | HIDE (in play mode); mount in research view only | learner view has no cents |
| Pitch history graph | `components/PitchGridCanvas.tsx`, `history/*`, `visualization/*` | HIDE (in play mode) | the trail is fast-tier only; history graph available in research view |
| Practice Mode | `hooks/useTargetPracticeSession.ts`, `practice/*`, `components/TargetPracticeSession.tsx` | HIDE; DEPRECATE LATER as learner-facing | `PRACTICE_BAND_CENTS` (=10) must never become a play-mode criterion |
| Time-weighted practice statistics | `practice/practicePitchStatistics.ts` | DO NOT TOUCH | not used by play mode |
| Runtime features | `src/config/runtimeFeatures.ts` | EXTEND | add `enablePlayMode` (`?play`, default `HUMAN DECISION REQUIRED`: play mode as default landing for the test build) and `showPadDebug` (`?padDebug`) |
| App shell | `src/app/App.tsx` | EXTEND (additive) | mount `PlayModeApp` when `enablePlayMode`; otherwise the existing tree unchanged |
| Diagnostics probes / audio session timeline | `pitch/cadenceProbe.ts`, `audio/audioSessionDiagnostics.ts` | REUSE (research view) | latency estimates |
| Test fixtures | `src/test/pitchTrajectories.ts`, `stubPitchSource.ts`, `referenceDroneAudioMock.ts` | REUSE / EXTEND | synthetic trajectories for the fast tier and settled detector tests; add vibrato/scoop/octave-flip generators if missing |
| CI | `.github/workflows/ci.yml` | DO NOT TOUCH | new modules covered by existing vitest run |

Play mode is additive: a new subtree behind a flag; the existing tuner remains the default until `HUMAN DECISION REQUIRED` (default landing) is taken.

## 11. MODULE BOUNDARIES

Derived from the existing layering (audio → pitch → hooks → components; pure logic in `src/<domain>/`, React in `src/hooks` and `src/components`). All new modules are additive.

| Module | Path | Responsibility | Inputs | Outputs | State owned | State not owned | Dependencies | Test surface |
|---|---|---|---|---|---|---|---|---|
| **FastPitchInterpreter** | `src/pad/fastPitchInterpreter.ts` (pure) | per-sample smoothing (shimmer, harmony), octave-flip suppression, voicing state (F_*), pitch-class quantisation with hysteresis/dwell | `PitchSample`, `nowMs` | `FastPitchState{fState, shimmerMidi, harmonyMidi, pitchClass, airyLevel, changed}` | smoother values, last octave, dwell timer, fState | chords, spans, Home | `visualResponse.smoothVisualCents`, `pitchContinuityConfig` | unit: synthetic sample streams (`pitchTrajectories`) → assert no pc flips under ±50 c vibrato, ≤1/s under ±100 c, octave flip suppressed, airy on uncertain |
| **HarmonyModel** | `src/pad/harmonyModel.ts` (pure) | key, chord selection (stickiness, voice-leading), voicing, thin/bloom level, bass progression tables | `FastPitchState`, key, current chord, bass phase | `HarmonyState{chord, voicing[], thinLevel, colourTone?, bassMidi?}` | current chord/voicing, bass progression index | audio nodes, pitch smoothing | none | unit: pc sequences → expected chords; thin level vs distance; bass tables contain the held pc |
| **PadEngine** | `src/pad/padEngine.ts` (Web Audio) | renders shimmer/pad/bass/room tone; gesture activation; mute/unmute | `HarmonyState`, shimmer midi/airy level, commands | audio; `PadEngineSnapshot{status, latencyEstimateMs}` | AudioContext, nodes, envelopes | anything musical | `referenceDroneContext.selectAudioContextConstructor` | integration (mock AudioContext as in `referenceDroneAudioMock`): node graph built, gains within limits, mute silences pad but not shimmer |
| **SettledSpanDetector** | `src/pad/settledSpanDetector.ts` (pure) | runs and settled spans from evidence snapshots; centers (median from evidence, mean from samples); hold timing; close reasons; octave suspect | `ShortWindowPitchEvidence` snapshot, `pitchSource.getRecent(500)`, `nowMs`, flags (`contextSounding`, `referenceSounding`) | events `run_open/close`, `settled_span_open/close`, `hold_start/end` | open run/span | Home, chords | `shortWindowPitchEvidence` types | unit: evidence sequences → spans open/close per criteria; sufficiency flicker tolerated; `|Δ|>25 c` closes; glide never settles |
| **HomeSessionController** | `src/home/homeSession.ts` (pure state machine) | phases DISCOVER → PROPOSED → SET → AWAY → INVITED(warm/bare) → ATTEMPT → REVEAL → FIND → LIT; timers; proposal from spans; attempt classification | span events, time, reference events, session index, persisted Home | commands (`playReference`, `stopReference`, `mute`, `unmute`, `pulseHome`, `bloom`, `reharmonise`) and log events | phase, timers, homeMidi candidate, pending attempt | audio, drawing | `pitchCalibration.closeCents` | unit: scripted span/time sequences → phases and commands; exactly one bare per session; no attempt while reference sounding; next-session bare-first |
| **HomeStorage** | `src/home/homeStorage.ts` | persist `{homeMidi, createdAt, lastReferenceOffMs, sessionCount}` | controller events | persisted record | localStorage key | — | — | unit: round-trip, reset |
| **ReferenceController** | `src/home/referenceController.ts` + use in hook | wraps the drone hook: play Home tone for N ms at a gain by output device; emits `reference_on/off` | commands, `outputDevice` | drone calls, events | tone timer | drone engine internals | `useReferenceDrone` | integration with drone mock: on/off events, gain by device |
| **PrototypeLogger** | `src/logging/prototypeLogger.ts` | event schema (§9), ring buffer, IndexedDB persistence, JSONL export, trace rows | events from all modules | files | buffer, seq | — | none | unit: schema validation; export round-trip |
| **usePad / useHomeSession** | `src/hooks/usePad.ts`, `useHomeSession.ts` | React wiring: subscribe to `pitchSource` (30 Hz) → interpreter → harmony → engine; poll evidence at 15 Hz → detector → controller → commands | `pitchSource`, mic state, drone hook | state for components | React state only | domain logic | above | render tests with `stubPitchSource` |
| **PadStage / PadDebugPanel / PlayModeApp** | `src/components/PadStage.tsx`, `PadDebugPanel.tsx`, `src/app/PlayModeApp.tsx` | learner view; research view; mode mounting | hook state | canvas/DOM | none | logic | hooks | render tests: no forbidden words in learner DOM; debug panel absent without flag |

Fast/slow separation is enforced structurally: `FastPitchInterpreter` and `HarmonyModel` have no import path to `PrototypeLogger` event writers other than trace rows, and `SettledSpanDetector` never imports from `src/pad/fastPitchInterpreter.ts`.

## 12. ACCEPTANCE CRITERIA

Each is observable and verifiable by test or by a scripted manual check. IDs for Codex.

- **AC-1 Causality latency.** With a synthetic stream through `stubPitchSource` and the engine's scheduling instrumented, the time from a voiced sample's `timestampMs` to the shimmer gain automation start is ≤120 ms in the JS layer (excluding device output latency); to a chord change ≤400 ms. Logged per event.
- **AC-2 Vibrato stability.** A ±50 c, 5.5 Hz synthetic vibrato around a chord tone for 30 s produces zero chord changes and a thin level whose standard deviation over any 1 s is <0.1 of full scale. ±100 c vibrato produces ≤1 chord change per second.
- **AC-3 Octave glitch.** A synthetic stream that flips down one octave for 3 frames and returns produces no chord change and no shimmer jump >200 c within the suppression window.
- **AC-4 Fast tier never writes.** Static analysis/test: `FastPitchInterpreter` and `HarmonyModel` emit no `settled_span_*`, `return_*`, `home_*` events; the only logger call reachable from them is `trace`.
- **AC-5 Settled outcomes come from settled evidence.** Every `return_attempt` references a `spanId` whose `sufficiency === 'sufficient'` and whose `spreadCents ≤ PAD_SETTLE_SPREAD_CENTS`; a glide (monotone 400 c over 1 s) produces no span and no attempt.
- **AC-6 Reference cannot create a return.** With the Home tone playing (drone mock reports `playing`) any span is flagged `referenceSounding: true` and never classified as a `return_attempt`; the leakage self-test with speakers and no voice produces `leakageDetected` rather than a `voiced` span at the Home pitch class being accepted as a return.
- **AC-7 One bare return per session.** Scripted 12-minute session → exactly one `return_invited{mode:'bare'}`; a persisted Home → the first invitation of the next session is bare and precedes any `reference_on`.
- **AC-8 Always ends lit.** Every `return_reveal{category ≠ 'in_band'}` is followed, within the same session, by a FIND phase with `reference_on`, and either `home_lit{how:'found'}` or `return_reveal{abandoned:true}`; no state named fail exists in the code.
- **AC-9 No silence on sound.** Any sample with `raw.rms ≥ minimumRms` and `voicing ≠ voiced` sets `airyLevel > 0` within one frame.
- **AC-10 Forbidden words.** Render test of `PadStage` in all phases: the DOM text contains none of `in tune|correct|wrong|good|bad|learned|mastered|test|score|accuracy|cents|pass|fail`.
- **AC-11 No cents in the learner view.** `PadStage` receives no `offsetCents`/`spreadCents` props; the landing ring is positioned from `centerMidi` only.
- **AC-12 Bands.** No import of `PITCH_CALIBRATION.inTuneCents`, `deadCenterCents`, or `PRACTICE_BAND_CENTS` exists under `src/pad`, `src/home`, `src/components/PadStage.tsx`.
- **AC-13 Trace completeness.** Over a 60 s run, the number of trace rows is within 5% of the number of `PitchSource` publications; no downsampling.
- **AC-14 Room tone is not a drone.** In F_IDLE the pad's master gain ≤ `PAD_ROOM_TONE_GAIN`; in F_MUTED it is 0; unmute restores over ≤200 ms.
- **AC-15 HOLD trigger.** A stable synthetic note produces `hold_start` at `settledStartMs + 2000 ± 100 ms`; leaving the band by >25 c for >300 ms produces `hold_end{resolved:false}` and the bass returns to I within one step.
- **AC-16 Existing tuner unaffected.** With `enablePlayMode` off, the existing test suite passes unchanged and `App` renders the existing tree.
- **AC-17 Export.** The JSONL export of a session validates against the schema in §9 (a schema validator is part of the logger tests).

## 13. FAILURE-INJECTION MATRIX

All cases are synthetic `PitchSample` streams (extend `src/test/pitchTrajectories.ts`) unless marked *device*.

| Case | Expected fast tier | Expected slow tier | Must NOT happen |
|---|---|---|---|
| ±50 c vibrato, 5.5 Hz, 30 s | shimmer follows vibrato; chord constant; thin level steady (mean thinning ~0–10%) | one span; center ≈ mean; spread ≈ 35 c (×0.71) → settled; hold triggers | chord flips; thin flutter; span closure by `Δcenter` |
| ±100 c vibrato | shimmer follows; ≤1 chord change/s; thin partially | span may fail the spread gate (≈70 c) → no hold; logged as run without span | rapid chord alternation at vibrato rate; a span with an unstable center |
| slow scoop (−200 c → 0 over 600 ms) | shimmer glides; ≤1 chord change; thin rises to full at the end | run opens at onset; span opens only after the settle; `onsetMs` ≠ `settledStartMs` | a span whose center includes the scoop; a chord change per 50 c |
| fast scoop (−150 c over 120 ms) | no chord change before the settled pitch (dwell) | as above | chord flip on the first frames (C054 reads them toward settled anyway) |
| octave flip (3 frames down) | pitch-class harmony unchanged; shimmer octave held | `octaveSuspect` if persistent; span closes only if the median jumps | harmonic lurch; bass octave jump (fixed register) |
| brief unvoiced gap (100–250 ms) | grace 160 ms covers ≤160; beyond → shimmer release then re-attack; chord sustained through `PAD_RELEASE_MS` | run continues if ≤160 ms; otherwise run closes and a new one opens (span logic per evidence) | chord drop to room tone within a normal phrase |
| breath noise (uncertain, rms above floor) | airy shimmer; chord holds | no run (not voiced) | a chord change from noise; silence |
| very quiet singer (rms just above 0.005) | shimmer at low brightness; harmony normal | spans normal if voiced | nothing (mic level shows) |
| very loud singer | no clipping (fixed gains); airy component not exaggerated | normal | pad gain following rms |
| unstable novice (random walk ±60 c around a mean, plus dropouts) | chord may change at most per dwell; thin fluctuates slowly | spans open/close; hold only if the spread gate passes | audiovisual chaos: >2 chord changes/s, wash strobing |
| rapid note change (4 notes/s) | shimmer follows; chord lags by dwell/hysteresis (may skip chords) | no spans (each note <300 ms) | a span |
| reference leakage (*device*: Home tone through speakers, no voice) | none expected; if the detector reports voiced at Home's pc: flagged | self-test: ≥3 consecutive voiced samples at Home pc → `leakageDetected: true`; FIND spans flagged | a `return_attempt` or `home_lit{cold}` |
| microphone latency (*device*: 20–80 ms extra) | shifts everything; logged latency estimate | timestamps consistent (all from the same clock) | inconsistent onset boundaries between trace and spans |
| 30 Hz detector update (cadence drops to 20–24 Hz under load) | smoothers are time-based (elapsedMs), so behaviour unchanged | sufficiency still met at ≥10 Hz (probe result) | frame-count-based logic anywhere |
| mobile/desktop timing (RAF throttling, background tab) | `freshness: 'stale'` samples ignored; pad releases | evidence `unobservedDurationMs` grows; spans close; nothing written | a return attempt measured across a stall (attempt requires `unobservedDurationMs` ≤ 100 ms within the span) |

## 14. THREE-DAY BUILD PLAN

Each day ends in something runnable in the browser behind `?play`. Existing tests stay green throughout (AC-16).

**DAY 1 — the instrument.** *Must-have:* `runtimeFeatures` flags; `PlayModeApp` mounted from `App` behind `enablePlayMode`; `FastPitchInterpreter` (both smoothers, hysteresis, dwell, octave suppression, F_* states) with unit tests on synthetic streams (AC-2, AC-3, AC-9); `HarmonyModel` (key from first settled pc or a fixed default until Home exists, diatonic chord selection, voicing, thin/bloom, colour tone) with unit tests; `PadEngine` (context via `selectAudioContextConstructor`, gesture activation, shimmer/airy/pad voices, room tone, release, mute) with a mock-context test; `PadStage` with field, dot, trail, wash, mic level, start/stop, headphones question; `PrototypeLogger` with session header and trace rows. *Runnable:* sing → shimmer and chord follow; stop → release to room tone. *Nice-to-have:* latency instrumentation in the debug panel. *Deferred:* bass, spans, Home.

**DAY 2 — holding and the ledger.** *Must-have:* `SettledSpanDetector` on `createShortWindowPitchEvidence(pitchSource)` polled at 15 Hz (`pitchAnalysisConfig.publishIntervalMs`), with runs, spans, centers (median + mean), spread gate, close reasons, `octaveSuspect`, tests (AC-5, AC-15, flicker tolerance); HOLD: `hold_start` → bass progression tables → `PadEngine.setBass`, reharmonisation around the held pc, cadence vs "goes where you are"; settled line and bass pulse in `PadStage`; logger: run/span/hold events, IndexedDB persistence, JSONL export; `PadDebugPanel` behind `?padDebug` showing both tiers and the last events. *Runnable:* hold → bass walks → cadence if you stay; export a session file. *Nice-to-have:* mounting `TunerReadout` in the debug panel for comparison. *Deferred:* Home.

**DAY 3 — Home.** *Must-have:* `HomeStorage`; `ReferenceController` wrapping `useReferenceDrone` (Home tone on/off with gain by output device, events); `HomeSessionController` with all phases, timers, proposal-by-dwell, confirmation, away, warm and bare invitations (mute/unmute), attempt classification, reveal commands (reharmonise around Home + landing, bloom), FIND, LIT, next-session bare-first; Home ring, landing ring, pulse and quiet state in `PadStage`; leakage self-test on speakers; acceptance tests AC-6, AC-7, AC-8, AC-10, AC-11, AC-12, AC-14, AC-17; "done" and the final cadence. *Runnable:* the canonical session end to end; a second launch opens with the bare return. *Nice-to-have:* "new Home" control; note-name toggle inside the debug panel. *Explicitly deferred:* everything in §18.

If Day 3 overruns, the bare return may ship before the warm return (the bare one is the scientific priority); the warm return is then the first nice-to-have.

## 15. THREE-LEARNER TEST PROTOCOL

Three learners, ideally one each from the "I can't sing", amateur, and trained/interval-literate archetypes; children excluded from this first test. Headphones for all three (`HUMAN DECISION REQUIRED` if a speakers case is wanted as the third). Same room, same laptop, debug panel closed, screen recording plus audio recording of the room (with consent), the JSONL export saved per learner. Two sessions per learner on consecutive days (the second is short: the bare return plus five minutes of play).

**Protocol (session 1, 8–10 minutes)**
1. Nikolai says only: "Put the headphones on. When you're ready, press start and make a sound — any sound." Nothing else.
2. Silence from Nikolai for the first three minutes. Observation only.
3. When Home has been set (ring lit) and the learner is roaming, Nikolai may say once: "Keep going as you like." No mention of Home, returning, memory, pitch, accuracy, or that anything is being measured.
4. After the warm return and reveal have happened (whatever the outcome), Nikolai stays silent.
5. After the bare return and its reveal, Nikolai says: "You can stop whenever you want." The session ends when the learner presses done or stops.

**What Nikolai must NOT explain:** what the ring is; that the world going quiet is an invitation; what the tone is; that they should hold notes; what the chord changes mean; that there is a fast and a slow response; that anything is recorded beyond "we save the sound"; any evaluative reaction (no "nice", "good", "almost") during the session.

**Observations (checklist, timestamped by the observer)**
- First sound → first visible/audible reaction of the learner (smile, surprise, repeat, silence); latency between their first note and their second.
- Whether they explore (slides, range, a song) without prompting; how long before they stop making sounds for >10 s.
- What they do when the bass starts: stop, hold longer, sing over it, ignore.
- At the Home ring: whether they look at it, sing toward it, ignore it; whether the lit ring produces a reaction.
- At the warm invitation: whether they notice the quiet; what they do (sing at once, wait, ask).
- At the bare invitation: same; whether the total silence reads as a prompt or as breakage.
- During the reveal and FIND: whether they slide to the tone; expressions at a landing above/below; whether "always ends lit" reads as resolution or as being corrected.
- Breath/uncertain moments: whether the airy shimmer reads as acknowledgement or as a warning.
- Any moment they ask "is it working?" or tap the mic (silence-as-broken signal).
- Whether their singing changes toward straight, loud, closed tones over the session (E4 warning sign).

**Questions after the session** (open, in this order; do not suggest answers)
1. "Tell me what happened, from the beginning." (Let them narrate; note what they mention first.)
2. "What did the sound do when you sang?" (Causality, in their words.)
3. "Was there a moment you didn't know what was happening?" (Silence, quiet, the ring.)
4. "What was the ring?" (Do not correct their answer.)
5. "There was a moment when everything went quiet. What did you do, and why?" (Invitation reading; warm vs bare if they distinguish.)
6. "Did anything feel like being tested?" (Only after 1–5.)
7. "Did anything sound bad?" (Pleasantness under inaccuracy.)
8. "Would you do this again tomorrow? What for?" (Return intent, without promising.)
9. For the trained learner only, last: "Was there anything you wanted to see and couldn't?"

**Events to inspect afterward (from the JSONL)**
- Latency per shimmer/chord event vs the moments the learner reacted (from the recording).
- Chord-change rate per minute; thin-level variance during vibrato passages (chaos check).
- Number of spans, holds, cadences; hold durations.
- `home_proposed` → `home_set` delay and `how`; whether the proposal was where they actually sang most.
- `return_attempt` for warm and bare: offset (cents, research view only), category, delay since exposure, whether FIND was needed, time to lit.
- `roam` segments: range extents; whether roaming after Home was set narrowed (E1) or widened.
- Airy-shimmer episodes: count and duration; whether they preceded stopping.
- Trace-derived: vibrato extent early vs late in the session (E4 signal); any octave-suspect spans.
- Day 2: the bare-first return outcome and the learner's behaviour on launch.

No statistical claims. Three learners answer feel questions; the ledger checks that the machine did what the spec says.

## 16. POST-TEST DECISION RULES

Rules are stated as observable outcomes; "attribute" means the learner's own narration in Q1–Q2 names their voice as the cause.

| Topic | KEEP if | MODIFY if | ABANDON if |
|---|---|---|---|
| Fast vs settled response | ≥2 of 3 attribute the chord to their voice and none says "slow"/"late" | attribution present but "slow" mentioned, or chord-change latency in the log >450 ms — reduce `PAD_HARMONY_SMOOTHING_MS` and chord attack first, hysteresis second; retest | no learner attributes the response to their voice with the per-frame tier → the pad concept fails on this stack; the first playable becomes P2 (warmer/colder hunt), which does not need causality |
| Shimmer | no "is it working?" moments; airy shimmer not described as a warning | airy described as "it didn't like that" → change the airy timbre/level, not the rule | learners find the shimmer itself unpleasant or distracting after adjustment → replace with a visual-only acknowledgement (dot only), keep the no-silence rule |
| Thin/bloom | learners hold longer when it thins, or mention thickness/thinness unprompted | unnoticed → increase the contrast (`PAD_THIN_FLOOR` lower) once; if still unnoticed, keep as texture without expecting information from it | described as "it kept cutting out" (read as dropout) → remove thin/bloom; carry in/out information only through the reveal |
| HOLD / bass | learners hold spontaneously at least twice and react to cadences | bass reads as "the app took over" → start the bass later (3–4 s) and quieter | learners stop singing when the bass starts, twice or more per session → remove the bass from v1; HOLD becomes a visual line only |
| Home | Q4 answers name a place/target/"mine"/"where I was"; the lit ring gets a reaction | Home is noticed but the proposal was not where they sang most, or confirmation took >60 s → switch the default to learner-chosen Home (`HUMAN DECISION`) | Home is not noticed or is described as a test target in Q4/Q6 by ≥2 of 3 → remove the ring from the first session; Home becomes a next-session-only feature or is dropped from the first playable |
| Bare probe | the silence is read as an invitation (they sing) and Q6 does not mention testing | the silence is read as breakage → add the single pulse's audible counterpart (a soft breath-like swell) and retest; or place the bare return only in session 2 | ≥2 of 3 describe the quiet moment as a test, after the modification → drop the in-session bare return; keep only the next-session bare-first (once per day, on launch) |
| Reveal / FIND | "always ends lit" is narrated as arriving/finding, not as being corrected | narrated as correction → shorten the Home tone, let the learner start the FIND themselves (tone plays only if they sing again) | narrated as failure by ≥2 of 3 → replace the reveal with the landing chord only (no Home tone, no ring lighting); return outcomes stay ledger-only |
| Relation chord (as embedded in the pad's mapping) | chord-quality changes are mentioned or visibly reacted to by the trained learner | unnoticed by all → no change (it costs nothing) | the mapping produces chords the trained learner calls wrong/ugly repeatedly → simplify to I/IV/V only |
| Song door (free roam over the pad) | at least one learner sings a song unprompted and the pad "makes sense" under it | song attempted and the pad's stickiness fights the melody → shorten `PAD_CHORD_DWELL_MS` during fast movement (tempo-aware dwell) | the pad is described as ruining the song → the pad releases to room tone during rapid movement (>3 pc changes/s) and returns on holds |
| Speakers (if tested) | leakage self-test negative on the device and FIND behaviour normal | leakage detected → speakers mode = FIND without tone (visual Home only) | — |

Global rule: if the fast-vs-settled row lands in ABANDON, none of the other rows is evaluated; the architecture's first assumption has failed and the next spec starts from P2/P3.

## 17. CODEX HANDOFF

**OBJECTIVE.** Add a "play mode" to Vocal Tuner behind a runtime flag: a voice-following harmonic pad with an always-on shimmer (fast tier, sound only), settled-evidence spans that trigger a walking bass on holds and log everything (slow tier), and a Home mechanic (proposed from dwell, confirmed with the existing reference drone, one warm and one bare return per session, reveal and find, persisted across sessions). Ship the three-day plan in §14 in order; each day must run in the browser.

**NON-GOALS.** No scoring, XP, levels, streaks, badges, maps, creatures, words, items beyond Home, note names in the learner view, cents in the learner view, adaptive difficulty, band changes, onboarding text, settings screens, social features, song mode, mobile-specific layout work, redesign of the existing tuner, changes to the detector or analysis loop, changes to Practice Mode.

**SCIENTIFIC FIREWALL (binding).** Never show or store as a learner-facing value: instantaneous cents, within-note spread ("stability"), onset/attack quality, vibrato quality, time inside ±5/±10 c, any composite score. Never use `PITCH_CALIBRATION.inTuneCents` (10) or `PRACTICE_BAND_CENTS` as a criterion in play mode; the band is `closeCents` (25). Never write the words in tune / correct / wrong / good / bad / learned / mastered / test / score / accuracy / pass / fail into learner-facing UI. Never let the fast tier write state. Never measure a return attempt while any reference or room tone is sounding. Store centers under a named definition version; never label any of them "the pitch you sang".

**CURRENT ARCHITECTURE (what exists).** `useMicrophone` → `startPitchAnalysis` (YIN, 4096-sample window, 30 Hz analysis, 15 Hz publish) → `PitchSource` (30 Hz publications, `subscribe/getLatest/getRecent`, freshness 250 ms) → consumers; `createShortWindowPitchEvidence(pitchSource)` (500 ms window, duration-weighted median center, spread, sufficiency ≥6 samples/≥300 ms, `projectEvidenceToTarget`); `usePitchContinuity` (160 ms grace); `smoothVisualCents`/`VISUAL_RESPONSE` (25/65 ms); `PITCH_CALIBRATION` (5/10/25/50); `useReferenceDrone` → `createReferenceDroneEngine` (single-voice periodic-wave oscillator, own AudioContext via `selectAudioContextConstructor`, gesture activation, `play/stop/setVolume/subscribe`); `useReferenceKeyboard`; `PitchGridCanvas` (history graph with keyboard, drone, practice); `TunerReadout`/`CentsMeter`; `createRuntimeFeaturePolicy` (query flags); vitest with `stubPitchSource`, `pitchTrajectories`, `referenceDroneAudioMock`.

**FILES/SYSTEMS TO INSPECT FIRST.** `src/pitch/pitchSource.ts`, `src/pitch/shortWindowPitchEvidence.ts` (+ test), `src/hooks/useMicrophone.ts`, `src/audio/pitchAnalysis.ts`, `src/tuner/visualResponse.ts`, `src/calibration/pitchCalibration.ts`, `src/audio/referenceDroneEngine.ts` (public API only), `src/hooks/useReferenceDrone.ts`, `src/audio/referenceDroneContext.ts`, `src/config/runtimeFeatures.ts`, `src/app/App.tsx`, `src/test/stubPitchSource.ts`, `src/test/pitchTrajectories.ts`, `src/test/referenceDroneAudioMock.ts`, `docs/SHORT_WINDOW_PITCH_EVIDENCE.md`, `docs/PITCH_SOURCE.md`, `docs/DECISIONS.md`, `AGENTS.md`.

**IMPLEMENTATION ORDER.** Day 1: flags → `PlayModeApp` → `FastPitchInterpreter` (+tests) → `HarmonyModel` (+tests) → `PadEngine` (+mock test) → `PadStage` → `PrototypeLogger` (header + trace). Day 2: `SettledSpanDetector` (+tests) → HOLD/bass → logger events + persistence + export → `PadDebugPanel`. Day 3: `HomeStorage` → `ReferenceController` → `HomeSessionController` (+tests) → Home visuals → leakage self-test → acceptance tests → final cadence/done. Commit per module; every commit compiles and passes tests (repository rule).

**INVARIANTS.**
1. `src/pad/fastPitchInterpreter.ts` and `src/pad/harmonyModel.ts` import nothing from `src/pad/settledSpanDetector.ts`, `src/home/*`, and call no logger method except `trace`.
2. `SettledSpanDetector` consumes only `ShortWindowPitchEvidence` snapshots and `pitchSource.getRecent`; never fast-tier values.
3. Every `return_attempt` has `referenceSounding === false` and, for `mode:'bare'`, `contextSounding === false`.
4. Exactly one `return_invited{mode:'bare'}` per session; on a session with a persisted Home, it precedes any `reference_on`.
5. `PadStage` props contain no cents and no spread; no forbidden words in its DOM.
6. All smoothing and timing logic is elapsed-time based, never frame-count based.
7. Stale samples (`freshness !== 'fresh'`) never move a smoother; a `sessionGeneration` change resets everything.
8. `PadEngine` master gain ≤ a fixed maximum (mirror `REFERENCE_DRONE_SAFE_MAX_GAIN` semantics); room tone ≤ `PAD_ROOM_TONE_GAIN`; muted = 0.
9. Trace rows are never downsampled; center fields are additive and versioned.
10. The existing tree and tests are unchanged when the flag is off.

**ACCEPTANCE TESTS.** Implement AC-1 … AC-17 (§12) as vitest tests or scripted checks; the failure-injection matrix (§13) as synthetic-stream tests where marked, with device cases documented as manual checks in the debug panel.

**DO NOT DO.** Do not modify `pitchDetector.ts`, `pitchAnalysis.ts`, `frameCadence.ts`, `microphone.ts`, `referenceDroneEngine.ts` internals, `practice/*`, `labelHysteresis.ts`. Do not add a needle, a cents readout, note names, or a history graph to `PadStage`. Do not add a second bare return, a countdown, a timer display, or any text that evaluates. Do not tune constants by theory: leave every `TUNE BY PROTOTYPE` constant in one file (`src/pad/padConstants.ts`, `src/home/homeConstants.ts`) with its tag in a comment. Do not resolve any `HUMAN DECISION REQUIRED` item; implement the stated default and flag it in the PR description.

**QUESTIONS THAT REQUIRE HUMAN DECISION** (defaults given so work can proceed):
1. Home: system-proposed from dwell (default) vs learner-chosen by a control.
2. Key mode: major (default) vs minor/mode switch.
3. Bass progression tables per held degree (defaults in §3) — musical content to be confirmed.
4. Pad and shimmer timbres (defaults in §3).
5. Play mode as the default landing for the test build (default: flag `?play` only).
6. Speakers allowed in the human test (default: allowed, flagged; recommended headphones).
7. Learner-view language and the single word "Home" (English default; Russian likely for Batumi students).
8. "New Home" control present in v1 (default: yes, hidden in the debug panel).
9. Lowering `minimumRms` for very quiet singers (default: unchanged).
10. Note-name toggle location (default: research view only).

## 18. EXPLICITLY DEFERRED SYSTEMS

Not in this build, not to be started until the post-test decision rules (§16) have been applied: rooms and resonators; items beyond Home and any item-state lattice (onsight/flash/redpoint remain ledger *labels* for Home attempts only: a bare return is `onsight`-like, a warm return `flash`-like — labels may be added to the log, nothing else); the partner/creature and words; the map and any persistent world object other than the Home ring; ghosts and any own-voice playback; explicit JUDGE (buttons, two-versions); fading arms and grain arms as experiments (conditions are logged, not assigned); scheduler/queues of any kind; social features; song mode beyond free roam over the pad; Farnsworth gaps; relation-chord reveals beyond the pad's inherent mapping; teacher view beyond the debug panel; adaptive anything; mobile layout; sharing of contexts between the pad and the drone engines.

## 19. UNRESOLVED RESEARCH QUESTIONS (preserved, not answered by this build)

- Whether any immediate gain under concurrent feedback persists 24 h/7 d (H002, E-A) — this build produces a daily Home series, which is *descriptive* and single-item; it is not E-A.
- Whether fading assistance improves retention (H009) — no fading is implemented; warm vs bare are logged conditions, not arms.
- Cross-grain transfer (H003, E-B) — no items beyond Home exist.
- Locus of production limits (H001, E-C) — the Home series must not be read as "ear" or "map".
- Perceived pitch of real sung notes and the right center definition (H010, E-G) — centers are versioned; the trace allows recomputation; the median is a policy, not a percept.
- Onset-error meaning (H005, E-D) — onsets are logged as boundaries only.
- Reference-mode effects (H006/H012, E-E) — the Home tone during FIND is a reference-available action by design and is flagged; no claim.
- Band width (H007, E-F) — 25 c is policy; the thin/bloom zones are feel, not evidence.
- Whether hold-under-harmony is a controllable skill (H013) — HOLD is a musical event; `holdMs` is descriptive.
- Whether the harmonic responder's causality survives real devices and real voices (review F1) — this is the question the build exists to test, and §16 says what happens either way.

---

Confidence: the integration map and module boundaries follow the repository as read (H); the fast-tier constants are starting points (`TUNE BY PROTOTYPE`, L–M); the state machines and data contract are consistent with the canonical Product Firewall and the review's invariants (H); the walkthrough is the intended experience, not an observed one (M) — the three-learner test decides.
