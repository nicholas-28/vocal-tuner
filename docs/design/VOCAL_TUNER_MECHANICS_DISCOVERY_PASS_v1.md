# VOCAL TUNER — GAME & LEARNING MECHANICS DISCOVERY PASS v1.0

Status: research/design document. Read-only pass; no repository changes.
Constraint layer: CANONICAL RESEARCH EVIDENCE BASE v1.0 (claims C001–C055, hypotheses H001–H015, latent model L1–L4, Epistemic Graveyard, Product Firewall, backlog E-A…E-G). Every evidence status below is relative to that document, not to the source domain alone.

Notation used throughout:
- `[V]` mechanic details verified this pass against a primary/product source; `[K]` known from general knowledge, not re-verified; `[U]` unverified detail.
- `FWn` = reliance on firewall assumption n (Section 3). Flagged wherever a mechanic needs it to be *true* in order to teach anything.
- `Cnnn` / `Hnnn` / `Ln` / `E-x` = canonical evidence base IDs.
- EVIDENCE STATUS (atlas): SUPPORTED = the vocal mapping rests only on canonical FACT/REPLICATED claims; PLAUSIBLE = source-domain evidence exists and no canonical claim contradicts the mapping, but no vocal evidence; EXPERIMENTAL = the mapping is useful only if a named open hypothesis is true; CONTRADICTED = the mapping needs a Graveyard claim or a MUST-NOT-CLAIM statement; UNKNOWN = nothing either way.
- Safety classes for control variables (Section 4): SAFE-NOW, SAFE-DESCRIPTIVE, HYPOTHESIS-DEPENDENT, UNSAFE.

---

## 0. WHAT THIS PASS FOUND (one page)

1. The world already contains at least fourteen distinct, reusable ways of making repeated sensorimotor calibration engaging that do not depend on a numeric error display: audible physical consequence (piano-tuner beats, sympathetic resonance), contingent response from another agent (caregivers, songbird tutors, PaRappa), earned removal of assistance (Rocksmith Master Mode, dog-training lure fading), information-condition labelling (climbing onsight/flash/redpoint), prediction before reveal (marksmanship "call your shot", baseball temporal occlusion), full-speed-few-items progression (Koch/Farnsworth Morse), ghosts of one's own past (Trackmania, pace boats), instant undo (Forza rewind), comic failure (Trombone Champ, PaRappa), knowledge-gated worlds (Outer Wilds), warmer/colder search (playground), load-holding environments (ERG mode), blackout segments (Rhythm Heaven, osu! Hidden/Flashlight), and process-only practice (blank bale). Each is transformed into a vocal control mapping in the atlas.

2. The strongest transformations are the ones that move the *feedback channel* out of the eye and into the ear or into another agent, because those are the ones the canonical firewall does not forbid: they never need "cents = skill", they need only coarse, honest control events (direction, coarse band ≥25 c, arrival, return, consistency across repeats, reproduction after delay).

3. Feedback removal is the design space where game progression and the retention question (E-A, H002, H009) coincide. Two removal regimes exist in the source products and must not be conflated: *earned, reversible, per-item* removal (Rocksmith) and *scheduled* removal (rehab fading, dog lure fading). The experiment is the comparison; the game can carry both.

4. Memory across delay is the most natural vocal game primitive that is also the most research-relevant (L1, C014): a note "kept" for 3 s, 30 s, or until tomorrow can be play (a creature asks for its word back; a lighthouse must be relit) and is simultaneously a delayed retention trial.

5. Vocal control can become a playable medium, but not through the tuner's variable. The playable variables are: direction, arrival, hold-through-perturbation, return, step-by-relation, reproduce-after-delay, answer-in-context, and range exploration. Instantaneous cents, within-note spread, onset error and vibrato quality are not playable variables under the firewall; they are descriptive or research quantities.

6. Six identities emerged; the two strongest are "an instrument whose controller is the voice and whose feedback is musical consequence" and "a memory game about your own voice that doubles as a retention instrument". The conventional tuner is the weakest identity found.

7. Twelve things should not be designed yet (Section 21-L) because every version of them either requires FW1/FW2/FW4/FW5 or a Graveyard claim.

---

## 1. CORE FRAME

The loop analysed for every system: Action → Feedback → Interpretation → Decision → Next Action → Variation → Retention/Transfer → Progression.

The fifteen questions are answered per mechanic inside the atlas fields, with this mapping so the atlas stays compact:

| Question | Atlas field |
|---|---|
| 1 What does the learner do? | LEARNER ACTION |
| 2 What information does the system receive? | MEASUREMENT REQUIRED |
| 3–5 How fast, what does it say, what changes the next attempt? | FEEDBACK LOOP |
| 6–7 Success / failure representation | FEEDBACK LOOP (success/failure clause) |
| 8 Why another attempt? | WHY REPEAT |
| 9–10 What changes, what gets harder? | DIFFICULTY VARIABLE |
| 11 Capability or game progression? | WHAT ACTUALLY IMPROVES + PROGRESSION note |
| 12–13 Exploration vs optimisation; exploitability | EXPLOIT / METER-CHASING RISK |
| 14 What happens when feedback is removed? | FEEDBACK REQUIRED + RETENTION COMPATIBILITY |
| 15 What might transfer? | TRANSFER ASSUMPTION |

Two frame-level observations that shaped everything after:

- In every engaging source system the *interpretation* step is done by the learner, not by the display. Beats, a ringing chord, a creature that answers, a ghost pulling ahead, a lamp that brightens: the system supplies a consequence; the learner supplies the meaning. Systems that do the interpretation for the learner ("−17 cents", red/green) shorten the loop but remove the part of the loop that carries learning in the source domains (calling the shot, reading the beats, deciding what to change).
- In every source system with durable engagement, *variation* is structural, not cosmetic: a new key, a new ghost, a new occlusion point, a new distraction. Systems with fixed items and fixed feedback (typing drills without keybr's adaptivity, static tuner holds) are the ones people abandon or game.

## 2. SEARCH SCOPE AND METHOD

Domains actually examined (products in the atlas are marked `[V]` when verified this pass by web check, `[K]` otherwise):

- Music learning and play: DAM Seimitsu Saiten and JOYSOUND Bunseki Saiten karaoke scoring `[V]`, Rock Band 3 harmonies `[V]`, Rocksmith Dynamic Difficulty / Riff Repeater / Master Mode `[V]`, osu! mods `[V]`, Rhythm Heaven blackout stages `[V]`, PaRappa Cool/Bad/Awful modes `[V]`, Wandersong `[V]`, One Hand Clapping `[V]`, Trombone Champ `[V]`, Blob Opera `[V]`, Space Channel 5 / Elite Beat Agents `[V partial]`, Smule open calls `[V partial]`, Yousician / Simply Sing `[V partial]`, Otamatone / theremin `[K]`, Improvise for Real "sing the numbers" `[K]`, Dalcroze question–answer `[K]`, jazz trading fours `[K]`, barbershop lock-and-ring `[K]`, choir tuning ladders `[K]`, piano-tuner beat counting `[K]`, Electroplankton `[K]`, Tenori-on `[K]`.
- Language learning: Koch method and Farnsworth timing (Morse) `[V]`, Pimsleur graduated interval recall `[V]`, shadowing `[V partial]`, ELSA per-phoneme colouring `[V]`, Duolingo hearts/streaks/leagues critique `[V]`, Larkwire `[V partial]`, Kellman ARTS `[V]`.
- Motor skill / sport: aim-trainer scenario taxonomy and benchmarks `[V]`, blank-bale archery `[V]`, marksmanship call-your-shot `[V]`, temporal occlusion training (gameSense, uHIT) `[V]`, Zwift/TrainerRoad ERG mode and pace partners `[V]`, Concept2 pace boat `[V]`, Trackmania/Mario Kart ghosts `[K]`, climbing onsight/flash/redpoint/projecting `[V]`, Monkeytype/keybr typing `[K]`, juggling siteswap ladders `[K]`.
- Games: Forza rewind `[V]`, Celeste death-count and instant respawn `[K]`, Outer Wilds knowledge-gated progression `[K]`, Metroidvania map reveal `[K]`, Game of SKATE / HORSE `[K]`, Simon `[K]`, "hot and cold" and Marco Polo `[K]`, Typing of the Dead `[K]`, roguelike run structure `[K]`.
- Rehabilitation / biofeedback: error augmentation and assist-as-needed robotics `[V]`, LSVT LOUD dosage and calibration `[V]`, Wii Fit centre-of-pressure `[V]`, Elvie "lift the gem" `[V]`, Muse soundscape `[V]`, delayed auditory feedback for fluency `[K]`, dichoptic amblyopia games `[K]`.
- Unusual: infant babbling shaped by contingent caregiver response (Goldstein, King & West 2003) `[V]`, zebra-finch self-triggered tutoring and live-tutor advantage `[V]`, dog clicker shaping, lure fading and the "3 D's" `[V]`, aviation partial-panel training `[K]`, whistled languages and tone-language contour drills `[K]`, sheepdog whistle commands `[K]`, cattle calls / kulning `[K]`.

Method: each system was reduced to its loop signature (what is controlled, what is sensed, when and how feedback arrives, what varies, what progression is tied to), then re-mapped onto vocal control variables from Section 4, then checked against the firewall and graveyard. Source-domain evidence is reported as found; vocal evidence is reported only from the canonical base. No vocal-pitch literature was reopened.

## 3. SCIENTIFIC FIREWALL (numbered for flagging)

A mechanic may *use* a measurement without assuming it means skill. The flag applies when a mechanic's learning claim, scoring, progression or difficulty depends on the assumption being true.

| Flag | Assumption we never make |
|---|---|
| FW1 | tighter cents = higher skill |
| FW2 | ±5 or ±10 c is a mastery criterion |
| FW3 | instantaneous f0 = perceived pitch |
| FW4 | improvement during visual feedback = learning |
| FW5 | performance during feedback = retention |
| FW6 | single-note gains transfer to phrases |
| FW7 | phrase gains transfer to songs |
| FW8 | note skill and song skill are necessarily separate |
| FW9 | perception training necessarily improves production |
| FW10 | continuous references help |
| FW11 | continuous references harm |
| FW12 | drones help |
| FW13 | drones harm |
| FW14 | initial pitch error measures feedforward skill |
| FW15 | drift is / is not a skill |
| FW16 | one global score represents singing ability |

Canonical anchors used for flags: FW1/FW2 ← C033, C037, H007 and the firewall rows for ±5/±10 c; FW3 ← C038–C041, C054, H010; FW4/FW5 ← C020, C028, H002; FW6–FW8 ← H003, H004; FW9 ← C015–C017 with C016's weak null; FW10–FW13 ← C007, C046, C048, H006, H012; FW14 ← H005 (demoted); FW15 ← C045, H013; FW16 ← C011, C030, C031.

Additional discipline applied in this pass (from the Product Firewall): within-note spread has no perceptual counterpart and is never a game variable; median f0 is research-only; nearest-note classification is display, never verdict; immediate feedback-off improvement is "changed since the start", never "learned".

## 4. CONTROL VARIABLES, NOT EXERCISES

Every mechanic is expressed as: *the learner controls X; the system senses Y; feedback is Z*. The variable list below is the vocabulary used by the atlas. Safety is judged against what the measured stack can currently observe (C054, C055) and what the firewall permits to be shown.

| Control variable | What the current stack observes | Safety class | Why |
|---|---|---|---|
| Pitch direction (up / down / same) | sign of change between settled centers; robust even with smearing | SAFE-NOW | coarse; direction is reproduced even by amusics (C008); no perceptual-center claim needed |
| Approximate pitch center (coarse band ≥25 c, settled region) | duration-weighted center over a settled span; ≈43 ms lag; vibrato ×0.71 | SAFE-DESCRIPTIVE | ≈ lay out-of-tune threshold (C033); shown only as "a bit above / below / there" |
| Target acquisition (arrive inside a coarse band within a time budget) | first settled frame inside band; timing smeared by ≈43–85 ms | SAFE-NOW (coarse timing only) | arrival is an event, not a precision claim; onset shape itself is research-only (H005, FW14) |
| Return to target after leaving it | settled center before/after excursion | SAFE-DESCRIPTIVE | behaviourally clean; never labelled "drift control" (H013, FW15) |
| Repeated-attempt consistency (≥4 repeats) | precision of settled centers across attempts | SAFE-DESCRIPTIVE | C011 says descriptive; wording "consistent across N", never "stable" |
| Interval relation (settled center A → settled center B) | difference of centers | SAFE-DESCRIPTIVE | interval deviation is what judges track (C029); categorical hearing in musicians (C037) means coarse categories are the honest display |
| Hold through perturbation (accompaniment changes; you stay) | time inside coarse band over 10–30 s | HYPOTHESIS-DEPENDENT as a *skill* (H013), SAFE-NOW as a *game event* | the event "stayed inside 25 c band while harmony moved" is observable; calling it a skill needs H013 |
| Trajectory (glide shape, scoop, overshoot) | partly; smeared; scoop first frames read toward settled value (C054) | HYPOTHESIS-DEPENDENT | perceived pitch of scooped notes unknown (H010); naturalness only (C042); descriptive display allowed, scoring not |
| Duration (sustain length) | voiced duration | SAFE-NOW | not a pitch claim; physiological caution on extremes |
| Timing / rhythm (onset time relative to a beat) | onset time (smeared ≈43 ms + 85 ms window) | SAFE-NOW at coarse windows (≥100 ms) | outside the pitch firewall; measurement latency must be calibrated (M1) |
| Memory after reference removal (reproduce after delay) | settled center vs reference after 0–30 s, next session | SAFE-DESCRIPTIVE and research-valuable | C014 (decline with delay), L1; shown as "closer / further than last time", never "ear quality" |
| Response to another musical gesture (answer, mirror, complete) | contour and final-note relation, coarse | SAFE-NOW as interaction; scoring of "musicality" UNSAFE | L4 relevant; C043/C044 context effects; no rating of musical quality |
| Movement through a sequence | ordered settled centers vs script | SAFE-DESCRIPTIVE | C006 (interval compression) as descriptive pattern; never "song skill" (H003, FW6–FW8) |
| Exploration of vocal range | which pitch regions were visited and how (coarse), self-reported comfort | SAFE-NOW | descriptive map; no claim; useful metadata for research (range, register) |
| Precision inside ±10 c or narrower | measurable, unreliable per frame | UNSAFE for learner-facing game use | FW1, FW2; firewall rows "inert / meter-chasing" |
| Initial pitch error | partly; smeared | UNSAFE learner-facing; research signal | H005 demoted; E-D pending |
| Within-note spread / "stability" | measurable | UNSAFE | no perceptual counterpart; delete from learner view |
| Vibrato rate / extent | measurable (attenuated) | descriptive only | not quality; C035/C036 ambiguity |
| Tonal-center drift over ≥30 s | measurable | research / teacher only | H013 |

Consequence for game design: the *safe* playable variables are direction, arrival, coarse center, return, consistency, interval, delay-reproduction, answer, sequence and range. Every mechanic in the atlas is built on those; every place where a source mechanic wants precision, spread, onset or vibrato is flagged and redirected.

## 5. TRANSFORMATIONS (systematic chains)

For each promising non-vocal mechanic: ORIGINAL → ABSTRACT PRINCIPLE → VOCAL CONTROL MAPPING → GAME LOOP → SCIENTIFIC ASSUMPTION → FAILURE / EXPLOIT RISK. Full detail lives in the atlas; these are the chains for the highest-value transplants.

1. Piano-tuner beats → error is audible as a physical rate, no display needed → sing against a sustained tone; beats slow as you approach unison/just interval → "silence the beats, then the chord blooms" → assumes learners can hear beats through their own vibrato and timbre (unknown; vibrato ±20 c will beat at the vibrato rate) → straight-tone strategy to remove beats; continuous reference (FW10/FW11 flag, H006/H012).
2. Sympathetic resonance (piano with pedal down) → the environment rings when you match its partials → virtual resonator bank excited by the mic; each resonator "wakes" when its fundamental or partial is hit → "wake the room, keep it ringing, wake it again tomorrow" → assumes f0-driven resonance is heard as "I am on it" (FW3 minor: resonators react to f0, not to perceived pitch) → learners may hunt for whichever resonator is easiest; resonance also excited by harmonics (octave/fifth exploits).
3. Rocksmith Master Mode → assistance is removed *per item*, only after measured success, and returns when performance drops → guide melody fades per phrase once coarse accuracy is stable; reappears on misses → "earn the dark" → assumes practice under removal supports retention (H009; FW4/FW5 flagged if fade criteria use in-feedback performance) → learners can keep the guide by failing deliberately (low incentive) or memorise the visual rather than the sound.
4. Marksmanship "call your shot" → predict the outcome before the reveal; discrepancy diagnoses process → after each note, declare high/low/on (or which of three notes was off) before the coarse reveal → "prediction streak, not accuracy streak" → assumes self-prediction is trainable and informative about L1/L3 (plausible; C004/C005 dissociation means predictions and production can disagree, which is the interesting data) → learners can always say "on" (fix: score the *agreement*, and vary base rates).
5. Baseball temporal occlusion → the stimulus is cut before the outcome; the learner predicts the continuation; occlusion moves earlier with success → hear the first part of a phrase; it cuts; sing the continuation; then hear what it was → "finish the sentence" → assumes tonal expectation (C043) and sequence memory (L4) can be exercised without claiming song transfer (FW7) → guessable continuations (fix: vary continuations, include non-obvious ones).
6. Koch + Farnsworth (Morse) → few items at full speed, add one at criterion; real-speed units with lengthened gaps → two scale degrees at musical tempo; add a degree when 2-note calls are reproduced consistently; long gaps between notes that shrink over time → "your vocabulary grows" → assumes item-specific learning (H004) and that gaps are where planning/memory happen (L1/L2; unknown) → criterion on noisy measure (fix: coarse band + repeated trials, not 90% of frames).
7. Dog-training lure fade + 3 D's → prompt → cue → no prompt; proof one dimension at a time (distance, duration, distraction) → reference tone → name/degree cue → nothing; proof across register, vowel, tempo, backing, one at a time → "proofing" → assumes context-specific learning and that varying one dimension at a time is transfer practice (H004, H008; unknown for voice) → dimensions interact; measurement differs across vowels/registers (C054 unknown on real voice).
8. Zwift ERG mode → the environment holds the load so the controlled variable must stay constant → the harmony moves under a held note (pedal point) → "hold the ground while the world changes" → assumes hold-through-perturbation is a distinct controllable behaviour (H013; FW15 flagged if called "drift skill") → learners can stop phonating during hard chords (fix: voiced coverage requirement, coarse).
9. Trackmania ghost / pace boat → race your own recorded past → yesterday's take is an audible/visible partner today → "beat the ghost by being closer to your own earlier self, or diverge from it deliberately" → assumes comparison to own prior is motivating and that a next-day ghost run is a retention trial (it is, by construction: E-A compatible) → ghost becomes a continuous reference (FW10/FW11) unless faded in only on divergence.
10. Rhythm Heaven blackout / osu! Hidden and Flashlight → feedback is hidden within a trial, not across levels → the display goes dark for 2–5 s mid-phrase; returns; shows what happened → "glimpse" → assumes brief blindness inside play is tolerable and informative (E-A; H009) → learners freeze during darkness (fix: coverage requirement; darkness lands on sustained notes first).
11. Contingent caregiver / songbird self-tutoring → the other agent responds contingently to the learner's vocalisation; tutoring is learner-triggered → a musical agent answers only when a coarse control event occurs (stable 1 s inside 25 c; or a clear direction change); reference playback on demand → "conversation" → assumes contingency itself drives vocal change in adults (supported in infants/birds; unknown in adults; C050 says self-controlled feedback ≈0 in limb tasks) → the agent's contingency can be gamed by any stable note (fix: contingency on *relation* to the agent's phrase, coarse).
12. PaRappa Cool mode → the reward for faithful imitation is permission to stop imitating → after N faithful echoes the model falls silent and the learner must answer freely; if the answer stays in the tonal frame the world "stays lit" → "earn freedom" → assumes imitation and free answering share sequence memory (L4; unknown) → free answers are unscorable in detail (design: score only coarse frame membership, or nothing).
13. Forza rewind → failure is undone at a keypress; the run continues → a coarse miss rewinds the phrase to the last settled note and continues → "the phrase heals" → assumes nothing beyond usability → learners rely on rewind and never plan (fix: rewind count is visible as a *descriptive* number, not a penalty).
14. Blank bale → remove the target to attend to process → phonate comfortable notes with no target and no pitch display; only consistency across repeats is stored (not shown) → "form days" → assumes attention to process is useful (unknown for pitch; plausible for onset/breath) → nothing to exploit; risk is boredom.
15. Climbing onsight/flash/redpoint → attempts are labelled by prior information, not by score → every item gets onsight (unseen, no reference), flash (heard once), redpoint (practised) status → "logbook" → assumes only that labels are honest; no learning claim → none; the labels are the research instrument (untrained items, reference removal, retention).
16. Muse soundscape → internal state changes ambient sound; nothing numeric → coarse stability (inside a wide hidden band for ≥1 s) calms the weather; leaving it stirs it → "calm the storm" → assumes a wide hidden band is felt as responsive and not random (H007 adjacent) → band narrowing by designers (FW1 creep); learners hold breath-limited straight tones.
17. Aim-trainer taxonomy (flick / track / target-switch) → decompose "aiming" into control primitives with separate benchmarks → decompose "pitching" into leap / ride / step-sequence, each measured separately, coarse → "primitive benchmarks" → assumes primitives are distinct (C011 dissociations support separateness at least for accuracy/precision and absolute/relative) → benchmark scores become meter-chasing (FW1) unless coarse and rank-free.
18. Error augmentation (rehab) → exaggerate the error to accelerate adaptation → visual gain >1 or audio pitch-shifted feedback → "amplified world" → assumes error-driven adaptation transfers to unaided singing (C001 shows automatic compensation exists; learning from perturbation unknown; visual gain is FW4 squared) → highest meter-chasing risk in the pass; kept as fun-but-dangerous.
19. Elite Beat Agents branching → the outcome changes the story, not a number → coarse performance decides which of three musical continuations plays → "narrative consequence" → assumes nothing beyond coarse events → only that designers will be tempted to branch on fine criteria.
20. LSVT LOUD single target + calibration → one variable, intensive dosing, and recalibrating the learner's internal sense against a meter → one coarse control variable per block; a calibration ritual where the learner guesses before the meter speaks → "calibrate yourself" → assumes the calibration concept transfers from loudness to pitch (unknown) → none specific; dosage structure is the transplant.

## 6. NON-ANCHORING NOTE

The existing concepts (glider, corridors, orbit, landing, return home, constellations, echo, disappearing feedback, portals, gravity/wind, voice-controlled environments) are not elaborated here. Where external mechanics change how one of them should be understood, this pass says so in one line:

- Disappearing feedback: the source products remove assistance *per item, after success, reversibly* (Rocksmith) or *on a schedule* (rehab fading, lure fading). Ours was a level. The per-item, reversible version is the one that is both a game and an E-A instrument.
- Echo: PaRappa shows the payoff of imitation is not a score but permission to deviate. Echo without an exit becomes a drill.
- Return home: the playground and marksmanship versions (hot/cold, call your shot) show that *returning without seeing* is the interesting variant; return with a visible home is a tracking task.
- Voice-controlled environments: One Hand Clapping calibrates to the player's comfortable range before any puzzle and uses pitch mostly as direction and coarse level, which is exactly the safe variable set. The interesting part of that product is not the platforms; it is that puzzles are solved by *holding* and by *duets*.
- Landing / corridors / orbit / gravity / wind / portals / constellations: nothing in the external search adds to them beyond what the atlas families TRACK, SETTLE and ACQUIRE already say; they are cosmetic variants of those loops.

## 7. MECHANIC ATLAS (48 entries)

Field key (every entry uses all fields, in this order): SOURCE (domain · product/system · original implementation) · ABSTRACT · ACTION (learner) · LOOP (feedback loop incl. success/failure representation) · REPEAT (why again) · DIFFICULTY (variable) · IMPROVES (what actually improves in the source) · VOCAL (translation) · CV (vocal control variable, safety class from §4) · MEAS (measurement required) · REF (none/initial/intermittent/continuous) · FB (none/terminal/intermittent/concurrent) · TRANSFER (assumption) · EVIDENCE (status + canonical anchors) · SCI-RISK · EXPLOIT (meter-chasing risk) · RETENTION (blind 24 h / 7 d compatibility) · G/L/N (game / learning / novelty potential).

Families are assigned in §8; each entry carries its family tag in the name line.

---

**M01 · FLICK** (family ACQUIRE)
SOURCE: sport/esports · KovaaK's, Aim Lab "clicking" scenarios `[V]` · static or dynamic targets appear; the player moves the cursor to the target as fast as possible and confirms; scenarios are benchmarked separately from tracking and switching.
ABSTRACT: fast discrete acquisition of a target followed by confirmation; speed and accuracy traded explicitly.
ACTION: leap from rest to a target region, then confirm by holding briefly.
LOOP: immediate; success = confirmation inside the region within a time budget; failure = nothing happens (target stays), no penalty text.
REPEAT: targets are cheap and plentiful; each is 1–2 s; the score is a rate, not a verdict.
DIFFICULTY: target size, distance, time budget, number of targets.
IMPROVES (source): speed–accuracy trade-off for acquisition; benchmarks separate primitives; transfer to real play contested.
VOCAL: a target region appears (as sound: a short cue, or as position); the singer leaps to it and holds 500 ms inside a coarse band (≥25 c); time budget shrinks with practice.
CV: target acquisition (SAFE-NOW, coarse timing); approximate center (SAFE-DESCRIPTIVE).
MEAS: first settled frame inside band, hold duration, settled center; onset shape stored but not scored (E-D).
REF: initial (cue) or none (named degree from memory).
FB: terminal (arrival event) or concurrent-coarse (region lights when inside).
TRANSFER: assumes acquisition speed is a distinct behaviour worth training (C011 supports separate accuracy/precision; speed unknown).
EVIDENCE: PLAUSIBLE (C011; H004 item-specificity means gains may stay on trained targets).
SCI-RISK: time-to-target is smeared by ≈43–85 ms (C054); onset error must not be scored (FW14).
EXPLOIT: medium — narrowing the band converts this into meter chasing (FW1); learners can scoop into targets to trigger the region early (fix: settled-region only).
RETENTION: yes — untrained targets next day, no cue.
G/L/N: high / medium / low.

**M02 · TIMING TIERS ON ARRIVAL, NOT ON CENTS** (ACQUIRE)
SOURCE: rhythm games · DDR, Beat Saber, Clone Hero hit windows `[V partial]` · every note is graded by a millisecond window around the beat (Perfect/Great/Good/Miss); windows can be calibrated to latency.
ABSTRACT: tiered success by timing precision; the tier is about *when*, not *where*.
ACTION: arrive in the (coarse) pitch region on the beat.
LOOP: immediate tier feedback per note; failure = the tier name, never a number.
REPEAT: combo and flow; tiers give near-miss information without numbers.
DIFFICULTY: tempo, window width (in ms), phrase density.
IMPROVES (source): timing consistency.
VOCAL: pitch stays coarse (inside 25–50 c band); the tiered variable is arrival time relative to the beat. Cents never get tiers.
CV: timing (SAFE-NOW ≥100 ms windows) + target acquisition.
MEAS: onset time (latency-calibrated, M1), settled band membership.
REF: initial (backing beat gives time; pitch cue given once).
FB: concurrent tiers on time; terminal coarse on pitch.
TRANSFER: assumes vocal timing is worth training separately (pitch and time dissociate: C011).
EVIDENCE: PLAUSIBLE (C011).
SCI-RISK: measurement latency must be calibrated per device (C055 unknown devices).
EXPLOIT: low for pitch; medium for timing if windows are narrower than measurement jitter.
RETENTION: yes (blind tempo trials).
G/L/N: high / medium / medium.

**M03 · TARGET SWITCHING** (SEQUENCE)
SOURCE: esports · aim-trainer "target switching" scenarios `[V]` · several targets, hit in order; scored separately from flick and track.
ABSTRACT: sequenced acquisitions where the cost is the *transition*, not each target.
ACTION: sing a sequence of coarse targets in order at a given rate.
LOOP: per-transition event; failure = the sequence pauses on the missed transition.
REPEAT: sequences are short (3–5); each run 5–8 s.
DIFFICULTY: interval size, number of targets, rate, direction changes.
IMPROVES (source): switching cost.
VOCAL: scale-degree sequences and leaps; the interesting quantity is settled center of note n+1 relative to note n.
CV: interval relation, movement through sequence (SAFE-DESCRIPTIVE).
MEAS: settled centers per note; interval deviations (C029-relevant).
REF: initial (tonic) or intermittent.
FB: terminal per sequence (coarse: which transition was wide/narrow).
TRANSFER: assumes interval control in short sequences relates to melodic accuracy (C006, C029 supportive as correlates; FW6/FW7 flagged for song claims).
EVIDENCE: PLAUSIBLE (C006, C029).
SCI-RISK: interval compression is descriptive of poor singers (C006) — never diagnostic wording.
EXPLOIT: low–medium.
RETENTION: yes (untrained sequences).
G/L/N: medium / medium / low.

**M04 · ERG MODE — THE WORLD HOLDS THE LOAD** (SETTLE)
SOURCE: cycling · Zwift/TrainerRoad ERG `[V]` · trainer resistance auto-adjusts so power stays at target regardless of cadence; the rider's job is to keep turning.
ABSTRACT: the environment changes so that the learner's variable must remain constant; the difficulty is external perturbation, not a narrower target.
ACTION: hold a note while the accompaniment moves (chord changes, register shifts, a second voice passing through).
LOOP: musical: consonance/dissonance changes under a held note; the coarse band is wide and hidden; success = still inside band when the harmony returns; failure = the harmony does not resolve.
REPEAT: the harmonic journey is different each time; holding is a felt achievement.
DIFFICULTY: harmonic distance of the moving parts, duration, register of the moving voice (close to the held note is hardest), presence of a doubled melody (C007-adjacent).
IMPROVES (source): sustained effort at fixed output.
VOCAL: pedal-point holding; "stay while it moves".
CV: hold through perturbation (SAFE-NOW as event; HYPOTHESIS-DEPENDENT as skill H013).
MEAS: time inside coarse band over 10–30 s; voiced coverage.
REF: continuous (the moving harmony *is* the reference and the perturbation) — FW10/FW11 flagged.
FB: concurrent, musical (no numbers) + terminal ("held / drifted up / drifted down").
TRANSFER: assumes hold-under-harmony is a controllable behaviour distinct from spontaneous drift (H013).
EVIDENCE: EXPERIMENTAL (H013; H006/H012 for reference effects).
SCI-RISK: calling it "drift control" (FW15); breath limits confound duration.
EXPLOIT: low — nothing numeric to chase; medium if a visible band is added.
RETENTION: partly — a blind version is "hold while harmony moves, no return cue"; 24 h retest possible.
G/L/N: medium / medium / medium.

**M05 · BALANCE BOARD** (SETTLE — fun-but-dangerous)
SOURCE: rehab/fitness · Wii Fit centre of pressure `[V]` · load sensors map the centre of gravity to a cursor; games (ski slalom, heading balls) are steered by leaning.
ABSTRACT: a continuous internal variable becomes a visible cursor; the game is pure stabilisation/steering of that cursor.
ACTION: keep a cursor centred by micro-adjusting.
LOOP: instant, visual, continuous; failure = cursor leaves the zone.
REPEAT: fluid, satisfying; but the loop is closed by the eye.
DIFFICULTY: zone width, disturbances.
IMPROVES (source): balance control during the game; transfer to falls debated.
VOCAL: pitch as balance cursor. This is the current tuner with a game skin.
CV: approximate center — but the loop demands precision (UNSAFE when band <25 c).
MEAS: per-frame cents (unreliable, C054).
REF: continuous (visual zone).
FB: concurrent visual.
TRANSFER: assumes performance with concurrent visual feedback carries over (FW4, FW5; C020 in-task dip; H002).
EVIDENCE: CONTRADICTED as a learning mechanic when the loop is the only loop (MUST-NOT-CLAIM "visual feedback produces learning"); PLAUSIBLE as an *acquisition* tool inside a larger structure (C019–C021 immediate gains).
SCI-RISK: highest visual dependency in the atlas.
EXPLOIT: highest — the whole game is meter chasing.
RETENTION: only if paired with removal (M27, M11).
G/L/N: high / low / low.

**M06 · BLANK BALE** (PROCESS)
SOURCE: archery · blank-bale shooting `[V]` · shoot at a blank face from a few feet; no aiming, no score; attention on release and follow-through.
ABSTRACT: remove the outcome so the process can be attended to.
ACTION: phonate comfortable notes with no target and no pitch display; attention on breath, onset, release.
LOOP: none in the moment; afterwards only descriptive consistency across repeats is stored (not shown as a score).
REPEAT: short "form" blocks between play; ritual quality.
DIFFICULTY: none by design; variation = vowel, register, duration.
IMPROVES (source): form under no outcome pressure (coach-reported).
VOCAL: "no-target days"; also the natural baseline block for research (free phonation precision, range metadata).
CV: repeated-attempt consistency (SAFE-DESCRIPTIVE), range exploration (SAFE-NOW).
MEAS: settled centers, durations, voicing coverage; stored, not displayed.
REF: none.
FB: none.
TRANSFER: no claim.
EVIDENCE: UNKNOWN for pitch; PLAUSIBLE for onset/breath behaviour (C042 naturalness only).
SCI-RISK: none if nothing is claimed.
EXPLOIT: none.
RETENTION: yes as baseline (the same free block repeated on day 7).
G/L/N: low / low–medium / medium.

**M07 · RIDE THE LINE** (TRACK)
SOURCE: games/esports · Trombone Champ mouse-Y pitch line `[V]`; aim-trainer tracking scenarios `[V]` · continuous control of a variable to follow a moving reference; tolerance loose, misses audible.
ABSTRACT: continuous pursuit of a slowly moving reference; lag and overshoot are the variables.
ACTION: follow a glide/contour by ear (and optionally by eye).
LOOP: concurrent; the singer hears where the reference is; success = staying within a wide tolerance; failure = audible divergence.
REPEAT: contours vary; the feel of "riding" is intrinsically pleasant (portamento is expressive).
DIFFICULTY: contour speed, curvature, range, tolerance width (coarse), audibility of the reference (fade).
IMPROVES (source): tracking control, lag reduction.
VOCAL: glides and contours; tone-language style contour drills.
CV: trajectory (HYPOTHESIS-DEPENDENT for scoring), direction (SAFE-NOW).
MEAS: lag and coarse error vs reference contour (43 ms lag known, C054).
REF: continuous (audible) → FW10/FW11 flagged.
FB: concurrent, audible; visual optional.
TRANSFER: assumes contour control is a separable skill (contour errors were rare in adults, C029 — but that was a floor effect; contour "irrelevant" is RETIRED, so no claim either way).
EVIDENCE: UNKNOWN for learning; SUPPORTED as a measurable behaviour.
SCI-RISK: tracking a continuous reference is the condition most likely to show "performance not retention" (C050 ML pattern).
EXPLOIT: low if audible only; high if a visible corridor is added.
RETENTION: blind version = reproduce the contour after the reference stops (delay).
G/L/N: high / low–medium / low (we already have corridor-like ideas; the audible-only variant is the new part).

**M08 · GHOST OF YOUR OWN PAST** (RETURN / SOCIAL-SELF)
SOURCE: racing/rowing · Trackmania & Mario Kart ghosts `[K]`, Concept2 pace boat `[V]`, Zwift RoboPacers `[V]` · a prior run or a fixed-pace partner is replayed as a translucent competitor.
ABSTRACT: compare the present attempt to a recorded self; the reference is one's own history, not an external ideal.
ACTION: sing a phrase you sang yesterday; your earlier take plays as a ghost voice (or a silent ghost line that only appears when you diverge).
LOOP: concurrent-on-divergence (ghost fades in only when far), terminal comparison ("today vs yesterday: closer to the model / further; more consistent / less").
REPEAT: the ghost is personal; beating yesterday is a story.
DIFFICULTY: ghost audibility (always / on divergence / never), delay since ghost, item familiarity.
IMPROVES (source): pacing consistency.
VOCAL: same-item retest with self-reference; also a *retention trial by construction* when the ghost is silent.
CV: memory after reference removal (SAFE-DESCRIPTIVE), consistency.
MEAS: settled centers per note today vs the stored take; both compared to the script.
REF: intermittent (own ghost) or none (silent ghost).
FB: intermittent / terminal.
TRANSFER: assumes nothing beyond honest comparison; retention inference requires untrained items alongside.
EVIDENCE: SUPPORTED as instrument (C028 says nobody has this data; this collects it); UNKNOWN as motivator for singing.
SCI-RISK: audible ghost = continuous reference (FW10/FW11) — must be a condition, not a default.
EXPLOIT: low (nothing numeric).
RETENTION: yes — this is the retention mechanic (E-A).
G/L/N: high / medium / high.

**M09 · WARMER / COLDER** (RETURN / SEARCH)
SOURCE: playground · "hot and cold" `[K]` · the seeker moves; others say only warmer/colder; the object is hidden.
ABSTRACT: qualitative, direction-only feedback with no magnitude; the learner integrates over moves.
ACTION: find a hidden pitch by singing candidates; after each, one word: warmer / colder / there.
LOOP: intermittent, verbal, coarse; success = "there" (inside 25–50 c hidden band); failure = "colder" (which is information).
REPEAT: search is inherently curious; each hunt is 5–15 s.
DIFFICULTY: band width (hidden, never below 25 c), starting distance, whether the target is fixed or slowly moving, silence delay before the word.
IMPROVES (source): search strategy; integration of coarse cues.
VOCAL: no meter, no note name; the only feedback is a direction word (or a sound).
CV: pitch direction (SAFE-NOW), target acquisition, return.
MEAS: settled center per candidate vs hidden target.
REF: none (target never sounded) or initial (heard once, then hidden).
FB: intermittent terminal per candidate.
TRANSFER: assumes coarse KR bands near compensation sensitivity are useful (H007) and that search with no reference exercises L1/L2 (unknown locus, H001).
EVIDENCE: PLAUSIBLE (H007 direction; C014 for the "heard once" variant).
SCI-RISK: low; bands must not creep narrower (FW1).
EXPLOIT: low — magnitude is hidden; a "there" can be found by sweeping (fix: limited candidates per hunt).
RETENTION: yes — the found note can be asked for again after delays (M12) and next day.
G/L/N: high / medium / high.

**M10 · MARCO POLO** (RETURN / NAVIGATION BY SOUND)
SOURCE: playground/pool · Marco Polo `[K]`; echolocation training `[K]` · the seeker is blind; calls "Marco", others answer "Polo"; navigation by intermittent sound.
ABSTRACT: locate a target by intermittent sonic replies to your own calls.
ACTION: the learner sings a call; a hidden target replies with a short tone whose *relation* to the call (above/below, near/far, by timbre or loudness) is the only cue; the learner moves and calls again.
LOOP: intermittent; each reply is a musical interval heard, not a number; success = the reply merges with the call (unison or chosen interval); failure = the reply stays distinct.
REPEAT: dialogue feel; 3–6 calls per hunt.
DIFFICULTY: reply length, reply loudness (fades with distance), delay before reply, moving target.
IMPROVES (source): auditory localisation strategy.
VOCAL: relation-by-ear; the learner must judge the interval between their call and the reply (perception) and then act (production) — a natural JUDGE+MOVE pairing.
CV: interval relation, direction (SAFE), memory (the reply is gone before you move).
MEAS: settled center of each call; hidden target.
REF: intermittent (reply is a reference of the *relation*, not the target).
FB: intermittent, musical.
TRANSFER: assumes perception of a relation followed by production of a correction is a useful loop (C010 correlation; FW9 flagged if perception alone is credited).
EVIDENCE: PLAUSIBLE.
SCI-RISK: replies with unfamiliar timbre are matched worse (C047) — timbre is a condition variable.
EXPLOIT: low.
RETENTION: yes — hunt the same hidden target tomorrow with fewer replies allowed.
G/L/N: high / medium / high.

**M11 · BLACKOUT INSIDE THE TRIAL** (BLIND / GLIMPSE)
SOURCE: rhythm games · Rhythm Heaven "Built to Scale", "Samurai Slice" blackouts `[V]`; osu! Hidden and Flashlight `[V]` · the screen darkens or objects fade before the hit; the player continues from rhythm memory; light returns.
ABSTRACT: feedback is withdrawn *within* an attempt, briefly and predictably, then restored; performance in the dark is revealed afterwards.
ACTION: sustain or continue a phrase while the display goes dark for 2–5 s; keep going; see what happened when the light returns.
LOOP: concurrent → none → terminal reveal; success = stayed inside the coarse band in the dark; failure = shown as where you went (direction), never as a number.
REPEAT: darkness is exciting; the reveal is a small story.
DIFFICULTY: darkness duration, when it strikes (sustain vs transition), what remains (Flashlight variant: only your own position visible, target hidden; Hidden variant: target visible, your position hidden).
IMPROVES (source): internalised timing.
VOCAL: glimpse practice; the two osu! variants map exactly onto "hide the target" vs "hide yourself" — different information conditions worth separating.
CV: hold, return, memory after reference removal (SAFE-DESCRIPTIVE).
MEAS: settled center trajectory during the dark window vs before.
REF: initial (visible before darkness).
FB: intermittent.
TRANSFER: assumes brief removal inside play supports later performance without feedback (H009, H002 — E-A).
EVIDENCE: EXPERIMENTAL (H009).
SCI-RISK: FW4/FW5 if "dark performance" is treated as retention (it is same-session performance).
EXPLOIT: low–medium (learners freeze or go straight-tone; coverage requirement).
RETENTION: yes; the dark window can be lengthened to a whole phrase and moved to the next day.
G/L/N: high / medium–high / medium.

**M12 · GRADUATED INTERVAL RECALL** (MEMORY)
SOURCE: language · Pimsleur graduated interval recall `[V]` · an item is recalled at expanding intervals (seconds → minutes → next lesson → days), timed just before forgetting.
ABSTRACT: the same item is requested after expanding delays; the delay is the difficulty.
ACTION: hear a note (or interval); wait (silence or distraction); reproduce it; the item returns later in the session and tomorrow.
LOOP: terminal, coarse ("closer than last time / further"); success = inside coarse band after delay; failure = direction of miss.
REPEAT: the item becomes "yours"; the schedule creates anticipation.
DIFFICULTY: delay (0, 1, 3, 5, 10, 30 s, next session, next day); interference (a distractor note inside the delay); reference timbre.
IMPROVES (source): retention of items.
VOCAL: pitch memory as play — and a direct L1 measurement.
CV: memory after reference removal (SAFE-DESCRIPTIVE).
MEAS: settled center vs reference at each delay; decline curve (C014).
REF: initial.
FB: terminal, coarse.
TRANSFER: assumes memory for a heard pitch is trainable/retainable (unknown); as measurement it is SUPPORTED (C014).
EVIDENCE: SUPPORTED as instrument; UNKNOWN as training.
SCI-RISK: the reproduced center is compared to a reference whose perceived pitch is itself uncertain for real voices (H010) — use synthetic or fixed-timbre references for the research variant.
EXPLOIT: low (nothing continuous).
RETENTION: yes by definition.
G/L/N: medium / high / high.

**M13 · ADAPTIVE SEQUENCING BY RESPONSE** (MEMORY / PROGRESSION)
SOURCE: perceptual learning · Kellman ARTS `[V]`, Larkwire bird families `[V partial]` · items are rescheduled from accuracy and response time ("successful effort"); confusable families are trained together.
ABSTRACT: the schedule of items is computed from the learner's responses; confusable items are deliberately interleaved.
ACTION: short trials (sing or judge); the system decides what comes next.
LOOP: terminal per trial; the visible loop is "what comes next".
REPEAT: trials are 2–5 s; sessions are dense.
DIFFICULTY: item mix, interval between repeats, confusability.
IMPROVES (source): categorisation accuracy and fluency; documented in radiology/maths perceptual learning.
VOCAL: scheduling of degrees/intervals/targets by coarse reproduction success and by latency to arrival; confusable intervals (M3/m3, P4/TT) interleaved.
CV: any SAFE variable; the mechanic is the scheduler.
MEAS: coarse success, time-to-band.
REF: initial per item.
FB: terminal.
TRANSFER: assumes perceptual-learning schedules transfer to production scheduling (unknown; C015/C017 show perceptual gains are real and durable, C016 shows production did not follow in one small study — FW9 flagged).
EVIDENCE: PLAUSIBLE for perception items; EXPERIMENTAL for production items.
SCI-RISK: scheduling on noisy per-trial measures (Goodhart); needs coarse, repeated criteria.
EXPLOIT: low.
RETENTION: yes (the scheduler *is* delayed testing when it spaces items across days).
G/L/N: low–medium / high / medium.

**M14 · TEMPORAL OCCLUSION** (PREDICTION)
SOURCE: sport · gameSense, uHIT pitch recognition `[V]` · video is cut before ball flight; the athlete predicts pitch type/location; occlusion moves earlier with success.
ABSTRACT: predict the continuation from partial evidence; the cut point is the difficulty.
ACTION: hear the first part of a phrase; it stops; sing the continuation (or the final note); then hear the real continuation.
LOOP: terminal reveal; success = continuation shared contour/final relation with the real one (coarse); failure = you hear the difference.
REPEAT: "finish the sentence" is inherently satisfying; phrases vary.
DIFFICULTY: cut point (later = easier), phrase familiarity, tonal strength of context, number of plausible continuations.
IMPROVES (source): anticipation from early cues (meta-analytic support in sport).
VOCAL: exercises tonal expectation (C043) and sequence memory (L4) in production; unfamiliar phrases keep it honest.
CV: response to a gesture, sequence movement (SAFE as interaction).
MEAS: contour and final-note relation of the sung continuation; coarse.
REF: intermittent (the fragment).
FB: terminal, musical (you hear the model afterwards).
TRANSFER: assumes prediction of continuations relates to melodic production (C010 higher-order perception correlates with singing; FW7 flagged for song claims).
EVIDENCE: PLAUSIBLE.
SCI-RISK: continuations are not uniquely "correct"; scoring must be coarse or absent.
EXPLOIT: low.
RETENTION: yes with untrained phrases.
G/L/N: high / medium / high.

**M15 · GROWING ECHO** (IMITATE / SEQUENCE)
SOURCE: toys/games · Simon `[K]`, Space Channel 5 "up, down, chu" `[V partial]` · the model plays a growing sequence; the player repeats; one more element each round.
ABSTRACT: imitation with length as difficulty; failure ends the round at a known length.
ACTION: repeat a sung sequence that grows by one note per round.
LOOP: terminal per round; success = coarse reproduction of all notes (relative pitch, not absolute); failure = the length reached (a number that is honest and about capacity, not cents).
REPEAT: "how far can I get" is a classic loop; sequences are novel each run.
DIFFICULTY: length, interval size, tempo, tonal vs atonal, timbre of the model.
IMPROVES (source): sequence memory span.
VOCAL: pitch STM span in production — C009 says span and imagery predict imitation; C006 says poor singers compress intervals in 4-note imitation.
CV: sequence movement, interval relation (SAFE-DESCRIPTIVE).
MEAS: per-note settled centers relative to the first note; contour.
REF: intermittent (the model each round).
FB: terminal.
TRANSFER: assumes span in imitation relates to melodic singing (C009 correlation) — no song claim (FW7).
EVIDENCE: PLAUSIBLE (C006, C009).
SCI-RISK: model timbre matters (C047); keep it a condition.
EXPLOIT: low.
RETENTION: yes (span retest, untrained sequences).
G/L/N: high / medium / low–medium.

**M16 · EARN THE RIGHT TO STOP IMITATING** (IMITATE → GENERATIVE)
SOURCE: rhythm games · PaRappa Cool Mode `[V]` · two consecutive "Cool"-rated lines unlock Cool Mode: the teacher stops demonstrating and the player freestyles from alternate phrases; poor play degrades the stage comically (Bad/Awful).
ABSTRACT: faithful imitation buys freedom; freedom is the reward, and the world's state is the score.
ACTION: echo a phrase faithfully N times; the model then falls silent and the learner must answer freely inside the frame.
LOOP: coarse per echo (in frame / not); in free mode nothing is scored except frame membership (stays in key, ends on a stable note); the world brightens or dims.
REPEAT: the freedom phase is the fun; earning it is the practice.
DIFFICULTY: N faithful echoes required, phrase length, frame strictness (key only → key + ending degree).
IMPROVES (source): pattern imitation, then improvisational timing.
VOCAL: imitation with an exit into improvisation; musical reward instead of points.
CV: sequence movement, response to gesture (SAFE); free phase unscored.
MEAS: coarse echo fidelity; frame membership in free phase.
REF: intermittent → none.
FB: intermittent coarse → concurrent musical (world state).
TRANSFER: assumes imitation and free answering share L4 (unknown).
EVIDENCE: EXPERIMENTAL (L4 unassigned relations).
SCI-RISK: rating the free phase (FW16) — do not.
EXPLOIT: low.
RETENTION: yes — "can you still earn Cool on yesterday's phrase, blind?"
G/L/N: high / medium / high.

**M17 · SHADOWING** (IMITATE / TRACK)
SOURCE: language · shadowing (Arguelles) `[V partial]` · the learner speaks along with native audio simultaneously or with a very short lag, copying rhythm and intonation in real time.
ABSTRACT: simultaneous imitation with a controllable lag; the model never stops.
ACTION: sing along with a melodic model at lag 0, then 0.5 s, then 1 s, then after it stops.
LOOP: concurrent auditory (own voice against the model); success = staying with it; failure = audible.
REPEAT: pleasant (singing with), low cognitive load.
DIFFICULTY: lag (0 → phrase-length), model loudness (fade), model timbre, phrase length.
IMPROVES (source): prosody imitation (practitioner-reported; research mixed).
VOCAL: doubling with a model — exactly the C007 condition (melodic doubling did not help poor singers in one study). The lag ladder turns simultaneous doubling into delayed imitation.
CV: sequence movement, trajectory (descriptive).
MEAS: settled centers relative to the model, lag.
REF: continuous → intermittent → none (the ladder).
FB: concurrent auditory → terminal.
TRANSFER: assumes the lag ladder converts an acquisition aid into retained skill (H006; E-E).
EVIDENCE: EXPERIMENTAL (H006, H012; C007 caution for mapping-limited learners).
SCI-RISK: FW10/FW11 — the mechanic *is* the reference-mode experiment; must be run as conditions.
EXPLOIT: low.
RETENTION: yes (lag = ∞ tomorrow).
G/L/N: medium / medium / medium.

**M18 · CONTINGENT COMPANION** (CALL & RESPONSE / AGENT)
SOURCE: developmental biology · Goldstein, King & West 2003 `[V]`: caregivers' responses contingent on babbling changed infant vocalisations vs yoked non-contingent responses; zebra finch juveniles self-trigger tutor playback and learn better from live tutors `[V]`.
ABSTRACT: another agent responds *only* to the learner's vocal acts, immediately and socially; the learner controls exposure to the model.
ACTION: the learner sings; a musical companion answers only when a coarse control event happens (a settled note held ≥1 s inside a wide band; a clear direction change; an answer ending on the frame's degree); the learner can ask the companion to "say it again" (self-triggered reference).
LOOP: contingent, immediate, musical (the companion's phrase is the feedback); no numbers; failure = silence or a puzzled phrase.
REPEAT: conversation; the companion's answers vary and build on the learner's material.
DIFFICULTY: what counts as an event (from "any stable note" to "a stable note in relation"), companion delay, number of "say it again" allowed.
IMPROVES (source): maturity of vocalisations in infants; song imitation accuracy in birds.
VOCAL: the closest thing found to "voice as conversation"; also a self-controlled-reference condition.
CV: hold (event), response to gesture, interval relation (SAFE).
MEAS: event detection on settled centers; relation to companion's last note.
REF: intermittent, learner-triggered.
FB: concurrent musical.
TRANSFER: assumes contingency drives adult vocal change (unknown; infant/bird evidence is not adult-singer evidence); self-controlled feedback ≈0 in limb tasks (C050) is a caution against the "on demand" part.
EVIDENCE: PLAUSIBLE for engagement; UNKNOWN for learning.
SCI-RISK: over-claiming from developmental analogies.
EXPLOIT: low–medium (any stable note triggers a reply → contingency must be relational).
RETENTION: yes — "the companion asks you for yesterday's phrase".
G/L/N: high / medium / high.

**M19 · LOCK-ON PARTS** (RELATIONAL / SOCIAL)
SOURCE: music games · Rock Band 3 harmonies `[V]` · the game locks onto whichever part a singer starts on, tracks it, scores per phrase; bonus when all singers nail the phrase; freestyle sections.
ABSTRACT: the system infers *which* relation you are singing and evaluates the relation, not an absolute target; success is shared.
ACTION: sing one of several harmony parts against others (recorded or live); the system follows the part you chose.
LOOP: per phrase, coarse; success = the chord holds; failure = the chord thins (musical).
REPEAT: harmony singing is its own reward.
DIFFICULTY: number of parts, part proximity, whether parts move in parallel or contrary motion.
IMPROVES (source): part holding in ensemble.
VOCAL: relative-part singing with octave tolerance and phrase-level judgement.
CV: interval relation, hold through perturbation (SAFE-DESCRIPTIVE / event).
MEAS: settled center relative to the other parts (which are known), per phrase.
REF: continuous (other voices) — FW10/FW11 flagged; H012 for mapping-limited learners.
FB: concurrent musical + terminal per phrase.
TRANSFER: assumes ensemble part holding is a separable, trainable behaviour (H014 phenotype "ensemble" — hypothesis).
EVIDENCE: EXPERIMENTAL (H006, H012, H014).
SCI-RISK: solo vs unison accuracy is contradictory in children (C048); never claim that group singing improves accuracy.
EXPLOIT: low (no numbers); medium if a per-part meter is added.
RETENTION: partly — sing the part alone tomorrow (blind).
G/L/N: high / medium / medium.

**M20 · AUTO-HARMONISED VOICE** (GENERATIVE / SOUND-CONSEQUENCE)
SOURCE: music toys · Blob Opera `[V]` · four blobs; vertical drag = pitch, horizontal = vowel; a model harmonises the other voices to the one you move.
ABSTRACT: whatever you do is embedded in a harmonised whole; the reward is that it sounds like music.
ACTION: sustain, slide, leap; the system harmonises.
LOOP: concurrent musical; there is no failure.
REPEAT: pure play; recording and sharing.
DIFFICULTY: none by default; optional: harmony only locks when you settle.
IMPROVES (source): nothing claimed; exploration.
VOCAL: the learner's sustained or moving note becomes the lead of a harmonised ensemble; stability makes the harmony bloom, instability makes it shimmer.
CV: hold, direction (SAFE).
MEAS: settled center to choose the harmony; coarse.
REF: none (the harmony follows you) — note: this is the *opposite* of a reference.
FB: concurrent musical.
TRANSFER: none assumed; the auto-harmoniser forgives everything, so nothing about accuracy is exercised unless the harmony is made contingent on a control event (M18).
EVIDENCE: UNKNOWN for learning; SUPPORTED for engagement (as a toy).
SCI-RISK: presenting it as training.
EXPLOIT: none.
RETENTION: not natively; can host M12 ("bring the chord back").
G/L/N: high / low (alone) / medium.

**M21 · BEATS** (SOUND-CONSEQUENCE / RELATIONAL)
SOURCE: instrument tuning · piano-tuner beat counting; barbershop "lock and ring" `[K]` · the tuner listens to beats between two tones and slows them to zero; barbershop quartets tune to just intervals until the chord "rings".
ABSTRACT: the error is a physically audible rate (beats/s); no display; the goal state is audible as silence-of-beats or as ring.
ACTION: sing against a sustained tone; slow the beats; when they vanish, the tone opens into a chord (musical reward).
LOOP: concurrent auditory; success = beats gone → chord; failure = beats persist (rate = magnitude, but felt, not read).
REPEAT: the ring is addictive; every interval has its own ring.
DIFFICULTY: interval (unison → octave → fifth → third), reference loudness, vibrato tolerance, timbre similarity (beats are clearest with similar spectra).
IMPROVES (source): intonation by ear in tuners and quartets (practice-reported).
VOCAL: a no-meter, no-note-name mechanic. Caveats are physical: vibrato ±20 c produces beating at the vibrato rate; breathy tone weakens beats; headphones are required to avoid mic feedback, and a real-time beat display is *not* needed — the ear is the sensor.
CV: interval relation, hold (SAFE); precision is implied but never displayed.
MEAS: none required for play; for research, settled center vs reference.
REF: continuous (the tone) — FW10/FW11/FW12/FW13 flagged: no evidence drones help or harm singers (C046 instruments null, Graveyard).
FB: concurrent auditory.
TRANSFER: assumes hearing beats teaches anything about singing without the tone (unknown); risk that learners adopt straight tone as a strategy.
EVIDENCE: UNKNOWN for singers (H006); PLAUSIBLE as sound-consequence design.
SCI-RISK: this mechanic is the drone question in game form; it must be run as a condition.
EXPLOIT: low (nothing numeric); the "exploit" is straight-tone.
RETENTION: partly — "sing the interval, then the tone comes in and you hear whether it rings" = delayed check.
G/L/N: high / unknown / high.

**M22 · SYMPATHETIC RESONANCE** (SOUND-CONSEQUENCE / MEMORY)
SOURCE: acoustics/pedagogy · singing into a piano with the sustain pedal down; strings sharing partials with your voice ring on `[K]` · the environment answers in proportion to spectral match; the ring outlasts the voice.
ABSTRACT: the environment stores and returns your pitch; matching is heard as the environment waking up.
ACTION: sing; a virtual resonator bank (tuned to a scale, a chord, or yesterday's notes) rings where you match; a resonator "stays awake" for a while and must be re-sung to keep it alive.
LOOP: concurrent auditory (ring strength) + persistence (a resonator you woke keeps ringing after you stop; this is the memory hook).
REPEAT: waking things is satisfying; keeping a room alive is a goal that spans minutes and days.
DIFFICULTY: resonator bandwidth (coarse → narrower, but never below 25 c effective), decay time (memory delay), number of resonators, whether resonators are silent until hit (hidden targets) or humming faintly (initial reference).
IMPROVES (source): pedagogical claim only (teachers use it for "placement"); no evidence.
VOCAL: the only mechanic found that is simultaneously no-meter, no-note-name, sound-consequence, memory-bearing, and research-producing (which resonators are re-found after delay).
CV: target acquisition, hold, memory after reference removal, range exploration (all SAFE/SAFE-DESCRIPTIVE).
MEAS: f0 → resonator excitation (internal); logged as settled-center hits.
REF: none (hidden) or initial (faint hum) — designer's choice = experimental condition.
FB: concurrent auditory, non-numeric.
TRANSFER: no claim; a simulated resonator responds to f0 and its harmonics (FW3 minor; octave/fifth partials will excite resonators — this is physically honest and also an exploit).
EVIDENCE: UNKNOWN for learning; SUPPORTED as feasible (f0 + harmonic excitation is trivial to compute).
SCI-RISK: designers narrowing resonator bandwidth = FW1 creep.
EXPLOIT: low–medium (harmonic excitation; fixed by weighting the fundamental).
RETENTION: yes — "which resonators can you wake tomorrow without hearing them first?"
G/L/N: high / medium / high.

**M23 · SING THE NUMBERS** (RELATIONAL)
SOURCE: music pedagogy · Improvise for Real ("sing the numbers"), movable-do solfège `[K]` · the learner sings scale degrees by number relative to a tonal centre; melodies are internalised as degree sequences.
ABSTRACT: every target is a relation to a home; nothing absolute is asked.
ACTION: a home is established (heard once); the learner is asked for degrees ("5", "3", "7→1") and sings them.
LOOP: terminal coarse ("that was 5"; "a bit high for 5"); success = coarse category hit; failure = neighbour category named (never cents).
REPEAT: numbers become a language; melodies can be dictated in numbers.
DIFFICULTY: distance from home, chromatic degrees, changing home (transposition), delay since home was heard.
IMPROVES (source): relative-pitch fluency (practitioner-reported; consistent with C037 categorical perception in musicians).
VOCAL: interval control expressed as categories — matches how musicians hear (C037) and what judges track (C029).
CV: interval relation (SAFE-DESCRIPTIVE), memory of home (L1).
MEAS: settled center relative to the stored home; category classification with wide margins.
REF: initial (home) → intermittent (home re-sounded on request) → none.
FB: terminal categorical.
TRANSFER: assumes degree control relates to melodic production (C029; H004 says gains bind to trained relations; consistent practice benefits intervals — C025 single old study, H008).
EVIDENCE: PLAUSIBLE (C025, C029, C037).
SCI-RISK: category boundaries near ±50 c are ambiguous (firewall: nearest-note classification misleading near ±50 c).
EXPLOIT: low.
RETENTION: yes (home from memory next day = also an anchor test, C013).
G/L/N: medium / medium–high / low–medium.

**M24 · QUESTION → ANSWER** (CALL & RESPONSE / RELATIONAL)
SOURCE: music pedagogy · Dalcroze question–answer, jazz trading fours `[K]` · the teacher plays a phrase ending away from home (question); the student answers with a phrase that resolves.
ABSTRACT: the learner's output must *complete* the input, not copy it; resolution is the success state and is musical.
ACTION: hear a question; sing an answer that ends on home (or on the requested degree).
LOOP: musical; success = the answer resolves (final note in coarse relation to home) and the accompaniment cadences; failure = the accompaniment hangs unresolved (tension is the feedback).
REPEAT: dialogue; questions vary endlessly.
DIFFICULTY: question length, tonal ambiguity, required ending degree, delay before the answer may start.
IMPROVES (source): tonal sense and phrase production (pedagogical tradition; no controlled evidence found).
VOCAL: the "tension → resolution" primitive; also a natural home for coarse final-note measurement.
CV: response to gesture, interval relation (SAFE); the body of the answer is unscored.
MEAS: final settled center vs home; contour descriptively.
REF: intermittent (question).
FB: terminal musical.
TRANSFER: assumes phrase completion exercises L4 and tonal expectation (C043) — no song claim (FW7).
EVIDENCE: PLAUSIBLE (C043, C044 modest priming).
SCI-RISK: rating "good answers" (FW16) — only frame membership is judged.
EXPLOIT: low.
RETENTION: yes (unfamiliar questions tomorrow).
G/L/N: high / medium / medium.

**M25 · KOCH: FEW ITEMS, FULL SPEED** (SEQUENCE / PROGRESSION)
SOURCE: Morse code · Koch method `[V]` · start at full target speed with two characters; add one character when copy ≥90%; never slow the characters down.
ABSTRACT: keep the *unit* at real speed from day one; grow the *vocabulary* instead of slowing the units.
ACTION: sing calls built from two degrees at musical tempo; a third degree is added when 2-degree calls are reproduced consistently (coarse, across ≥4 repeats).
LOOP: terminal per call (coarse); the visible loop is the vocabulary growing.
REPEAT: new degrees are events; melodies generated from the vocabulary are the play.
DIFFICULTY: vocabulary size, call length, tempo held constant.
IMPROVES (source): recognition at speed without a "slow-speed plateau".
VOCAL: opposes "sing one note slowly for a month"; everything is at musical tempo; the item set grows.
CV: interval relation, sequence movement (SAFE-DESCRIPTIVE).
MEAS: consistency across repeats per call; coarse categories.
REF: initial (home) per session.
FB: terminal.
TRANSFER: assumes item-specific learning accumulates into a usable vocabulary (H004 supports specificity; FW6/FW7 flagged for phrase/song claims; every newly added degree is an *untrained item* probe for E-B).
EVIDENCE: PLAUSIBLE (H004, C025).
SCI-RISK: the 90% criterion must not be "90% of frames inside ±10 c" (FW2); it is "≥4 of 5 calls in the coarse category".
EXPLOIT: low.
RETENTION: yes (vocabulary retest next day, blind).
G/L/N: medium / medium–high / high.

**M26 · FARNSWORTH GAPS** (SEQUENCE / MEMORY)
SOURCE: Morse code · Farnsworth timing `[V]` · characters are sent at full speed, but the spaces between them are lengthened; spacing shrinks as the learner improves.
ABSTRACT: keep the unit real; stretch the *silence* between units; silence is where planning and memory live; the gap is the difficulty.
ACTION: sing a known melody at natural note speed but with long silences between notes (2–5 s); the gaps shorten over sessions until the melody is whole.
LOOP: terminal per note (coarse relation to the previous note); the melody "reassembles" as gaps shrink — audible progress.
REPEAT: hearing the tune emerge from fragments is the reward.
DIFFICULTY: gap length (longer = more memory load, more planning time), melody familiarity, whether a distractor sounds in the gap.
IMPROVES (source): copying at speed without slow habits.
VOCAL: a memory-and-planning ladder hidden inside a song; each gap is a delay trial (L1) and each note after a gap is a *prepared onset* (E-D: instruction/strategy-controlled onsets fall out of this naturally).
CV: memory after reference removal, interval relation, sequence movement (SAFE-DESCRIPTIVE).
MEAS: settled centers per note; delay per gap; onset shapes stored for research.
REF: initial (the melody heard once) or none (known song).
FB: terminal coarse.
TRANSFER: assumes gap-structured practice supports whole-melody production (unknown; FW7 flagged if claimed for songs).
EVIDENCE: UNKNOWN for singing; PLAUSIBLE by analogy; SUPPORTED as delay instrument (C014).
SCI-RISK: none if unscored beyond coarse.
EXPLOIT: low.
RETENTION: yes (gap = next day).
G/L/N: medium / medium–high / high.

**M27 · MASTER MODE — EARNED, REVERSIBLE DARKNESS** (BLIND / ADAPTATION)
SOURCE: instrument learning · Rocksmith Dynamic Difficulty + Master Mode `[V]` · up to 30 density levels per phrase adjusted by measured accuracy; when a phrase is played well enough the note highway disappears and it must be played from memory; it returns when accuracy drops.
ABSTRACT: assistance is removed per item, after success, and comes back on failure; removal is a *state of the item*, not a level of the player.
ACTION: sing phrases with a guide (audible or visible); a phrase whose coarse accuracy is stable across repeats loses its guide; if it degrades, the guide returns.
LOOP: intermittent coarse per phrase; the visible loop is the guide appearing and vanishing.
REPEAT: "make it disappear" is a goal per phrase; the return of the guide is information, not punishment.
DIFFICULTY: fade criterion (how many consistent repeats), what fades first (visual guide, then audible guide, then the backing), density of the phrase.
IMPROVES (source): playing from memory (player-reported); no controlled evidence.
VOCAL: the per-item fading regime; contrasts with scheduled fading (M33).
CV: sequence movement, memory after reference removal (SAFE-DESCRIPTIVE).
MEAS: coarse consistency per phrase across repeats; performance with guide vs without, logged separately.
REF: continuous → none, per item.
FB: concurrent → none, per item.
TRANSFER: assumes practice under earned removal supports retention (H009); if the fade criterion uses in-feedback performance, FW4/FW5 are in play — the criterion must be *feedback-off* repeats.
EVIDENCE: EXPERIMENTAL (H002, H009 — this is E-A in game form).
SCI-RISK: conflating "guide gone" with "learned".
EXPLOIT: medium — learners memorise the visual pattern instead of the sound (fix: fade the visual first, keep the audible; vary key).
RETENTION: yes — "phrases that were dark yesterday: are they still dark today?" is the 24 h test.
G/L/N: high / high (if H009 holds) / high.

**M28 · LOOP AND RAMP** (SEQUENCE)
SOURCE: instrument learning · Rocksmith Riff Repeater `[V]`; Anytune/Amazing Slow Downer `[K]` · isolate a phrase, loop it, slow it, speed it up step by step.
ABSTRACT: isolate → repeat → ramp one variable (tempo).
ACTION: loop a 3–5-note phrase; tempo ramps up 5% per clean repeat.
LOOP: terminal per repeat (coarse); the ramp is the visible progress.
REPEAT: the ramp is compelling for a few minutes; risk of grinding.
DIFFICULTY: tempo; phrase length.
IMPROVES (source): fluency of a fixed passage.
VOCAL: fluency of a phrase at tempo — but static repetition is an anti-pattern (§17); needs variation (key, starting degree).
CV: sequence movement (SAFE-DESCRIPTIVE).
MEAS: coarse per-note categories at each tempo.
REF: intermittent.
FB: terminal.
TRANSFER: item-specific (H004); consistent practice helped intervals in one old study (C025).
EVIDENCE: PLAUSIBLE (C025, H004).
SCI-RISK: FW6 if "phrase fluency" is sold as melody skill.
EXPLOIT: medium (grinding).
RETENTION: yes.
G/L/N: low–medium / medium / low.

**M29 · FOG OF WAR MAP** (EXPLORATION)
SOURCE: games · Metroidvania map reveal, fog of war `[K]` · the map fills in where you have been; no goals are imposed; unexplored regions invite.
ABSTRACT: progression = territory revealed by presence, not by score.
ACTION: sing anywhere; the map of your voice fills in (register, comfortable regions, edges); leaps between islands draw passages.
LOOP: none evaluative; the reveal is the feedback.
REPEAT: curiosity; the edges of the map.
DIFFICULTY: none imposed; the learner sets it.
IMPROVES (source): spatial knowledge.
VOCAL: range and register cartography; passages (leaps you have made) and holds (places you stayed) are landmarks; wide-range exposure has one supporting study (C018: octave-range matching beat fifth-range).
CV: range exploration (SAFE-NOW); direction; duration.
MEAS: visited pitch regions (coarse), durations, self-reported comfort tags.
REF: none.
FB: concurrent, non-evaluative (the reveal).
TRANSFER: assumes wide-range exposure is useful (C018 immediate; H008) — no claim in the product.
EVIDENCE: PLAUSIBLE (C018).
SCI-RISK: physiological — no incentives to push extremes (edges are shown, never rewarded).
EXPLOIT: none.
RETENTION: partly — "is the island still where you left it?" (revisit an anchor after a day = C013-style anchor test).
G/L/N: medium–high / low–medium / high.

**M30 · ONSIGHT / FLASH / REDPOINT** (INFORMATION LABELLING)
SOURCE: climbing · onsight (first try, no information), flash (first try, with information), redpoint (after practice), projecting `[V]` · every ascent is labelled by prior knowledge, and the label is the achievement.
ABSTRACT: the *information condition* of an attempt is named and honoured; a logbook of conditions replaces a score.
ACTION: every item (phrase, interval, hunt) can be attempted onsight (never heard, no reference), flash (heard once), or redpoint (practised); the learner chooses which to try and the log records it.
LOOP: terminal; success in a condition earns the label for that item; failure just leaves the item open.
REPEAT: onsight attempts are scarce (one per item per day), which makes them precious.
DIFFICULTY: information condition; item novelty.
IMPROVES (source): nothing — it is a taxonomy; but it drives climbers to seek harder routes honestly.
VOCAL: the cleanest research-instrument transplant in the pass: onsight = untrained item, no reference; flash = initial reference; redpoint = trained item; an "onsight" of yesterday's redpoint = 24 h retention trial.
CV: any SAFE variable.
MEAS: existing coarse measures, plus condition metadata.
REF: per condition.
FB: per condition (onsight: none until done).
TRANSFER: no assumption; the labels are what allow transfer to be measured.
EVIDENCE: SUPPORTED (as instrumentation; §9 "safe to build": item registry with training/test overlap flags).
SCI-RISK: none.
EXPLOIT: low.
RETENTION: yes, by construction.
G/L/N: medium / (instrument) / high.

**M31 · KNOWLEDGE-GATED WORLD** (PROGRESSION)
SOURCE: games · Outer Wilds `[K]` · nothing levels up; the only progression is what the player knows; every loop resets, knowledge persists.
ABSTRACT: progression is gated by demonstrated retained ability, not by accumulated points.
ACTION: areas/instruments/companions open only when a *blind* demonstration succeeds (e.g., wake three resonators unheard; answer a question phrase onsight).
LOOP: terminal at the gate; the world does not count points.
REPEAT: the world is the reward; gates are rare and meaningful.
DIFFICULTY: what the gate asks (delay, novelty, absence of reference).
IMPROVES (source): understanding.
VOCAL: the "no fake mastery" progression: gates require retention/transfer events (§14), never in-feedback performance.
CV: any; the gate is the mechanic.
MEAS: blind coarse success on untrained items.
REF: none at gates.
FB: terminal.
TRANSFER: assumes only that blind, delayed, untrained-item success is the honest currency (C028: it is the missing data).
EVIDENCE: SUPPORTED as a progression rule; EXPERIMENTAL as a learning mechanism (H002).
SCI-RISK: gates that are too hard stall players; gates on noisy single trials (fix: repeated coarse trials).
EXPLOIT: low.
RETENTION: yes — gates *are* retention tests.
G/L/N: high / high (as structure) / high.

**M32 · ERROR AUGMENTATION** (ADAPTATION — fun-but-dangerous)
SOURCE: rehab · Patton & Mussa-Ivaldi error-augmenting force fields `[V]` · the robot pushes the limb further off the trajectory than its own error; adaptation to the amplified error drives learning.
ABSTRACT: exaggerate the error signal so the internal model adapts faster.
ACTION: sing with amplified feedback: visual gain ×2–×4 (the cursor moves twice as far), or auditory pitch-shifted feedback that magnifies deviation.
LOOP: concurrent, exaggerated.
REPEAT: dramatic; the world overreacts.
DIFFICULTY: gain.
IMPROVES (source): reaching adaptation in stroke patients (systematic review support, heterogeneous).
VOCAL: auditory version interacts with automatic compensation (C001: onset compensation cannot be suppressed; C002 trained singers respond differently) — the learner will compensate whether they want to or not.
CV: approximate center (but the loop requires fine tracking).
MEAS: per-frame cents (visual) or real-time f0 (audio shift).
REF: continuous.
FB: concurrent, amplified.
TRANSFER: assumes adaptation under amplified feedback carries into unaided singing (unknown; FW4 doubled for visual; for audio, after-effects exist in altered-feedback paradigms but no training evidence in the canonical base).
EVIDENCE: EXPERIMENTAL at best; the visual variant is the most FW1/FW4-dependent mechanic in the atlas.
SCI-RISK: high — it teaches the meter's gain.
EXPLOIT: highest.
RETENTION: only as an experiment with blind tests.
G/L/N: high / unknown / medium.

**M33 · ASSIST-AS-NEEDED** (ADAPTATION)
SOURCE: rehab robotics · Lokomat / MIT-Manus assist-as-needed controllers `[V]` · the robot measures tracking error and reduces its assistance as the patient improves, forcing active effort.
ABSTRACT: scheduled, performance-linked withdrawal of assistance; the schedule is continuous, not per item.
ACTION: the reference (loudness of the target tone, duration of the cue, brightness of the guide) fades continuously as coarse performance stabilises; it re-strengthens on sustained failure.
LOOP: concurrent, slowly changing; success = the world gets quieter and you stay.
REPEAT: subtle; better as a background regime than as a visible goal.
DIFFICULTY: fade rate; floor of assistance.
IMPROVES (source): active participation, gait outcomes (clinical).
VOCAL: the scheduled-fade counterpart to M27's earned fade; together they are the two arms of the fading experiment (H009).
CV: any SAFE variable.
MEAS: coarse performance with the current assistance level, logged with the level.
REF: continuous → intermittent → none (scheduled).
FB: concurrent → none (scheduled).
TRANSFER: assumes performance-linked fading yields retention (H009; FW5 flagged: the fade is driven by in-assistance performance).
EVIDENCE: EXPERIMENTAL (H009, H006).
SCI-RISK: FW4/FW5 baked into the controller.
EXPLOIT: low–medium.
RETENTION: yes (assistance = 0 tomorrow).
G/L/N: low–medium / medium / medium.

**M34 · FADE THE LURE, PROOF THE 3 D'S** (ADAPTATION / TRANSFER)
SOURCE: animal training · clicker shaping, lure fading, proofing with distance / duration / distraction `[V]` · successive approximation, criteria raised one at a time, the lure is removed once the behaviour is reliable, then the behaviour is "proofed" by varying one dimension at a time.
ABSTRACT: prompt → cue → no prompt; then generalise by varying one context dimension at a time while holding the rest.
ACTION: a note/interval is first given as a tone (lure), then as a name/degree (cue), then asked cold; once reliable it is proofed across vowel, register, tempo, backing texture, one at a time.
LOOP: terminal coarse per trial; "jackpot" (a bigger musical event) on a first cold success.
REPEAT: the proofing ladder is a visible structure with many small wins.
DIFFICULTY: prompt level; then one context dimension at a time.
IMPROVES (source): reliability and generalisation of behaviour (robust practitioner and lab basis in operant learning).
VOCAL: a transfer-probe generator; every proofing step is a controlled context change (vowel/register/timbre transfer is listed under WE DO NOT KNOW).
CV: target acquisition, interval relation, memory after reference removal (SAFE).
MEAS: coarse success per prompt level and per context; overlap flags.
REF: initial → none.
FB: terminal.
TRANSFER: assumes context-varied practice builds transfer (H004/H008 task-dependent; unknown for voice) — no claim in product; the ladder *measures* it.
EVIDENCE: PLAUSIBLE (H004); SUPPORTED as instrument (E-B design element: overlap/novelty control).
SCI-RISK: variable-practice benefits are task-dependent (H008); do not assume.
EXPLOIT: low.
RETENTION: yes (proofing includes "tomorrow" as a dimension).
G/L/N: medium / high / medium–high.

**M35 · REWIND** (ERROR RECOVERY)
SOURCE: racing games · Forza rewind `[V]` · hold a button to reverse time to before the crash and continue; unlimited but with cooldown.
ABSTRACT: failure is undone locally; the run continues; the count of rewinds is descriptive.
ACTION: during a phrase, a coarse miss rewinds the accompaniment to the last settled note; the learner re-enters from there.
LOOP: immediate, musical (the music steps back a bar); no red, no number; the phrase "heals".
REPEAT: long phrases become attemptable; the rewind count is a curiosity, not a penalty.
DIFFICULTY: rewind cooldown; how far back it goes (one note vs one bar).
IMPROVES (source): completion rates, willingness to attempt hard tracks.
VOCAL: the primary "failure that feels good" device for sequences; also a clean source of *repeated attempts of the same transition* for research.
CV: sequence movement, target acquisition (SAFE).
MEAS: coarse transition success; rewinds per transition.
REF: intermittent.
FB: intermittent (the rewind itself).
TRANSFER: none assumed.
EVIDENCE: SUPPORTED as usability; UNKNOWN for learning.
SCI-RISK: none.
EXPLOIT: low (rewinds are cheap by design; the count is not scored).
RETENTION: yes (rewind-free blind run tomorrow).
G/L/N: high / low–medium / medium.

**M36 · CALL YOUR SHOT** (PREDICTION / JUDGE)
SOURCE: marksmanship · calling the shot `[V]` · before looking, the shooter states where the round went from the sight picture at the break; the discrepancy diagnoses process faults.
ABSTRACT: the learner predicts the outcome before the reveal; the score is the *agreement* between prediction and measurement, not the measurement.
ACTION: sing a note/interval; before any reveal, declare "high / low / on" (or pick which note of three was off); then the coarse reveal.
LOOP: terminal; success = prediction matched (regardless of whether the note was on); failure = mismatch (the interesting case).
REPEAT: prediction streaks; being right about being wrong is satisfying.
DIFFICULTY: reveal coarseness, prediction granularity (3 → 5 categories), delay before prediction, masked own-voice condition.
IMPROVES (source): shot diagnosis; self-monitoring.
VOCAL: a metacognitive layer over any production mechanic; directly probes the perception/production dissociation (C004, C005): a learner who predicts well but sings off has a different profile from one who sings off and cannot tell — descriptive, not diagnostic wording.
CV: judge (SAFE as interaction); underlying note any SAFE variable.
MEAS: settled center coarse category + declared category; agreement matrix.
REF: initial or none.
FB: terminal, about the prediction.
TRANSFER: assumes self-prediction is useful (unknown for singing; plausible), and provides E-C-adjacent data without a slider.
EVIDENCE: PLAUSIBLE; SUPPORTED as instrument (judgement tasks logged as attempts are in §9 "safe to build").
SCI-RISK: the "truth" is a coarse measured center whose perceptual validity is itself open (H010) — use wide categories.
EXPLOIT: low–medium (always saying "on" → score agreement with base-rate correction; vary targets so "on" is not the majority).
RETENTION: yes (prediction accuracy blind, next day).
G/L/N: medium–high / medium–high / high.

**M37 · TWO VERSIONS OF YOU** (PREDICTION / PERCEPTION)
SOURCE: perceptual training · 2AFC discrimination tasks; Zarate-style micromelody training (C015) `[K]`; DAW "A/B" comparison `[K]` · the listener chooses which of two stimuli is closer to the target.
ABSTRACT: judge, don't produce; the stimulus is your own recording, unaltered vs shifted.
ACTION: after a phrase, hear two versions of your own take (one as sung, one resynthesised with a note shifted toward or away from the target); pick the one closer to the model.
LOOP: terminal; success = correct choice; failure = the other one.
REPEAT: hearing oneself is compelling; shifts get subtler (down to a floor near lay thresholds, ≈25 c, C033).
DIFFICULTY: shift size (never below ≈25 c for learners), which note, delay.
IMPROVES (source): discrimination — fast and durable (C015, C017).
VOCAL: perception training on own-voice material; explicit FW9 flag: perception gains did not produce vocal gains in the one small study (C016) — the mechanic is honest only if presented as ear play, and it is also an E-G instrument (perceived center of real sung notes with scoops/vibrato: which version do people hear as "on"?).
CV: judge (SAFE).
MEAS: none live; offline resynthesis of captured spans (M1 capture is prerequisite).
REF: initial (model).
FB: terminal.
TRANSFER: perception → production is exactly the unassumed link (FW9).
EVIDENCE: SUPPORTED for perceptual gain; UNKNOWN/weak-null for production (C016).
SCI-RISK: selling it as singing training.
EXPLOIT: low.
RETENTION: yes for perception.
G/L/N: medium / medium (ear) / high.

**M38 · OPEN CALL** (SOCIAL / ASYNC)
SOURCE: social music · Smule open calls `[V partial]` · a singer leaves a recording open; others add their part later; a pitch guide is shown while recording.
ABSTRACT: asynchronous duet; the other voice is fixed, yours is added.
ACTION: add a part to another learner's (or teacher's) take; or leave a question phrase open for others to answer (M24 asynchronously).
LOOP: musical; social response later.
REPEAT: social pull; recordings accumulate.
DIFFICULTY: part proximity; whether the guide is shown.
IMPROVES (source): engagement, not accuracy.
VOCAL: the asynchronous social layer for relational mechanics; the other voice is a continuous reference (FW10/FW11 flagged) unless it is only a question (M24).
CV: interval relation, response to gesture (SAFE).
MEAS: settled centers vs the fixed part.
REF: continuous or intermittent.
FB: terminal, social.
TRANSFER: none assumed; "group singing improves accuracy" is not claimed (C048 contradictory).
EVIDENCE: UNKNOWN for learning.
SCI-RISK: social comparison → meter chasing if a score is attached.
EXPLOIT: medium if scored; low if not.
RETENTION: partly (re-answer the same open call a week later).
G/L/N: medium–high / low / low–medium.

**M39 · GAME OF SKATE** (SOCIAL / IMITATE)
SOURCE: skateboarding/basketball · SKATE, HORSE `[K]` · one player sets a trick; the other must match it or take a letter; the setter must land the trick first.
ABSTRACT: symmetric turn-taking where the challenge is set by a peer who must first demonstrate it *reliably*; difficulty self-balances.
ACTION: player A sings a short phrase twice consistently (coarse consistency is the validity check); player B must reproduce it (relative pitch); miss = a letter; roles alternate.
LOOP: terminal per turn; social; failure = a letter (five letters end the game — honest, capacity-based).
REPEAT: rivalry, invention of phrases, escalating difficulty chosen by players.
DIFFICULTY: set by the players; the "twice consistently" rule keeps it fair.
IMPROVES (source): repertoire under pressure.
VOCAL: the only social mechanic found where *self-consistency* (C011 precision, descriptive) is the entry ticket, and where untrained items are generated by peers.
CV: repeated-attempt consistency, sequence movement, interval relation (SAFE-DESCRIPTIVE).
MEAS: coarse consistency across A's two takes; B's relative reproduction.
REF: intermittent (A's phrase).
FB: terminal.
TRANSFER: none assumed (game); research: peer-generated untrained items (E-B).
EVIDENCE: PLAUSIBLE (C006/C009 for imitation as a measurable behaviour).
SCI-RISK: none beyond social pressure.
EXPLOIT: low (phrases must be reproducible by the setter).
RETENTION: yes ("letters" can be redeemed next day by reproducing the phrase blind).
G/L/N: high / medium / high.

**M40 · TUNING LADDER / LOCK THE CHORD** (COORDINATION)
SOURCE: choral practice · chord-tuning ladders, barbershop tag singing `[K]` · parts enter one by one over a held root; each part adjusts until the chord locks; the lock is heard as ring.
ABSTRACT: cooperative stabilisation where the success state is a shared acoustic event.
ACTION: two to four singers (or one singer with recorded parts) build a chord; the chord "locks" (a musical bloom) when all settled centers are inside coarse relations.
LOOP: concurrent musical; terminal bloom.
REPEAT: the bloom; the next chord.
DIFFICULTY: chord type, voicing spacing, who moves.
IMPROVES (source): ensemble intonation (practice-reported).
VOCAL: cooperative version of M21; requires multi-voice tracking (hard with one mic — feasible with headphones and recorded parts).
CV: interval relation, hold (SAFE).
MEAS: settled center of the live voice vs known recorded parts.
REF: continuous (FW10/FW11).
FB: concurrent musical.
TRANSFER: none claimed (C048).
EVIDENCE: UNKNOWN.
SCI-RISK: measurement of multiple live voices with one mic is not feasible; only "one live + recorded" is.
EXPLOIT: low.
RETENTION: partly.
G/L/N: high / unknown / medium.

**M41 · VOICE AS UNIVERSAL VERB** (GENERATIVE / WORLD)
SOURCE: games · Wandersong (8-direction sing wheel; singing steers, lifts, speaks) `[V]`; One Hand Clapping (pitch = platform height; calibration to personal range; hold and duet puzzles) `[V]`.
ABSTRACT: the voice is the controller for everything; pitch is used as direction and coarse level, calibrated to the player; puzzles are solved by *holding* and by *matching another character*.
ACTION: move, lift, open, speak by singing; hold a note to keep a platform up; match a character's phrase to open a path.
LOOP: concurrent, world-state; failure = the platform sinks (musical/physical, not textual).
REPEAT: the world.
DIFFICULTY: puzzle demands: longer holds, bigger leaps, duets with more notes.
IMPROVES (source): nothing claimed; players report "learning to control my voice" anecdotally.
VOCAL: the existing "voice-controlled environment" idea, but the transferable lesson is which variables the successful products actually use: direction, coarse level, hold duration, duet match — never precision.
CV: direction, hold, target acquisition (coarse) (SAFE-NOW).
MEAS: f0 → coarse level; hold duration.
REF: none / intermittent (character phrases).
FB: concurrent world-state.
TRANSFER: none claimed.
EVIDENCE: UNKNOWN for learning; SUPPORTED that the safe variable set suffices for a full game.
SCI-RISK: designers adding precision puzzles (FW1).
EXPLOIT: low.
RETENTION: partly ("open yesterday's door by singing the character's phrase from memory").
G/L/N: high / low–medium / low (we have it) — included for the calibration and hold/duet lesson.

**M42 · COMIC INSTRUMENT** (GENERATIVE / FAILURE-THAT-FEELS-GOOD)
SOURCE: music toys · Trombone Champ (loose tolerance + farty timbre; misses still sound) `[V]`, Otamatone ribbon `[K]`, theremin `[K]` · continuous controllers whose errors are audible and funny, so failure is expressive rather than silent.
ABSTRACT: failure is rendered as *sound with character*, not as absence or as red.
ACTION: the learner's voice is resynthesised through a comic/expressive instrument (formant shift, cartoon timbre) in a duet with a comic partner; misses become glissandi, honks, wobbles.
LOOP: concurrent auditory; success = the duet sounds "right", failure = it sounds funny (and is still music).
REPEAT: laughter; performing for others.
DIFFICULTY: partner phrase complexity; tolerance width (audible, never numeric).
IMPROVES (source): nothing claimed; Trombone Champ players do get better at riding the line.
VOCAL: lowers the cost of failure below any red display; particularly suited to beginners and to children.
CV: trajectory (descriptive), direction, hold (SAFE).
MEAS: none required for play; f0 → resynthesis.
REF: intermittent (partner).
FB: concurrent auditory.
TRANSFER: none.
EVIDENCE: UNKNOWN for learning; SUPPORTED for "failure feels good".
SCI-RISK: none if unscored.
EXPLOIT: none.
RETENTION: not natively.
G/L/N: high / low / high.

**M43 · WEATHER** (SOUND-CONSEQUENCE / STABILISATION)
SOURCE: meditation biofeedback · Muse soundscape `[V]` · EEG calm → the storm quiets and birds sing; distraction → wind returns; no numbers.
ABSTRACT: an internal state drives an ambient world; the mapping is coarse, slow and non-numeric; the reward is calm.
ACTION: hold a note; while inside a wide hidden band (≥25–50 c) the weather calms; leaving it stirs the wind; nothing is shown.
LOOP: concurrent, slow (seconds), auditory.
REPEAT: calm is pleasant; sessions are short rituals.
DIFFICULTY: band width (hidden, floor 25 c), required calm duration, perturbation (a passing chord).
IMPROVES (source): user-reported calm; EEG neurofeedback evidence is mixed.
VOCAL: the gentlest stabilisation mechanic; visual dependency zero.
CV: hold (SAFE as event).
MEAS: time inside hidden band.
REF: none (a faint tonic hum optional = initial/continuous condition).
FB: concurrent auditory, non-numeric.
TRANSFER: none claimed.
EVIDENCE: PLAUSIBLE as feedback design (H007: bands near compensation sensitivity); UNKNOWN for learning.
SCI-RISK: hidden-band creep (FW1); slow mapping may feel random (prototype question).
EXPLOIT: low.
RETENTION: partly (calm the weather with no hum tomorrow).
G/L/N: medium–high / low–medium / high.

**M44 · LOOP GARDEN** (GENERATIVE / OPEN)
SOURCE: musical toys · Electroplankton Rec-Rec, loop pedals, Tenori-on `[K]` · record short vocal loops; layer; the piece grows from repeated gestures.
ABSTRACT: repetition is composition; each layer is a new attempt at the same gesture, heard against the previous ones.
ACTION: sing a short gesture; it loops; sing it again on top (or a harmony to it); the garden grows.
LOOP: concurrent musical; consistency across layers is *audible* as chorus vs smear.
REPEAT: creation.
DIFFICULTY: loop length; number of layers; whether layers must relate (fifth, octave).
IMPROVES (source): nothing claimed.
VOCAL: repeated-attempt consistency made audible without a meter (layers that agree sound "thick"; layers that disagree sound "wide") — an honest, physical rendering of C011-style precision.
CV: repeated-attempt consistency, interval relation (SAFE-DESCRIPTIVE).
MEAS: settled centers per layer (stored, not shown).
REF: continuous (own earlier layers) — self-reference.
FB: concurrent auditory.
TRANSFER: none.
EVIDENCE: UNKNOWN for learning; SUPPORTED for engagement.
SCI-RISK: none.
EXPLOIT: none.
RETENTION: yes ("add a layer to yesterday's garden").
G/L/N: high / low–medium / high.

**M45 · TECHNIQUE EVENT LABELLING** (DESCRIPTION — with a warning)
SOURCE: karaoke · DAM Seimitsu Saiten DX-G `[V]`: scores pitch, vibrato type/count, kobushi, shakuri (scoop up), fall, stability, expression; live guide melody with the singer's trace and a star that changes colour; JOYSOUND Bunseki Saiten III `[V]`: pitch, stability, long tones, expression, technique counts.
ABSTRACT: expressive gestures are detected and *counted*; a composite score rewards them; the singer sees their trace against the guide in real time.
ACTION: sing a song against a guide; ornaments are detected and displayed.
LOOP: concurrent trace + event icons; terminal composite score.
REPEAT: score chasing (Japan's karaoke culture shows how strong this is).
DIFFICULTY: song.
IMPROVES (source): score on the machine (well-known "how to score 95" guides teach machine-specific technique, i.e., meter chasing at scale).
VOCAL: the detection layer is valuable as *description* (onset types for E-D: scoop vs straight vs fall; vibrato presence as a condition variable; long-tone durations); the *scoring* layer is the cautionary tale: "stability" = within-note spread (no perceptual counterpart, firewall), composite = FW16, expression counts = C030/C031 (ratings are multivariate and judges disagree).
CV: descriptive only.
MEAS: onset-shape classification, vibrato detection (×0.71 attenuation caveat), duration.
REF: continuous (guide).
FB: concurrent + terminal.
TRANSFER: the scoring layer assumes FW1, FW16 and that ornaments are quality — CONTRADICTED for our use.
EVIDENCE: CONTRADICTED as scoring; SUPPORTED as descriptive event logging.
SCI-RISK: the whole product is the anti-pattern list in one box.
EXPLOIT: maximal.
RETENTION: no.
G/L/N: high / low / low (as scoring); medium (as research description).

**M46 · STORY BRANCH** (CONSEQUENCE)
SOURCE: rhythm games · Elite Beat Agents / Ouendan `[V]` · the health gauge at each story break selects which vignette plays; three endings per stage.
ABSTRACT: coarse performance changes the narrative, not a number.
ACTION: perform a phrase set; at breaks the story continues one of three ways.
LOOP: terminal at breaks; coarse; the story is the feedback.
REPEAT: to see the other branches.
DIFFICULTY: what each branch requires (kept coarse: e.g., "held the pedal through the bridge").
IMPROVES (source): nothing claimed.
VOCAL: narrative consequence for coarse control events (holds, returns, answers); replaces XP.
CV: any SAFE variable.
MEAS: coarse event success.
REF: as per embedded mechanic.
FB: terminal narrative.
TRANSFER: none.
EVIDENCE: SUPPORTED as motivation device; neutral scientifically.
SCI-RISK: designers branching on fine criteria.
EXPLOIT: low.
RETENTION: yes (a branch that requires a blind demonstration).
G/L/N: medium–high / low / medium.

**M47 · ONE TARGET, INTENSIVE DOSE, SELF-CALIBRATION** (PROGRESSION / JUDGE)
SOURCE: speech therapy · LSVT LOUD `[V]` · single target ("think loud"), 4×/week × 4 weeks plus daily home practice; sound-level meter gives visual dB feedback; "calibration" = correcting the patient's miscalibrated sense of their own loudness.
ABSTRACT: one variable, heavy dose, and an explicit *recalibration of the learner's self-perception against a meter* (the learner learns that what feels "too much" is right).
ACTION: a block trains one coarse control variable only (e.g., "arrive and hold"), with a calibration ritual: guess before the meter speaks (M36), then compare.
LOOP: terminal coarse; calibration discrepancy is the interesting output.
REPEAT: short, dense blocks; a clear single aim.
DIFFICULTY: dose, not precision.
IMPROVES (source): vocal intensity in Parkinson's dysarthria (clinical evidence; not pitch).
VOCAL: two transplants: (a) one-variable blocks (avoids FW16 composites); (b) the calibration concept — the learner's felt sense vs measured coarse category — which is a JUDGE mechanic, not a precision mechanic.
CV: judge + one SAFE variable.
MEAS: coarse category; felt-vs-measured agreement.
REF: initial.
FB: terminal.
TRANSFER: assumes the calibration concept transfers from loudness to pitch (unknown); dosage structure is a design choice, not a claim.
EVIDENCE: PLAUSIBLE (structure); UNKNOWN (pitch).
SCI-RISK: importing "intensive dose" without retention testing repeats the C028 gap.
EXPLOIT: low.
RETENTION: yes (calibration retest).
G/L/N: low–medium / medium / medium.

**M48 · FLASHLIGHT** (BLIND / GLIMPSE variant)
SOURCE: rhythm games · osu! Flashlight `[V]` · only a small area around the cursor is visible; it shrinks as the combo grows; the map is otherwise dark.
ABSTRACT: local information only: you see where you are, not where to go; success shrinks the visible area further.
ACTION: the learner sees only their own coarse position (or hears only their own voice), not the target; the target must come from memory or from the tonal context; as they succeed the glimpse shrinks.
LOOP: concurrent-local; terminal reveal.
REPEAT: tension; the shrinking light is a visible progression of removed information.
DIFFICULTY: light radius (how much of the map is visible), combo-linked shrinking, target novelty.
IMPROVES (source): pattern memory.
VOCAL: separates "hide the target" (Flashlight) from "hide yourself" (Hidden, M11) — two different information conditions to test rather than one "no feedback" bucket; ties to E-E (reference dependence) and E-A.
CV: memory after reference removal, target acquisition (SAFE-DESCRIPTIVE).
MEAS: settled center vs hidden target.
REF: initial → none.
FB: concurrent (own position only) → none.
TRANSFER: assumes practising with target hidden but self visible supports later blind performance (H002/H009; unknown).
EVIDENCE: EXPERIMENTAL.
SCI-RISK: FW4/FW5 if glimpse performance is called learning.
EXPLOIT: low–medium.
RETENTION: yes.
G/L/N: medium–high / medium / medium–high.

---

### Atlas summary table

| ID | Name | Family | Ref | FB | Evidence | Meter-chasing | 24 h/7 d | G | L | N |
|---|---|---|---|---|---|---|---|---|---|---|
| M01 | Flick | ACQUIRE | initial/none | terminal | PLAUSIBLE | med | yes | H | M | L |
| M02 | Timing tiers on arrival | ACQUIRE | initial | concurrent(time) | PLAUSIBLE | low | yes | H | M | M |
| M03 | Target switching | SEQUENCE | initial | terminal | PLAUSIBLE | low–med | yes | M | M | L |
| M04 | ERG hold | SETTLE | continuous* | musical | EXPERIMENTAL H013 | low | partly | M | M | M |
| M05 | Balance board | SETTLE | continuous | concurrent visual | CONTRADICTED (alone) | highest | no | H | L | L |
| M06 | Blank bale | PROCESS | none | none | UNKNOWN | none | baseline | L | L–M | M |
| M07 | Ride the line | TRACK | continuous* | concurrent audio | UNKNOWN | low(audio) | delay variant | H | L–M | L |
| M08 | Ghost of your past | RETURN/SELF | intermittent/none | intermittent | SUPPORTED (instrument) | low | yes | H | M | H |
| M09 | Warmer/colder | RETURN/SEARCH | none/initial | intermittent | PLAUSIBLE | low | yes | H | M | H |
| M10 | Marco Polo | RETURN/NAV | intermittent | intermittent musical | PLAUSIBLE | low | yes | H | M | H |
| M11 | Blackout in trial | BLIND | initial | intermittent | EXPERIMENTAL H009 | low–med | yes | H | M–H | M |
| M12 | Graduated recall | MEMORY | initial | terminal | SUPPORTED (instr.) | low | yes | M | H | H |
| M13 | Adaptive sequencing | MEMORY/PROG | initial | terminal | PLAUSIBLE/EXP | low | yes | L–M | H | M |
| M14 | Temporal occlusion | PREDICTION | intermittent | terminal musical | PLAUSIBLE | low | yes | H | M | H |
| M15 | Growing echo | IMITATE | intermittent | terminal | PLAUSIBLE | low | yes | H | M | L–M |
| M16 | Earn the right to stop | IMITATE→GEN | interm.→none | musical | EXPERIMENTAL | low | yes | H | M | H |
| M17 | Shadowing ladder | IMITATE/TRACK | cont.→none | concurrent→terminal | EXPERIMENTAL H006 | low | yes | M | M | M |
| M18 | Contingent companion | AGENT | interm. (self-trig.) | musical | PLAUSIBLE/UNKNOWN | low–med | yes | H | M | H |
| M19 | Lock-on parts | RELATIONAL | continuous* | musical | EXPERIMENTAL | low | partly | H | M | M |
| M20 | Auto-harmonised voice | GENERATIVE | none | musical | UNKNOWN | none | no | H | L | M |
| M21 | Beats | SOUND-CONS. | continuous* | audio | UNKNOWN | low | partly | H | ? | H |
| M22 | Sympathetic resonance | SOUND-CONS./MEM | none/initial | audio | UNKNOWN | low–med | yes | H | M | H |
| M23 | Sing the numbers | RELATIONAL | initial→none | categorical | PLAUSIBLE | low | yes | M | M–H | L–M |
| M24 | Question→answer | CALL&RESP | intermittent | musical | PLAUSIBLE | low | yes | H | M | M |
| M25 | Koch vocabulary | PROGRESSION | initial | terminal | PLAUSIBLE | low | yes | M | M–H | H |
| M26 | Farnsworth gaps | MEMORY/SEQ | initial/none | terminal | PLAUSIBLE/SUPP.(instr.) | low | yes | M | M–H | H |
| M27 | Master Mode (earned fade) | BLIND/ADAPT | cont.→none per item | conc.→none | EXPERIMENTAL H009 | med | yes | H | H? | H |
| M28 | Loop and ramp | SEQUENCE | intermittent | terminal | PLAUSIBLE | med | yes | L–M | M | L |
| M29 | Fog-of-war map | EXPLORATION | none | reveal | PLAUSIBLE C018 | none | partly | M–H | L–M | H |
| M30 | Onsight/flash/redpoint | LABELLING | per cond. | per cond. | SUPPORTED (instr.) | low | yes | M | — | H |
| M31 | Knowledge-gated world | PROGRESSION | none at gate | terminal | SUPPORTED (rule) | low | yes | H | H | H |
| M32 | Error augmentation | ADAPTATION | continuous | amplified | EXPERIMENTAL | highest | exp. only | H | ? | M |
| M33 | Assist-as-needed | ADAPTATION | scheduled fade | scheduled fade | EXPERIMENTAL H009 | low–med | yes | L–M | M | M |
| M34 | Lure fade + 3 D's | ADAPT/TRANSFER | initial→none | terminal | PLAUSIBLE/SUPP.(instr.) | low | yes | M | H | M–H |
| M35 | Rewind | RECOVERY | intermittent | rewind | SUPPORTED (usability) | low | yes | H | L–M | M |
| M36 | Call your shot | JUDGE | initial/none | about prediction | PLAUSIBLE/SUPP.(instr.) | low–med | yes | M–H | M–H | H |
| M37 | Two versions of you | JUDGE/PERCEPT | initial | terminal | SUPP.(ear)/UNK(voice) | low | yes(ear) | M | M | H |
| M38 | Open call | SOCIAL | cont./interm. | social | UNKNOWN | med if scored | partly | M–H | L | L–M |
| M39 | Game of SKATE | SOCIAL/IMITATE | intermittent | terminal | PLAUSIBLE | low | yes | H | M | H |
| M40 | Tuning ladder | COORDINATION | continuous* | musical | UNKNOWN | low | partly | H | ? | M |
| M41 | Voice as verb | GENERATIVE/WORLD | none/interm. | world-state | UNKNOWN | low | partly | H | L–M | L |
| M42 | Comic instrument | GEN/FAILURE | intermittent | audio | UNKNOWN | none | no | H | L | H |
| M43 | Weather | SOUND-CONS./SETTLE | none | audio | PLAUSIBLE (design) | low | partly | M–H | L–M | H |
| M44 | Loop garden | GENERATIVE | self | audio | UNKNOWN | none | yes | H | L–M | H |
| M45 | Technique labelling | DESCRIPTION | continuous | conc.+terminal | CONTRADICTED (scoring) | maximal | no | H | L | L |
| M46 | Story branch | CONSEQUENCE | — | narrative | SUPPORTED (motiv.) | low | yes | M–H | L | M |
| M47 | One target / calibration | PROG/JUDGE | initial | terminal | PLAUSIBLE | low | yes | L–M | M | M |
| M48 | Flashlight | BLIND | initial→none | local→none | EXPERIMENTAL | low–med | yes | M–H | M | M–H |

`*` continuous reference: FW10–FW13 flagged; must be an experimental condition (H006/H012, E-E), never a default.

## 8. MECHANIC FAMILIES

Clustering by the loop, not by the product. A family is *fundamentally different* when it changes what the learner senses, when feedback arrives, or what the reference is. It is *cosmetic* when it only changes the picture drawn around the same loop.

**Fundamentally different loops (nine):**

| Family | Loop signature | Members | What distinguishes it |
|---|---|---|---|
| F1 ACQUIRE | leap → confirm; terminal event | M01, M02, M03 | discrete arrival; the reference is gone by the time you arrive |
| F2 SETTLE / HOLD | sustain under perturbation; slow concurrent consequence | M04, M43, (M05 as the unsafe visual version) | success is *staying*; the world moves, you do not |
| F3 TRACK / RIDE | follow a moving reference; concurrent | M07, M17 (lag 0) | the reference never stops; the risk family for FW10/FW11 |
| F4 RETURN / SEARCH | leave or lose the target, find it with sparse cues | M08, M09, M10, M48 | feedback is *sparse* or *relational*, not continuous |
| F5 MEMORY | hear → delay → reproduce | M12, M13, M26, M22 (persistence) | the delay is the difficulty; L1 |
| F6 IMITATE / RESPOND | another gesture in, related gesture out | M15, M16, M17, M18, M24, M39 | the reference is a *gesture*, and the output is judged by relation |
| F7 RELATIONAL / HARMONIC | relation to a sounding context; musical consequence | M19, M20, M21, M23, M40, M44 | the success state is audible as consonance/ring; no display needed |
| F8 PREDICT / JUDGE | say what happened or what comes next before the reveal | M14, M36, M37, M47 | production is secondary; the learner's *model of themselves* is the variable |
| F9 REMOVE / ADAPT | assistance withdrawn per item or on schedule | M11, M27, M33, M34, M48 | the mechanic is the reference/feedback condition itself |

**Structural, not loops (they wrap any family):** F10 PROGRESSION RULES (M25, M30, M31, M46, M47) decide what unlocks; F11 FAILURE HANDLING (M35, M42) decide how a miss is rendered; F12 EXPLORATION (M29, M41, M44) decide whether targets exist at all; F13 DESCRIPTION (M06, M45) decide what is logged without being played.

**Cosmetic variants of the same loop** (these should never be counted as different mechanics):
- Corridor / tube / lane / glide-path / balance cursor → all F3 with a visible continuous reference (M05/M07).
- Landing / docking / parking / orbit capture → all F1 followed by F2 (leap then hold).
- Fog / darkness / hidden target / disappearing guide → all F9; the *real* distinctions inside F9 are: per-item vs scheduled removal (M27 vs M33), hide-the-target vs hide-yourself (M48 vs M11), within-trial vs across-days (M11 vs M31).
- Echo / repeat-after-me / Simon / shadowing at lag 0 → all F6; the real distinctions are lag (0 → ∞) and whether an exit into free response exists (M16).
- XP / stars / streaks / leagues → not a family; a progression skin (see §17).

**The two families the current product does not touch at all:** F7 (musical consequence as feedback) and F8 (prediction before reveal). They are also the two families that need the fewest firewall flags, because neither requires a number to mean anything.

## 9. FAILURE THAT FEELS GOOD

What the source systems do, and the vocal translation of each principle:

1. **Failure is audible, not textual** (Trombone Champ, PaRappa Bad Mode, Otamatone). A miss still produces sound with character; the sound *is* the information. Vocal: a wrong note is rendered as a bent/honked/wobbling partner note or a harmony that thins, never as red text or a number. The learner hears "wide", "under", "late" as musical qualities.
2. **Retry is instantaneous and local** (Celeste respawn, Trackmania restart, Forza rewind). No menu, no summary screen. Vocal: rewind to the last settled note (M35); the phrase resumes inside the music.
3. **Failure produces the next attempt's plan** (call your shot; warmer/colder; temporal occlusion reveal). The reveal is directional and singular: one thing to change. Vocal: after a miss, exactly one cue — direction, or "earlier", or "hold longer" — never a list.
4. **Near misses are informative, not tantalising.** Rhythm-game tiers make a near miss a *category with a name* that tells you what to adjust. Warning from the gambling literature (general knowledge, not canonical): slot-machine near misses increase play without skill. Vocal rule: a near miss must carry direction; a near miss that only says "almost!" is a slot machine.
5. **Error becomes movement** (Trombone Champ glissandi, theremin). In continuous controllers the correction is itself expressive. Vocal: portamento into the target is allowed and audible as music, not penalised as "scoop" (which is descriptive-only under the firewall anyway).
6. **The player discovers rather than obeys** (Outer Wilds, Metroidvania, hot/cold). Failure in discovery is "not here"; it costs nothing. Vocal: hidden targets and hidden bands (M09, M22) make failure a step of a search.
7. **Success emerges from improved control, not from a lower bar** (aim trainers, Koch, Rocksmith DD). Difficulty adds *density or removes assistance*; it does not shrink the target. Vocal rule: difficulty never narrows the band (FW1); it lengthens the gap, hides the reference, adds a moving part, or lengthens the sequence.
8. **Repetition does not feel like repetition** (roguelike variation, ghost runs, new keys). Every attempt differs in something irrelevant to the skill (key, backing, timbre, companion phrase) so the skill is the invariant. Caveat: variability's benefit is task-dependent (H008) — the *engagement* case for variation is solid; the *learning* case is open.
9. **Death is a counter, not a verdict** (Celeste shows deaths per screen with affection). Vocal: rewinds and misses are shown as descriptive counts on a map, if at all, with no adjective.
10. **The world degrades comically, not punitively** (PaRappa). Vocal: the companion sounds confused; the weather stirs; the room stops ringing — the consequence is a change of state, reversible in the next second.

What to avoid as the primary loop (as requested): red; "wrong"; "you missed by 17 cents"; score decreases; repeat the identical exercise. Every atlas mechanic with G ≥ medium meets this except M05 and M45, which are included as warnings.

## 10. FEEDBACK REMOVAL AS GAMEPLAY

Source systems where assistance disappears, ordered by *how* it disappears:

| Regime | Source | What disappears | Trigger | Reversible? |
|---|---|---|---|---|
| within-trial blackout | Rhythm Heaven; osu! Hidden | the display, briefly | scripted | yes (light returns) |
| local-only view | osu! Flashlight | the target; self stays visible | scripted; shrinks with success | yes |
| earned per item | Rocksmith Master Mode | the guide for *that* phrase | measured success on that item | yes (returns on failure) |
| scheduled | rehab assist-as-needed; lure fading | reference strength | continuous performance | slowly |
| by attempt condition | climbing onsight | all prior information | learner's choice | n/a (a label) |
| by tooling | typing hood; aviation partial panel | an instrument | instructor | yes |

The candidate ladder SEE → FOLLOW → GLIMPSE → REMEMBER → RETURN → BLIND → USE MUSIC AS CONTEXT is a *game progression* and, separately, a *set of experimental conditions*. Mapping:

| Stage | Information condition | Source analogue | Atlas | Canonical status |
|---|---|---|---|---|
| SEE | target and self visible, continuous | balance board, corridor | M05/M07 | acquisition aid; in-task dip possible (C020); not learning (FW4) |
| FOLLOW | target audible/visible, moving; self audible | shadowing lag 0; ride the line | M07, M17 | reference-mode condition (H006) |
| GLIMPSE | self visible, target hidden — or target visible, self hidden | Flashlight / Hidden | M48 / M11 | two conditions, not one |
| REMEMBER | reference heard once, then delay | graduated recall; Farnsworth gaps | M12, M26 | measurable now (C014) |
| RETURN | leave and come back with sparse cues | warmer/colder; Marco Polo; ghost | M09, M10, M08 | measurable now |
| BLIND | untrained item, no reference, no feedback until after | onsight; knowledge gate | M30, M31 | the retention test itself (E-A) |
| USE MUSIC AS CONTEXT | only the tonal/harmonic context remains | question→answer; sing the numbers | M24, M23 | tonal context effects are real but modest (C043, C044) |

Design rule that keeps the ladder honest: **stage advancement is never granted on performance at the current stage**; it is granted on a *blind* probe (BLIND-stage trial on the item) — Rocksmith's criterion applied to feedback-off repeats rather than to in-feedback play. That single rule removes FW4/FW5 from the progression.

Can "losing the tuner" itself be progression? Yes, in two senses that must be kept separate: (a) as *game* progression — the guide leaving is a visible achievement per item (M27) and a rising tension (M48); (b) as *learning* progression — only if H009 (fading improves retention) survives E-A. The game can ship (a) while (b) is measured, provided the product never says "you have learned this" when the guide leaves; it says "this phrase is dark now".

The fading experiment embedded in play: item-level random assignment of *earned* fade (M27) vs *scheduled* fade (M33) vs *no fade* (guide stays), with the 24 h onsight probe (M30) as the outcome. Three arms in one game, invisible to the player as an experiment.

## 11. MEMORY AS PLAY

Three loops requested, each with source mechanics and the delay ladder.

**hear → wait → reproduce** (M12, M26, M22): the reference is a note, an interval, or a short phrase; the wait is filled or empty.
**observe → distraction → return** (M11 blackout with a distractor; M13 interleaving; M09 with an interposed note): the distractor is the manipulation (interference vs decay is the L1 question).
**navigate away → find home again** (M09, M10, M29, M23 "home" from memory): the learner sings elsewhere deliberately, then must re-find the origin.

Delay ladder as gameplay (each row is also a data point on the C014 curve):

| Delay | Game form | Filler | Source | Note |
|---|---|---|---|---|
| 0 s | echo; shadow | none | Simon | baseline imitation (C006 measurable) |
| 1 s | "breath then answer" — the companion pauses one beat | silence | call-and-response | tests immediate STM |
| 3 s | "hold it in your head while the door opens" — a short world animation | silence or ambient | occlusion reveal timing | first meaningful decay point |
| 5 s | "carry it across the room" — a short non-vocal action (tap a rhythm) | non-pitch task | Marco Polo | C014 range starts here |
| 10 s | "sing something else, then come back" — a distractor note of the learner's choice | pitch interference | hot/cold with detour | interference condition |
| 30 s | "keep the room awake" — do a different hunt, return to re-wake yesterday's resonator | full task switch | Rocksmith phrase switching | C014 upper range |
| next session | "the companion asks for this morning's word" | hours | Pimsleur | first true retention point (none in the literature, C028) |
| next day | "relight the lighthouse" — the home note from memory, no reference | sleep | onsight; knowledge gate | the E-A probe |

Two design constraints from the canonical base: (1) the reference should be fixed-timbre or synthetic for research variants because the perceived center of a real sung reference is open (H010, E-G); (2) coarse absolute anchors are common in untrained adults (C013), so a personal "home note" from memory across days is a plausible *anchor* game, not a claim about absolute pitch.

This is where L1 (representational precision) becomes playable without a meter: the only displayed outcome is "closer than last time / further / same", and even that can be replaced by a musical consequence (the resonator wakes or does not).

## 12. RELATIONAL MUSIC

Primitives for moving "somewhere relative to where you are" — interaction primitives only, no song-transfer claims (H003; FW6/FW7):

| Primitive | Definition | Atlas | Measurement | Evidence anchor |
|---|---|---|---|---|
| STEP | move by a named relation from the current settled note (up a third) | M23, M03 | settled centers, categorical | C037 categorical hearing; C029 interval deviation matters to listeners |
| MIRROR | reproduce a contour (shape) regardless of start | M15, M17 | direction sequence | C008 direction reproduced even by amusics |
| TRANSPOSE | same shape, new start (the "home" moves) | M23 with changing home | relative centers | C013 coarse anchors; L4 |
| ANSWER | complete a phrase so it ends on a requested relation | M24 | final relation | C043 tonal expectation |
| RESOLVE | move from tension (7, 4) to rest (1, 3) on cue | M24, M04 | final relation + hold | C043, C044 |
| MUTATE | change one note of a motif and keep the rest | M16, M18 | which note changed; rest reproduced | L4 |
| INVERT / REVERSE | transform a motif (mirror in pitch or time) | M16 | contour transform | UNKNOWN (perception of transforms is musician-level) |
| LOCK | sing until a relation to a sounding context becomes consonant | M21, M40, M19 | relation to context | C046 null on instruments (drone), so no benefit claimed; the reward is musical |
| MEET | two voices move toward each other until unison | M10, M40 | closing interval | — |

Why relational primitives are safer than absolute targets under the firewall: judges track interval deviation (C029); musicians hear intervals categorically (C037), so coarse categories are the perceptually honest display; poor singers compress intervals (C006), which relational play makes audible without labelling anyone. What remains open: whether STEP/ANSWER practice changes anything outside the game (FW6/FW7), and whether consistent vs variable relational practice is better (C025 vs C018; H008).

## 13. GENERATIVE / OPEN PLAY

Sources: Blob Opera (harmony follows you), Wandersong / One Hand Clapping (voice as verb), loop gardens (Electroplankton), companions (contingent response), Outer Wilds (knowledge world), Metroidvania maps.

The requested distinction, made operational:

- GAME REWARD: a token whose value is set by the designer (XP, stars, a door opening because a counter reached N). It can be attached to anything, including to a meter, which is why it is the meter-chasing vector.
- MUSICAL REWARD: a consequence that is *already valuable to the ear* — a chord blooms, a room rings, a phrase resolves, a companion answers in kind, a garden thickens. It can only be attached to events the ear already cares about, which under the firewall are coarse events (relation reached, note held, phrase completed). That is the reason it is safer: it cannot be attached to ±5 c without becoming inaudible.

Rule: a musical reward may be made *contingent* on a control event (M18) but never *graded* by precision. Contingent-but-ungraded is the design pattern that keeps generative play honest.

Could a learner…
- explore a world with pitch? Yes (M29, M41) — safe variables only; nothing learned is claimed.
- manipulate physics with voice? Yes, coarse level and direction (M41); precision physics = FW1 in disguise.
- grow something through repeated vocal gestures? Yes (M44 loop garden; M22 room) — repetition is composition; consistency is audible, not scored.
- communicate with creatures musically? Yes (M18) — contingency on relation, not on accuracy.
- improvise with an adaptive partner? Yes (M16, M24) — the partner keeps a frame; the frame is the only thing judged.
- discover intervals instead of memorising them? Yes (M21 beats, M22 resonators, M10 Marco Polo): the interval is *found* as the place where beats vanish or the room rings.
- create melodies while unknowingly repeating useful control problems? Yes (M25 vocabulary + M44 garden): a vocabulary of two degrees produces a lot of fifths.
- unlock environments by demonstrating retained abilities? Yes (M31) — and this is the honest progression rule.

The auto-harmoniser caveat (M20): a system that harmonises whatever you sing produces musical reward with *no* control event; it is pure toy. It becomes practice only when the harmony is contingent (settles when you settle).

## 14. PROGRESSION WITHOUT FAKE MASTERY

Progression systems examined that are based on changing constraints, not XP: Koch (vocabulary size), Farnsworth (gap length), Rocksmith DD (density per phrase), osu! mods (information and speed constraints with explicit multipliers), dog-training 3 D's (one context dimension at a time), climbing grades + onsight/flash/redpoint (difficulty × information condition), Outer Wilds (knowledge gates), Pimsleur (delay).

The five layers, kept apart:

| Layer | Definition | Owned by | Examples | May unlock? |
|---|---|---|---|---|
| GAME DIFFICULTY | constraints that make play harder without changing what is measured | designer/player | tempo, phrase density, sequence length, moving harmony, number of degrees of freedom (hold + rhythm) | yes, freely |
| TRAINING DIFFICULTY | conditions hypothesised to affect learning | experiment | reference availability and duration, feedback availability, memory delay, context variability, unfamiliarity, register/timbre, target range | assigned, not unlocked |
| MEASURED PERFORMANCE | coarse descriptive outcomes of attempts | measurement | arrival, hold, return, interval category, consistency, delay reproduction | shown coarsely; never unlocks |
| RETENTION | blind performance on trained items after 24 h / 7 d | probe | onsight of yesterday's redpoint | the *only* unlock currency together with transfer |
| TRANSFER | blind performance on untrained items/contexts | probe | new degree, new vowel, new key, unfamiliar phrase | unlock currency |

Rules derived from the sources:
1. Difficulty increases by *adding* (density, length, perturbation, delay, novelty) or *removing assistance*; never by narrowing tolerance (FW1). osu! is the model: Hard Rock changes geometry, Hidden removes information, Double Time changes speed — none changes the hit-window semantics for the player.
2. Progression events are retention/transfer events (Outer Wilds rule). Volume of play may unlock *content* (new companions, new worlds) but never *labels of ability*.
3. Labels of ability do not exist. What exists is the logbook (M30): which items are onsight/flash/redpoint, and when.
4. Measured performance is displayed as words with direction, coarse categories, or musical consequence — per the Product Firewall wording table.
5. Every unlock is logged with the condition under which it was earned, so a later analysis can ask whether unlocks predicted anything.

Which dimensions represent genuine vocal learning? Unknown (WE DO NOT KNOW). The layer table makes that ignorance structural rather than hidden: TRAINING DIFFICULTY dimensions are experimental variables, and the game varies them by assignment, not by "level".

## 15. MULTI-TIMESCALE LOOP

| Timescale | What the loop is | Source systems that solve it well | Atlas | Research role |
|---|---|---|---|---|
| MICRO (2–15 s) | one vocal attempt with an immediate consequence | Trombone Champ, Trackmania restart, Celeste, hot/cold, Simon round | M01, M09, M10, M15, M35, M42 | attempts with condition metadata |
| SESSION (5–20 min) | a sequence of related control problems with variation | Rocksmith DD session, aim-trainer playlist, Koch session, Rhythm Heaven set, Kellman ARTS block | M13, M25, M27, M28, M03 | dose control; within-session acquisition curves (never called learning) |
| DAY | return and retest without feedback | Pimsleur next lesson, Outer Wilds "what do I know", Anki daily queue (spacing, not streak) | M08 silent ghost, M12 next-day row, M30 onsight, M31 gate | E-A 24 h probes; item registry with overlap flags |
| WEEK | abilities reappear in changed contexts | dog-training proofing, climbing "projecting" across sessions, Zwift plan weeks | M34, M30 redpoint history, M23 transposition | 7 d probes; transfer across vowel/register/key (WE DO NOT KNOW) |
| LONG-TERM | a map of explored capability | Metroidvania map, climbing logbooks (onsight/flash/redpoint tallies by grade), Strava segments | M29, M30 logbook, M31 world | phenotype descriptive profiles (H011/H014) — research only, never shown as a "type" |

Two products deserve a note for the DAY loop because they are opposites: Duolingo's streak keeps people *opening* the app (engagement metric), Pimsleur's schedule keeps people *recalling* items (learning metric). Only the second generalises to a retention instrument; the first is §17's "meaningless streaks".

## 16. SOLO VS SOCIAL

| Configuration | Mechanics | Interaction principle | Canonical caution |
|---|---|---|---|
| solo | most of the atlas | all references synthetic/recorded; conditions controllable | none |
| teacher + student | M36 call-your-shot with the teacher as second judge; M24 teacher plays questions; M30 logbook the teacher reads; annotation slots (§9 safe to build) | the teacher supplies interpretation; the app supplies description | teacher ratings disagree (C031) — log rater ID |
| two singers | M39 SKATE; M10 Marco Polo live (one calls, one replies); M24 alternating questions | symmetric turn-taking; validity rule (setter must reproduce) | one mic → alternate, do not overlap |
| choir / group | M40 tuning ladder; M19 parts (one live + recorded) | shared acoustic success state | never claim accuracy benefit (C048); multi-voice measurement infeasible with one mic |
| asynchronous ghosts | M08 own ghost; M38 open call; ghost of a *peer* | comparison to a fixed other; no live pressure | audible ghost = continuous reference (FW10/FW11) |
| call-and-response between users | M24 relay: a question left open, answered by strangers, passed on ("telephone") | chains; each link is an untrained item | contour drift across links is data (L4), not a score |
| cooperative tuning | M40, M21 with two live singers in one room (no measurement; ear only) | ring as reward | unmeasured mode is fine; it is a musical activity |
| group drones | M21 with a group hum | — | FW12/FW13: no evidence either way; make it a condition |
| leader / follower | M15 growing echo with roles; Space Channel 5 pattern | asymmetric imitation | model timbre (C047): child voice best for children |
| improvised dialogue | M16, M18 | the partner keeps the frame | free phases unscored (FW16) |

## 17. VOCAL LEARNING GAMIFICATION ANTI-PATTERNS

For each: what it is, why it is tempting, and how to detect it experimentally in our own product.

1. **Meter chasing.** Behaviour optimises the display, not the voice. Detect: performance gap between meter-on and meter-off trials on the same items grows over sessions rather than shrinking (acquisition without retention, the C020/C028 pattern); learners adopt straight tone and short notes only when the meter is on (vibrato extent and note duration differ by condition).
2. **Overprecision.** Bands below the learner's own compensation sensitivity (≈20–25 c untrained, H007) or below lay thresholds (C033). Detect: no difference in blind outcomes between ±10 and ±25 c KR arms (E-F); increased in-task dip (C020) and dropout in the narrow arm.
3. **Static target repetition.** The same note, the same way, many times. Detect: gains confined to the trained item with zero transfer to a neighbouring item (H004 at its worst); flat engagement curves; session length falls.
4. **XP detached from capability.** Points for volume. Detect: XP rank uncorrelated with blind 24 h performance across users; XP predicts *opens*, not retention.
5. **Fake mastery.** "Mastered C4" from in-feedback performance. Detect: mastery-labelled items fail the onsight probe at the same rate as unlabelled ones.
6. **Visual dependency.** Learners cannot perform without the display. Detect: meter-off performance below baseline (worse than before training) — the reversal seen in the one delayed test of concurrent feedback (C028).
7. **Punishment-heavy error displays.** Red, "wrong", decreasing scores. Detect: attempt-rate after a miss drops (retry latency rises); session abandonment after misses; self-reported affect.
8. **Leaderboards rewarding detector exploitation.** Top scores come from behaviours the detector favours (straight tone, chest register, specific vowels, singing an octave down where the detector reports the lower octave, C054). Detect: top-ranked takes cluster in detector-favourable acoustic features; teacher ratings (C031 caveats) disagree with the leaderboard.
9. **Grinding.** Long sessions with no variation. Detect: within-session performance plateaus early while time continues; next-day probes do not benefit from extra minutes beyond a threshold (dose–response flattening).
10. **Meaningless streaks.** Daily opens without retrieval. Detect: streak length uncorrelated with retention; streak-day sessions shorter than non-streak sessions; streak-freeze purchases.
11. **Difficulty that only narrows tolerance.** Detect: difficulty levels differ only in band width; higher "levels" show no change in delay, reference availability, novelty or density; blind outcomes flat across levels.
12. **Excessive cognitive load.** Too many simultaneous demands (pitch + rhythm + lyrics + reading). Detect: single-variable blocks outperform combined blocks on the same probe; error rates rise on the *secondary* variable when the primary is added.
13. **Gamification that destroys musical listening.** Learners stop listening to the harmony because the display is faster. Detect: perception probes (M37, E-G-style) decline or stall while meter performance rises; learners cannot report whether a chord resolved.
14. **Training the interface rather than the voice.** Learners learn the detector's latency, the band's edges, the label hysteresis. Detect: performance on the same items with a *different* detector/window configuration drops (replay the same audio through M1b candidates; an interface-trained learner's advantage disappears under re-analysis).
15. **Composite scores** (added). One number for "singing". Detect: the composite's components move in opposite directions across learners (C011 dissociations), so the composite hides them.
16. **Adaptive difficulty driven by per-frame cents** (added). Detect: difficulty state changes more often than the underlying capability can (level flicker within seconds); level correlates with mic/room, not with the learner.

Instrumentation needed for all of the above already sits in §9 "safe to build": condition logging, item registry with overlap flags, delayed retest scheduling with blind blocks, versioned scoring, judgment tasks logged as attempts.

## 18. NOVELTY PASS — 16 concepts from recombined mechanics

Constraint tags: NM = no visible cents meter · NN = no visible note name during the main interaction · SC = works through sound/musical consequence rather than score · DM = delayed memory · OA = another musical agent/person · OE = open-ended play · RD = naturally produces useful research data. Each concept lists its parents (atlas IDs), its control variables, and its firewall exposure.

**N01 · THE RINGING ROOM** — NM NN SC DM RD · parents M22 + M12 + M29
A room of unseen resonators tuned to a scale or to a chord. Singing wakes the resonator you match; it keeps ringing after you stop, then fades over minutes. The goal is to keep the room alive; tomorrow the room is silent and you must wake yesterday's resonators unheard. Variables: target acquisition, hold, memory after removal, range. Data: which pitches are re-found after 0 s / 30 s / 24 h, with and without a faint hum (reference condition). Exposure: FW3 minor (resonators respond to f0 and partials); resonator bandwidth floor 25 c.

**N02 · WARMER, COLDER, THERE** — NM NN DM RD · parents M09 + M12
A hidden note; you sing candidates; a voice (or a rising warmth in the sound) says only warmer/colder/there. Once found, the note is "yours" and is asked for again after 10 s, 60 s, next session, next day — always with only warmer/colder as the reply. Variables: direction, acquisition, memory. Data: search efficiency and delay decay (C014) with zero visual feedback. Exposure: none beyond H007 (band ≥25 c).

**N03 · CALL IT** — NM RD · parents M36 + M47
The game is not the note; it is your prediction of the note. After each attempt you declare high/low/on (later: which of three notes in a phrase was off) before a coarse reveal; the streak counts predictions, not accuracy. Variables: judge + any. Data: agreement matrices per learner (perception/production dissociation, C004/C005), E-C-adjacent without a slider. Exposure: reveal categories ≥25 c wide; H010 caveat on the "truth".

**N04 · FARNSWORTH SONGS** — NN DM SC RD · parents M26 + M25 + M35
A known song at natural note speed with long silences between notes; the song reassembles as the gaps shrink over days. A gap can be filled with a distractor sound (interference condition). Variables: memory, interval, sequence. Data: per-gap delay trials (L1); every note after a gap is a prepared onset — with a "fast" variant (M01 Flick) this yields the instruction × onset contrast E-D needs. Exposure: FW7 if the song is claimed to improve; it is not — the song is the frame.

**N05 · SKATE** — OA RD · parents M39 + M30
Two players, asynchronous or live. The setter sings a short phrase twice; if the two takes agree coarsely the phrase is valid; the other must reproduce it (relative pitch); miss = a letter; a letter can be redeemed next day by reproducing the phrase blind. Variables: consistency, sequence, interval. Data: peer-generated untrained items (E-B), 24 h redemptions (E-A). Exposure: none; scoring is capacity-based (letters), not cents.

**N06 · WEATHER VOICE** — NM NN SC · parents M43 + M04
An ambient world; while you hold inside a wide hidden band the storm settles; a passing chord (perturbation) tries to move you; nothing is displayed. Variables: hold through perturbation. Data: hold durations by perturbation type (H013 descriptive). Exposure: FW15 if "drift control" is ever claimed; hidden band never below 25 c.

**N07 · THE ONSIGHT LEDGER** — RD DM · parents M30 + M31
Every phrase, hunt and word has three checkboxes: onsight (first try, never heard), flash (heard once), redpoint (practised). Onsight attempts are limited to one per item per day, so they are precious. Worlds open on onsight counts, never on play counts. Variables: all. Data: the item registry, overlap flags, and retention probes required by E-A/E-B, produced by the player's own choices. Exposure: none.

**N08 · THE ANSWERING MACHINE** — NM NN SC OA OE · parents M18 + M24 + M16
A companion plays a question; you answer; the companion's next question is built from your answer (mutation, transposition). It answers only when your phrase ends on a settled note in a coarse relation to its frame; otherwise it repeats itself, puzzled. No score. Variables: response to gesture, interval, hold. Data: answer endings and contours vs frame (L4), latencies. Exposure: FW16 if answers are ever rated; contingency is relational, not precise.

**N09 · BEAT KILLER** — NM NN SC · parents M21 + M20
A tone sounds; you tune the beats out by ear; the display shows nothing; when beats vanish the tone blooms into a chord that follows your voice. Intervals other than unison unlock as new "rings". Variables: interval, hold. Data: settled centers relative to the tone in a continuous-reference condition. Exposure: FW10–FW13 — this is the drone question in a game; must be an assigned condition (E-E), never the default mode; vibrato creates beats (straight-tone strategy risk).

**N10 · DARK PHRASES** — DM RD · parents M27 + M48 + M11
Phrases carry a guide (audible first, visual optional). A phrase whose coarse accuracy is stable across feedback-off repeats goes dark: the guide leaves. Dark phrases are re-checked at the start of tomorrow's session (blind). If a dark phrase fails, the guide returns without comment. Variables: sequence, memory. Data: E-A in game form, with earned vs scheduled fade assigned per item (H009). Exposure: FW4/FW5 are explicitly avoided by the feedback-off criterion.

**N11 · RANGE CARTOGRAPHY** — NM NN OE RD · parents M29 + M06
A map of your voice with no note names — islands where you stayed, passages where you leapt, edges you approached. It fills in by presence. Nothing is scored; the map is the reward. Variables: range, direction, duration. Data: range/register metadata, comfort tags, and a personal anchor (an island you return to) for C013-style anchor tests. Exposure: physiological — edges are drawn, never rewarded.

**N12 · TWO-NOTE LANGUAGE** — SC OE RD · parents M25 + M44 + M23
You start with two scale degrees at musical tempo; melodies are generated only from your vocabulary; a degree is added when 2-note calls are reproduced consistently over ≥4 attempts (coarse). Each new degree is an untrained item. Variables: interval, sequence, consistency. Data: E-B grain probes (new degree = untrained item; longer calls = longer grain) with dose logged. Exposure: FW6 if vocabulary growth is called melodic skill; it is called vocabulary.

**N13 · FINISH THE SENTENCE** — DM SC RD · parents M14 + M24
A phrase plays and cuts off; you sing the continuation (or just the final note); then you hear what it was. Cut points move earlier as you succeed; phrases are unfamiliar. Variables: response, sequence, memory (short). Data: continuation contours and final relations vs tonal context (C043); prediction-before-production data. Exposure: no unique "correct" continuation — scoring absent or coarse.

**N14 · GHOST OF YESTERDAY** — DM OA RD · parents M08 + M30
Your take from yesterday is a partner today: silent unless you diverge (then it fades in), or fully silent (onsight). Beating the ghost means being closer to the script *and* more consistent. Variables: memory, consistency. Data: same-item 24 h retest under three reference conditions (silent / on-divergence / audible), E-A and E-E in one mechanic. Exposure: audible ghost = continuous reference (assigned condition).

**N15 · HEALING PHRASE** — SC NM · parents M35 + M42
Long phrases with a comic partner; a coarse miss makes the partner honk and the music rewinds one bar; you re-enter; the phrase heals. Rewinds are counted on a map with no adjective. Variables: sequence, acquisition. Data: repeated attempts at identical transitions (transition-level difficulty). Exposure: none.

**N16 · THE RELAY** — OA OE RD · parents M38 + M24 + M15
A four-second phrase arrives from a stranger; you answer it (M24) or copy it (M15) and pass your version on; chains form; you can listen back along the chain. Nothing is scored; the chain's drift is audible. Variables: response, sequence, interval. Data: telephone-game drift of contour and interval across links (L4/L1 with natural variation), all untrained items. Exposure: social comparison if ever ranked — do not rank.

Coverage check: NM = N01 N02 N03 N06 N08 N09 N11 N15 (8 ≥ 5) · NN = N01 N02 N04 N06 N08 N09 N11 (7 ≥ 5) · SC = N01 N04 N06 N08 N09 N12 N13 N15 (8 ≥ 5) · DM = N01 N02 N04 N07 N10 N13 N14 (7 ≥ 3) · OA = N05 N08 N14 N16 (4 ≥ 3) · OE = N08 N11 N12 N16 (4 ≥ 3) · RD = N01 N02 N03 N04 N05 N07 N10 N11 N12 N13 N14 N16 (12 ≥ 3).

## 19. RADICAL CONCEPT PASS — the user must not feel they are using a vocal exercise app

**R01 · THE LIGHTHOUSE (ritual)** — parents N01, N02, M31, M12
A three-minute nightly ritual. The lamp is dark. You find your home note (no reference; the lamp warms as you approach, by sound), hold it until the lamp is lit, then three ships call from the sea (short phrases) and you answer each so it can dock (ANSWER/RESOLVE). Nothing is scored; the log is a calendar of lit nights. Vocal skill that *could* emerge (not claimed): a stable personal anchor across days (C013 says coarse anchors exist), hold, answer. Research: a daily blind home-note = the cleanest long-term anchor-stability series imaginable; ships are untrained items. Why it does not feel like an exercise app: it has one verb (light the lamp), a place, and a time of day.

**R02 · THE CREATURE THAT ONLY UNDERSTANDS CONTOUR (musical creature)** — parents M18, M15, M16, N08, M37
A creature with no words; it understands only pitch gestures. You teach it "words" (2–4-note motifs); it repeats them back with mutations; a conversation grows; tomorrow it asks for a word back ("what was the word for *rain*?") and you must sing it from memory. You can also teach a word by *dragging* the creature's pitch (slider channel) instead of singing it — the same word taught two ways. Vocal skill that could emerge: imitation, mutation, delayed reproduction (L1/L4), all relational. Research: the slider-vs-voice teaching channels are E-C in disguise (adjustment with comparison vs vocal production, same items, same learner); the creature's next-day requests are E-A probes on untrained motifs. Why it is not an exercise app: it is a pet, and its needs drive the loop.

**R03 · THE BAND THAT FOLLOWS YOU (instrument)** — parents M20, M18, M04, M44, M42
Your voice is one instrument in a generative band. Your held notes become chord roots (you steer the harmony by holding); your leaps cue changes; your consistency across bars thickens the arrangement (layers agree → chorus; disagree → wide). The band is contingent (it settles when you settle) but never grades. There are sets, not levels. Vocal skill that could emerge: hold, leap, consistency, relation; the reward is arrangement. Research: hold durations under harmonic perturbation, consistency across bars — descriptive; with a "silent band" set as the onsight condition. Why it is not an exercise app: you are playing a gig.

**R04 · SONIC CARTOGRAPHY (world / navigation)** — parents M29, M22, M09, M31, M12
A world where places have pitches. You travel by singing; a place is reached when you arrive and stay; the map records it. The fog returns to places you have not revisited (spaced retrieval as geography); to go back you must remember the place's pitch — the map will not tell you, but the place hums faintly if you are close (warmer/colder). New regions open only when you can return to three old places unaided (knowledge gate). Vocal skill that could emerge: acquisition, memory across days, return, range. Research: place revisits are 24 h/7 d retention trials with a reference-availability manipulation (hum on/off) built into the geography. Why it is not an exercise app: it is a map you are filling in, and forgetting is the antagonist.

**R05 · THE RELAY STATION (collaborative environment / conversation)** — parents N16, M24, M39, M38
A radio station where phrases arrive from other people and leave changed. You answer questions, copy calls, mutate motifs and pass them on; you can follow a phrase's journey across twenty voices. Occasionally a phrase comes back to you a week later and asks to be sung again. Nothing is ranked; chains are the artefact. Vocal skill that could emerge: response, imitation, relation, delayed reproduction. Research: all items are untrained and shared across learners (natural counterbalancing); drift across links is population-level data on interval compression (C006-type patterns) without labelling anyone; the week-later return is a 7 d probe. Why it is not an exercise app: it is a social medium whose unit is a sung phrase.

Across R01–R05, no claim is made that anything transfers to songs (FW7), that any measured quantity is skill (FW1/FW16), or that references help or harm (FW10–FW13). Each concept carries its own assigned-condition slots so those questions can be asked *inside* the play.

## 20. RESEARCH-INSTRUMENT PASS

Mechanics capable of embedding experimental elements without feeling clinical:

| Experimental element | Embedded as | Mechanics |
|---|---|---|
| blind trials | onsight attempts; knowledge gates; the dark phrase check; the lighthouse | M30, M31, N10, R01 |
| delayed retention | next-day requests from the creature/companion; ghost of yesterday; fog returning to places | M12, M08, N14, R02, R04 |
| untrained items | new degrees (Koch), peer-set phrases (SKATE), relay chains, unfamiliar questions | M25, M39, N16, M24 |
| reference removal | lure fading; faint hum on/off; silent ghost; shrinking flashlight | M34, N01, N14, M48 |
| feedback removal | earned darkness vs scheduled fade vs constant guide, assigned per item | M27, M33, N10 |
| randomised conditions | which room hums, which ghost speaks, which phrase gets a guide — assigned, not chosen | N01, N14, N10 |
| unfamiliar sequences | generated melodies from the vocabulary; occluded phrases; relay | N12, N13, N16 |
| repeated attempts | rewind (same transition again); resonator re-waking; SKATE takes | M35, N01, N05 |
| transfer probes | proofing across vowel/register/key/tempo; transposed home; new degree | M34, M23, N12 |
| judgement tasks | call it; two versions of you; teaching the creature by dragging | N03, M37, R02 |

Mapping to the ranked backlog:

**E-A retention of visual-feedback gains** — N10 Dark Phrases (per-item assignment of earned fade / scheduled fade / constant guide; feedback-off criterion; next-day blind check), N14 Ghost of Yesterday (same items, 24 h, three reference conditions), N07 Onsight Ledger (untrained-item probes chosen by the player), R01 Lighthouse (daily blind anchor series). Validity requirements: items registered with overlap flags; the blind check comes *before* any guided play in the next session; 7 d probes scheduled by the ledger.

**E-B grain transfer, dose and overlap controlled** — N12 Two-Note Language (grain grows from notes to 2-note calls to longer calls; dose is logged per item; each added degree is untrained), N04 Farnsworth Songs (whole-melody grain with gap structure), N05 SKATE (peer phrases as untrained items), R05 Relay (shared unfamiliar phrases). Validity: unfamiliar-song probe must be a scripted unfamiliar item, not a relay phrase; visual off; terminal audio only.

**E-C slider–voice decomposition** — R02 The Creature (teach a word by dragging vs by singing: adjustment with concurrent comparison vs vocal production, same items; delay and masking as game options: "the creature is far away" = masked own voice, "teach it later" = delay), N03 Call It (prediction agreement as a perception-side measure), M37 Two Versions of You (own-voice discrimination). Validity: six targets each, conditions counterbalanced; slider channel must use the learner's own recorded timbre (C005 used own-voice timbre).

**E-G real-voice perceived pitch** — M37 Two Versions of You (resynthesised own notes with same settled/different scoop, same mean/different endpoint, vibrato asymmetry — the exact E-G stimulus set — presented as "which one is you?"), N03 Call It (learner's declared category vs candidate center definitions: uniform mean, median, recency-weighted, last-200 ms computed in parallel per §9), N09 Beat Killer (perceptual judgement of "locked" vs the measured center, with the caveat that beats follow f0). Validity: adjustment matching needs a slider variant (the creature's drag); M1 capture is prerequisite for resynthesis.

**E-D initial-pitch marker** — N04 Farnsworth Songs (prepared onsets after long gaps, instruction implicit) vs M01 Flick (fast onsets under time pressure) on the same targets and registers; M45-style descriptive onset labelling (scoop / straight / fall) as the classification layer. Validity: onsets must be capture-resolved (M1), register and vowel logged, instruction manipulated explicitly in the research variant ("start exactly on it" vs "get there however you like"), 10 untrained + 5 trained.

Rule kept throughout: game feel never modifies assignment, timing of blind probes, or item novelty. Where a mechanic's fun depends on choice (which room, which ghost), the choice is over *content*, and the *condition* is assigned underneath it.

## 21. FINAL SYNTHESIS

### A. 10 strongest mechanics to steal

1. **Earned, reversible, per-item removal of the guide** (Rocksmith Master Mode, M27) — with the criterion moved to feedback-off repeats.
2. **Sound-consequence instead of display: sympathetic resonance** (M22) — a target that rings and keeps ringing; the only mechanic that is at once no-meter, memory-bearing and research-producing.
3. **Information-condition labelling: onsight / flash / redpoint** (M30) — turns the item registry, untrained items and retention probes into a logbook the player wants to fill.
4. **Call your shot** (M36) — prediction before reveal; the score is agreement, which no meter can be chased into.
5. **Contingent companion** (M18) — a partner that answers only to coarse control events; conversation as the loop.
6. **Farnsworth gaps** (M26) — real-speed notes, stretched silences; a delay ladder hidden inside a song, and a prepared-onset generator for E-D.
7. **Koch vocabulary** (M25) — few items at full musical tempo, grow the vocabulary; every new item is a transfer probe.
8. **Warmer / colder** (M09) — magnitude-free direction feedback; search as play; bands near compensation sensitivity by construction.
9. **Temporal occlusion → finish the sentence** (M14) — production as prediction in tonal context.
10. **Rewind** (M35) — failure undone in the music; long phrases become attemptable; repeated transitions become data.

Runner-up worth naming: knowledge-gated progression (M31) is less a mechanic than the rule that makes all the others honest.

### B. 10 most surprising source domains

1. Piano tuning and barbershop (beats and ring as displays that need no screen).
2. Sympathetic resonance in acoustic instruments (the environment remembers your pitch).
3. Songbird tutoring (learner-triggered model playback; live tutors beat playback).
4. Infant babbling research (contingent response changes vocalisation; yoked controls).
5. Morse code pedagogy (Koch: full speed from day one; Farnsworth: stretch the silence).
6. Dog clicker training (lure fading; proofing by distance, duration, distraction).
7. Climbing ethics (onsight/flash/redpoint as an honesty taxonomy of attempts).
8. Marksmanship (calling the shot: self-prediction as the trained skill).
9. Baseball pitch recognition (temporal occlusion: earlier cut = harder).
10. Japanese karaoke scoring (DAM/JOYSOUND: the most developed technique-detection layer in any consumer product — and the clearest demonstration of meter chasing at cultural scale).

Honourable mentions: cycling ERG mode (the world holds the load), meditation soundscapes (Muse), rehab error augmentation, aviation partial-panel training, the playground (hot/cold, Marco Polo, SKATE).

### C. 10 mechanics that appear fun but are scientifically dangerous

1. Balance-board pitch cursor (M05) — the tuner with a skin; FW1/FW4/FW5.
2. Error augmentation with visual gain (M32) — teaches the meter's gain.
3. Technique scoring à la DAM (M45) — stability/vibrato/composite scores; FW1/FW16; Graveyard-adjacent on expert deviation.
4. Auto-harmoniser as "training" (M20 without contingency) — musical reward with no control event.
5. Corridors with narrowing tolerance as difficulty (F3 cosmetic variants) — difficulty by narrowing (FW1).
6. Leaderboards on any cents-derived quantity — rewards detector-favourable behaviour (C054).
7. Streaks for opening the app — engagement without retrieval.
8. Adaptive difficulty driven by per-frame cents — level flicker; trains the interface.
9. Continuous audible reference as the default mode (M07, M19, M21 always on) — the C007/C050 acquisition-not-retention pattern; must be a condition.
10. Onset scoring ("clean attack" points) — FW14; H005 is demoted; research signal only.

### D. 10 mechanics with the highest intrinsic musical reward

1. Beats vanishing into ring (M21).
2. A room that wakes and keeps ringing (M22).
3. A chord that locks when the parts settle (M40, M19).
4. A question that resolves (M24).
5. A companion that answers in kind (M18).
6. Earning the right to improvise (M16).
7. A song reassembling from fragments (M26).
8. Layers thickening into chorus (M44).
9. Weather calming under a held note (M43).
10. A melody you generated from your own two-note vocabulary (M25 + M44).

### E. 10 mechanics most compatible with retention testing

1. Onsight / flash / redpoint logbook (M30).
2. Knowledge-gated world (M31).
3. Dark phrases with next-day check (M27 / N10).
4. Silent ghost of yesterday (M08 / N14).
5. Graduated interval recall (M12).
6. Ringing room re-woken unheard (M22 / N01).
7. Warmer/colder re-hunt (M09 / N02).
8. Lighthouse nightly anchor (R01).
9. Lure fading with "tomorrow" as a proofing dimension (M34).
10. Creature's next-day word request (R02).

### F. 10 mechanics most likely to produce meter chasing

1. Balance-board cursor (M05). 2. Error augmentation (M32). 3. Technique/stability scoring (M45). 4. Corridor tracking with visible tolerance (M07 visual). 5. Cents leaderboards (M38 if scored). 6. Loop-and-ramp with a per-repeat number (M28 scored). 7. Flick with narrowing bands (M01 if bands shrink). 8. Assist-as-needed driven by in-assistance performance without a feedback-off criterion (M33 naive). 9. Any "time inside ±10 c" display (Product Firewall row). 10. Composite singing scores (anti-pattern 15).

### G. 5 fundamentally different possible identities for Vocal Tuner

1. **An instrument whose controller is the voice and whose feedback is musical consequence** (F7 family: rooms, beats, bands that follow). Practice happens because playing requires control; nothing is graded. Strongest musical reward; learning claims: none; research: descriptive plus assigned conditions.
2. **A memory game about your own voice** (F5 + F4 + F9: hunts, ghosts, dark phrases, lighthouse). Its native currency is delayed reproduction — which is exactly the missing data (C028). Strongest research alignment; strongest honesty; medium musical reward.
3. **A musical conversation partner** (F6 + F8: companion, questions, creature, relay). Contingent, relational, unscored; social by extension. Strong engagement; learning claims: none; research: L4 and relation data.
4. **A logbook and calibration tool for teacher and student** (M30, M36, M37, annotation slots). Description without verdicts; the teacher interprets. Least "game", most immediately safe, and it is the product the measurement stack already nearly supports.
5. **A world explored by voice** (F12 + M31: cartography, gates, fog). Progression by retained knowledge; open-ended; the most ambitious build.

The identity found weakest by this research: the tuner-with-scores (F2/F3 visual, M05/M45). Not because it cannot be fun — DAM proves it is — but because every version of its fun runs through FW1/FW4/FW16.

A hybrid is likely: identity 1 or 3 as the front, identity 2 as the spine, identity 4 as the hidden layer that teachers and researchers see.

### H. Vocabulary of reusable interaction primitives

The vocal equivalents of jumping / aiming / steering / balancing / dodging / remembering / returning / imitating / responding:

| Primitive | Analogue | Control variable (§4) | What the system senses | Ref / FB (default) | Safety |
|---|---|---|---|---|---|
| LEAP | jumping | target acquisition | first settled frame in coarse band; time-to-band | initial or none / terminal | SAFE-NOW |
| SETTLE | landing (generic) | approximate center | settled center in band ≥25 c | — / coarse | SAFE-DESCRIPTIVE |
| HOLD | balancing | hold through perturbation | time in band while context moves | continuous* / musical | event SAFE; skill H013 |
| RIDE | steering | trajectory (descriptive) | lag and coarse error vs moving reference | continuous* / audio | performance only |
| STEP | moving by a rule | interval relation | center(n+1) − center(n), categorical | initial / terminal | SAFE-DESCRIPTIVE |
| RETURN | returning | return to target | center after excursion vs before | none or sparse / intermittent | SAFE-DESCRIPTIVE |
| KEEP | remembering | memory after removal | center after delay vs reference | initial / terminal | SAFE-DESCRIPTIVE; L1 |
| MIRROR | imitating | sequence movement, direction | contour and relative centers | intermittent / terminal | SAFE-DESCRIPTIVE |
| ANSWER | responding | response to gesture | final relation to frame; contour | intermittent / musical | SAFE (interaction) |
| LOCK | dodging's inverse: meeting | interval relation | relation to sounding context | continuous* / audio | condition-dependent |
| CALL-IT | (no motor analogue) | judge | declared vs measured category | any / about prediction | SAFE |
| SCOUT | exploring | range exploration | visited regions, durations | none / reveal | SAFE-NOW |
| SAY-AGAIN | (learner-triggered reference) | — | count of requests; timing | on demand | condition (C050 caveat) |
| DARK | (assistance state of an item) | — | feedback-off consistency | per item | EXPERIMENTAL (H009) |
| REWIND | undo | — | rewinds per transition | — | usability |
| ONSIGHT / FLASH / REDPOINT | attempt labels | — | condition metadata | per label | instrument |

`*` continuous reference = assigned condition.

Grammar: a *problem* is a sequence of primitives with a reference condition and a feedback condition (e.g., KEEP(3 s) → LEAP → HOLD(4 s, harmony moves) with REF=initial, FB=musical, then CALL-IT). A *game* is a set of problems wrapped in one of the identities. A *probe* is a problem with REF=none, FB=none, item=untrained or delayed, label=ONSIGHT. Nothing in the grammar can express "score = cents".

### I. The 15 (16) novel concepts — see §18: N01 Ringing Room, N02 Warmer/Colder/There, N03 Call It, N04 Farnsworth Songs, N05 SKATE, N06 Weather Voice, N07 Onsight Ledger, N08 Answering Machine, N09 Beat Killer, N10 Dark Phrases, N11 Range Cartography, N12 Two-Note Language, N13 Finish the Sentence, N14 Ghost of Yesterday, N15 Healing Phrase, N16 The Relay.

### J. The 5 radical concepts — see §19: R01 The Lighthouse (ritual), R02 The Creature that only understands contour (musical creature), R03 The Band that follows you (instrument), R04 Sonic Cartography (world), R05 The Relay Station (collaborative environment).

### K. 5 design questions that require prototypes, not literature

1. **Can untrained singers hear beats and resonance through their own voice?** Vibrato, breathiness and the mic path may make sound-consequence feedback (M21, M22) inaudible or misleading for exactly the learners it is meant for. Only a prototype with real voices answers this (and it interacts with H010/E-G).
2. **Which removal regime keeps people playing — earned per item, scheduled, or player-chosen — and does play time under removal relate to next-day blind performance?** The engagement half is a prototype question; the learning half is E-A. They must be measured in the same build.
3. **Does prediction-before-reveal (Call It) change the next attempt, and do learners find it a game or a test?** Nothing in the canonical base speaks to self-prediction in singing.
4. **Does a contingent companion read as conversation or as a gate?** Contingency thresholds (what counts as an event) are a feel question with a scientific constraint (coarse, relational). If it feels like a gate, the identity collapses into a drill.
5. **What hidden band feels responsive without inviting narrowing?** H007 says bands near ≈20–25 c; whether 25 vs 50 c *feels* like cause-and-effect in a weather/room mapping, and whether designers can resist narrowing it, is a prototype-and-process question.

### L. What should NOT be designed yet

Because the evidence base does not support the necessary assumption:

1. Any score derived from cents tighter than ≈25 c (FW1, FW2, H007 unresolved).
2. "Stability" or within-note spread as a learner-facing quantity (no perceptual counterpart).
3. Onset/attack scoring (H005 demoted; E-D pending).
4. Vibrato quality scoring (descriptive only; ×0.71 attenuation; C035/C036 ambiguity).
5. A global singing score or rank (FW16; C011, C030, C031).
6. Mastery labels from in-feedback performance (FW4/FW5; C028).
7. A drone or continuous-reference *curriculum* — helpful or harmful (FW10–FW13; C046; Graveyard).
8. Perception-only modules sold as production training (FW9; C016 weak null).
9. Adaptive difficulty driven by per-frame cents (C054; Goodhart).
10. Song-transfer promises from note or phrase play (FW6/FW7; H003).
11. Phenotype routing (H011/H014 hypotheses) — descriptive profiles may be logged, never shown as "your type".
12. Any mechanic that requires perceived pitch of real sung notes to equal a chosen center definition (H010; E-G pending) — centers stay versioned and internal.

What *can* be built now, from §9 of the canonical base plus this pass: the item registry with onsight/flash/redpoint labels; condition assignment for reference and feedback regimes; the delay ladder; call-it judgement logging; resonator/beat prototypes as audio experiments; the dark-phrase state machine with a feedback-off criterion; the ghost pipeline from M1 capture.

## 22. THE MOST IMPORTANT RULE — can vocal control itself become a playable medium?

Yes, with a precise answer to *which* control.

A medium is playable when its control variables are (a) continuously available to the player, (b) sensed by the player without an instrument, (c) sensed by the system honestly enough to react, and (d) composable into problems whose difficulty comes from structure rather than from tolerance. Aiming, jumping, steering and balancing satisfy all four in games because the game *is* the physics: the consequence is the feedback.

For the voice, the variables that satisfy all four today are: direction, arrival (LEAP), coarse settling (SETTLE), holding while the context moves (HOLD), stepping by relation (STEP), returning with sparse cues (RETURN), keeping across delay (KEEP), mirroring and answering gestures (MIRROR, ANSWER), meeting a sounding context (LOCK), scouting the range (SCOUT), and predicting one's own outcome (CALL-IT). Each has a coarse, honest sensor in the measured stack and a musical consequence the ear already values.

The variables that do *not* satisfy the conditions — instantaneous cents, within-note spread, onset shape, vibrato quality — fail (b) and (c): the player cannot sense them without an instrument, and the system cannot sense them honestly (C054, H010). Building a medium on them produces exactly one game: the meter. That is why the tuner, however polished, is not a medium; it is an instrument reading.

The research finding of this pass is that the world's most engaging calibration systems already externalise consequence rather than error — beats, ring, a lit lamp, a creature's reply, a dark phrase, a lit room — and that every one of those consequences can be attached to a coarse vocal control event without violating the firewall. The playable medium is not "pitch accuracy"; it is *relation, arrival, holding, returning, remembering and answering*, rendered as consequence. The precision the tuner measures remains what it is under the canonical base: a descriptive research quantity, versioned and internal.

Open, and only answerable by prototypes and by E-A: whether playing this medium changes the voice outside it. The medium can be built so that this question is asked on every night the lamp is lit.

---

### Appendix: firewall flag index

FW1 — M01 (bands), M05, M22 (bandwidth creep), M32, M43 (band creep), M45, anti-patterns 2, 11 · FW2 — M25 criterion note, L-1 · FW3 — M22, N01 (resonance follows f0) · FW4/FW5 — M05, M11, M27 (criterion), M32, M33, M48, §10 rule · FW6/FW7 — M03, M14, M15, M23, M24, M25, M26, M28, N04, N12 · FW8 — none relied upon · FW9 — M10, M13, M37 · FW10–FW13 — M04, M07, M08 (audible ghost), M17, M19, M21, M38, M40, N09, N14, group drones (§16) · FW14 — M01 (onset not scored), M45, L-3 · FW15 — M04, N06 · FW16 — M16, M24, M45, anti-pattern 15.

Graveyard check: no mechanic relies on "mapping is the core deficit", "initial pitch error measures feedforward", "notes/songs separate", "drones harm/help", "drift is not a skill", "contour irrelevant", "experts ≈43 c off", "10 c bands too strict/useful", "τ=0.14 s", "70 c/120 ms → 5–8 c", or a single expert trajectory. Where a mechanic *touches* one of these (M04/N06 drift; M07 contour; M21/N09 drones; M45 expert deviation), it is marked as an assigned condition or as descriptive only.

Sources for verified product details (this pass): DAM Seimitsu Saiten DX-G (clubdam.com); JOYSOUND Bunseki Saiten III (joysound.com); Rock Band 3 harmonies (GameFAQs board summary); Rocksmith Remastered Dynamic Difficulty (theriffrepeater.com); osu! wiki (Hard Rock / mods); Rhythm Heaven (TV Tropes stage notes); PaRappa the Rapper wiki (Modes); Wandersong singing mechanic (david-bailly.com); One Hand Clapping review (fingerguns.net); Trombone Champ (Wikipedia); Blob Opera (experiments.withgoogle.com); Elite Beat Agents (Wikipedia); Koch/Farnsworth (justlearnmorsecode.com); error augmentation vs reduction review (J NeuroEng Rehabil 2018); TrainerRoad ERG mode; Zwift RoboPacers (zwiftinsider.com); Concept2 forum (pace boat); Voltaic benchmarks; aim-trainer transfer pilot (Frontiers Sports & Active Living 2024); Archery360 (blank bale); Shooting Illustrated (calling shots); temporal occlusion meta-analysis (Sports Medicine 2024); gameSense; deCervo uHIT; Grassroots K9 (3 D's); LSVT Global blog; Goldstein, King & West 2003 (PNAS); zebra finch tutoring (Animal Behaviour 2022); Elvie Trainer review (reviewed.com); Muse S review (Forbes); The Decision Lab (streak creep); ELSA Speak blog; Pimsleur blog (graduated interval recall); UCLA Kellman Lab (ARTS); Larkwire; Forza Motorsport 3 (Wikipedia); Gripped (onsight/flash/redpoint). Items marked `[K]` were not re-verified.
