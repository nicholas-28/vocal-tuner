# VOCAL_TUNER_BUILD_NOW.md

Compression of FIRST_PLAYABLE_SPEC_v1 under the constraints of ADVERSARIAL_DESIGN_REVIEW_v1 and the canonical evidence base. Nothing here is new; where this document and the spec differ, this document narrows.

## 1. THE IRREDUCIBLE LOOP

VOICE → the learner makes any sound; the system hears it on the 30 Hz `PitchSource` path and, within ≈200 ms, answers with a pitched shimmer at the sung pitch (airy if pitch is unclear; never silence on sound).
RESPONSE → the learner keeps singing; the system forms and holds a diatonic chord containing the sung pitch class (fast tier, pitch-class based, hysteresis + dwell) and thins it when the voice drifts >25 c from a chord tone.
EXPLORE → the learner slides, holds, sings a song; the system follows harmonically, and on a settled hold ≥2 s walks a bass under the held note, cadencing only if the voice is still there.
HOME → the learner keeps singing; the system proposes Home from where they dwelt most, and when they next settle inside ±25 c it plays the Home tone (existing drone) *after* the note ends and lights the ring.
RETURN → the learner leaves for ≥60 s; the world goes quiet; the learner sings Home from memory; the system measures the first settled note (nothing sounding), then brings the Home tone in so the relation is heard, lets them find it, and lights the ring — always.

## 2. BUILD NOW

1. **FastPitchInterpreter** (`src/pad/`) — purpose: causality. Reuses `PitchSource` (30 Hz), `smoothVisualCents`/`VISUAL_RESPONSE`, continuity grace 160 ms. Minimal: shimmer smoother (25/65 ms), harmony smoother (~180 ms, TUNE), pitch-class quantiser with ~20 c hysteresis + 250 ms dwell, octave-flip suppression, F_IDLE/HEARD/VOICED/RELEASING/MUTED. Accept: ±50 c vibrato → zero chord changes; 3-frame octave glitch → no chord change, no shimmer jump; never emits state events.
2. **HarmonyModel** (`src/pad/`) — purpose: the chord that contains what was sung. Reuses nothing (pure). Minimal: major key on Home (or first settled pc), diatonic triads I–vi, keep-if-contains, else smallest voice-leading move, chromatic → colour tone; thin level from distance to nearest chord tone (full ≤25 c, thinning 25–50 c, 250 ms envelope). Accept: pc sequences map to expected chords; thin level is a monotone function of distance.
3. **PadEngine** (`src/pad/`, Web Audio) — purpose: render shimmer/airy/pad/bass/room tone. Reuses `selectAudioContextConstructor`, gesture-activation pattern of the drone engine. Minimal: three pad voices + shimmer + noise swell + one bass voice, 90 ms chord attack, 120 ms crossfade, 1.5 s release to room tone (≤0.06), mute/unmute. Accept: mock-context test builds the graph; muted = 0 gain on pad, shimmer still active; fixed gains never clip.
4. **SettledSpanDetector** (`src/pad/`) — purpose: the only writer. Reuses `createShortWindowPitchEvidence(pitchSource)` polled at 15 Hz, `pitchSource.getRecent(500)`. Minimal: runs (onset), spans (sufficiency + spread gate ≤60 c internal + stable center over 2 polls), close on |Δcenter| >25 c or run end, median + uniform-mean centers, `octaveSuspect`, `holdMs`. Accept: a 400 c/s glide never produces a span; stable note → `hold_start` at settled+2000 ms.
5. **HomeSessionController + HomeStorage + ReferenceController** (`src/home/`) — purpose: one remembered place, asked once with context and once without. Reuses `useReferenceDrone` (Home tone), `PITCH_CALIBRATION.closeCents`, localStorage. Minimal: propose-by-dwell → confirm on first in-band span → away ≥60 s → warm invitation (room tone faint) → bare invitation (pad muted, once per session; first thing on a later launch) → attempt = first settled span with nothing sounding → reveal (landing chord, Home tone after the span closes, reharmonise, bloom if in band) → FIND with tone → lit. Accept: no `return_attempt` while `referenceSounding`; exactly one bare per session; every non-in-band reveal is followed by FIND; no state named fail.
6. **PadStage** (`src/components/`) — purpose: see that you are heard and where Home is. Reuses `inputLevel` from `useMicrophone`. Minimal: vertical field, voice dot (fast), ≤2 s trail, chord wash, settled line, Home ring (soft/lit/pulse), landing ring, headphones/speakers question, start/stop/done. Accept: DOM contains none of in tune/correct/wrong/good/bad/learned/mastered/test/score/accuracy/cents/pass/fail; no cents or spread props.
7. **PrototypeLogger** (`src/logging/`) — purpose: keep raw data so scoring can change later. Reuses `buildInfo`, `PitchDetectorSettings`. Minimal: session header (incl. `outputDevice`, `leakageDetected`, all constants), full 30 Hz trace rows, run/span/hold/home/return events per spec §9, IndexedDB + JSONL export. Accept: trace row count within 5% of `PitchSource` publications; export validates against the schema.

Wiring: `runtimeFeatures` gets `?play` and `?padDebug`; `App.tsx` mounts `PlayModeApp` additively; existing tree and tests unchanged with the flag off.

## 3. DO NOT BUILD YET

1. Any cents readout, needle, or note name in the learner view (research panel only).
2. Any band narrower than 25 c, `inTuneCents`, `PRACTICE_BAND_CENTS`, "time in band" — scoring by precision.
3. "Stability"/spread, onset/attack, vibrato quality as anything a learner sees — no perceptual counterpart, demoted markers.
4. Mastery, "learned", "remembered", lit-ring streaks, session counts shown to the learner — fake mastery.
5. Rooms, resonators, items beyond Home, item states, due queues — the flashcard spine, premature.
6. The partner/creature, words, mirror-back of the learner's own voice — dispenser risk; needs Wizard-of-Oz first.
7. Map, fog, gates, XP, levels, badges, streaks, leaderboards — gamification layers with no capability behind them.
8. Fading arms, grain arms, "invisible research engine" claims — at studio N these are logging, not experiments.
9. Diagnostics or explanations in the learner flow (what the ring is, what the quiet means, latency numbers) — the interaction must be understood without reading.
10. Adaptive difficulty, band tightening, or tempo/timing scoring driven by per-frame values.

## 4. THE ONE MOMENT THAT MUST FEEL MAGICAL

INPUT: a person sustains a note, then slides up roughly a third and stays.
→ SYSTEM RESPONSE: the shimmer follows the slide continuously; the chord holds while the voice is still among its tones, thins as it leaves them, and within ≈400 ms of the new pitch settling a *different* chord forms with the new note inside it — a chord whose quality (major/minor) is decided by what was actually sung — and on a held note a bass begins to move underneath.
→ WHAT THE PERSON SHOULD PERCEIVE: "the harmony is made of my voice" — the change is theirs, it happened when they moved, and nothing about it was right or wrong. If they hear a chord change as a reaction to *them* rather than as a backing track, the prototype lives; if they hear a delayed accompaniment they are trying to match, it dies.

## 5. THREE BIGGEST WAYS WE COULD RUIN IT

1. MISTAKE: gating any sound on settled evidence (≥300 ms + stability) "for correctness". → UX FAILURE: a second of nothing after every note; the instrument becomes a reveal machine; causality is lost. → PREVENTION: the fast tier reads `PitchSource` directly; only the bass trigger and Home outcomes wait for settled spans; AC-1 latency logged per event.
2. MISTAKE: letting the fast tier flip chords on every semitone crossing and every octave glitch. → UX FAILURE: harmonic chaos on vibrato and scoops; the pad sounds broken exactly for the learners who need it. → PREVENTION: pitch-class harmony, 180 ms harmony smoother, 20 c hysteresis, 250 ms dwell, octave suppression; AC-2/AC-3 as tests on synthetic vibrato and flips before any human hears it.
3. MISTAKE: measuring the return while the Home tone or room tone sounds, or leaving speakers unflagged. → UX FAILURE: the ring lights by itself (leakage) or the return is never truly from memory; the one honest moment becomes a lie. → PREVENTION: attempt = first settled span with `referenceSounding=false` (and `contextSounding=false` for bare); Home tone only after the span closes; headphones question logged; leakage self-test on speakers.

## 6. FIRST 30 MINUTES FOR CODEX

Inspect, in order: `src/pitch/pitchSource.ts` (publish cadence, freshness, `subscribe/getRecent`), `src/hooks/useMicrophone.ts` (where `pitchSource` is produced and exposed), `src/tuner/visualResponse.ts` (`smoothVisualCents`), `src/pitch/shortWindowPitchEvidence.ts` and its test (settled evidence semantics), `src/audio/referenceDroneEngine.ts` public API + `referenceDroneContext.ts` (context creation, gesture activation), `src/config/runtimeFeatures.ts` and `src/app/App.tsx` (flag + mount point), `src/test/stubPitchSource.ts` and `src/test/pitchTrajectories.ts` (synthetic streams).

First runnable change (one commit series, flag-gated `?play`): `FastPitchInterpreter` + a minimal `PadEngine` that renders only the shimmer and a single voice-following chord (no thin/bloom, no bass, no Home, no logger beyond a console trace), mounted in a bare `PlayModeApp` with a dot on a canvas. Include the synthetic tests for ±50 c vibrato and a 3-frame octave flip before the first manual run. Then sing into it. This tests the highest-risk assumption — perceived causality on this detector's latency — before anything else exists.

## 7. KILL CRITERION

"If a person who sustains a note and then moves to a new pitch does not hear the chord change as caused by their own voice — within ≈400 ms of settling on the new pitch, without chord flips on their vibrato, and with the shimmer following the slide continuously — when they sing into the prototype, stop building Home, progression, retention and gamification and fix the core interaction first."

## 8. FINAL HANDOFF

BUILD FIRST:
The fast tier — shimmer plus a voice-following, pitch-class-based chord on the 30 Hz `PitchSource` path — behind `?play`.

TEST FIRST:
Perceived causality: does one person say, unprompted, that the harmony followed *their* voice, with no chord flicker on normal vibrato?

IGNORE FOR NOW:
Home, bass, logging beyond a trace, visuals beyond a dot, and every deferred system in spec §18.

FINAL RULE:
Sound follows the voice instantly and forgivingly; state follows settled evidence slowly and honestly; the two never share a wire, and nothing the learner sees or hears says correct or wrong.
