# VOCAL TUNER — ADVERSARIAL PRODUCT / GAME DESIGN REVIEW v1.0

Inputs: CANONICAL RESEARCH EVIDENCE BASE v1.0; MECHANICS DISCOVERY PASS v1; LX ARCHITECTURE SYNTHESIS v1 (read in full). No new research. Facts about the measurement stack are taken from the canonical base (C054, C055, Product Firewall) and the repository audit (evidence window 500 ms, sufficiency ≥6 voiced samples and ≥300 ms, analysis 30 Hz, display smoothing 25/65 ms, label hysteresis 2 c, ±10 c Practice band, EC/NS/AGC requested off).

Confidence tags: (H) follows from the canonical base or the measured stack; (M) design judgement; (L) guess to be tested.

---

## 1. EXECUTIVE ADVERSARIAL VERDICT

The synthesis is internally consistent and scientifically disciplined, and that is precisely its danger: it is a *lab* with a musical coat of paint, and the coat is thinner than the document believes. Five findings drive the verdict.

1. **Causality is broken by the measurement stack the architecture inherits.** Every "musical consequence" in the synthesis is gated on the *settled* evidence (≥300 ms of voiced samples plus, for resonators, 500 ms of band membership). That is 0.8–1.2 s between arriving on a pitch and hearing the world respond (H). No instrument responds in a second. The "voice as instrument" thesis cannot be delivered by the layer that was built for honest measurement; it needs a second, fast, forgiving sound tier that never writes state. The synthesis conflated the two.

2. **The item-state spine is spaced-repetition flashcards with singing attached** — not partly, but structurally: a due-queue, a cold request, a state transition, next card. The musical consequence changes what the *reveal* sounds like; it does not change the *grammar of the request*. What would change it is making the requested pitch a *role in music that is happening now* (the chord is missing its third) rather than an item in a queue. The synthesis mentions this only in passing (§7 Stage 0) and builds the queue everywhere else.

3. **The partner is an exercise dispenser with a face.** MIRROR → mutate → ANSWER with a motif bank has no reciprocity (the partner never attempts anything and never fails), no co-creation (nothing persists except the log), and its "surprise" is a lookup. Wizard-of-Oz it before writing a line of code.

4. **The invisible research engine is oversold.** With a teacher's studio (single digits to a few dozen learners), per-item random assignment across three fading arms and two grain arms yields no power for E-A or E-B (H). The engine is a *logging discipline* that makes designed studies cheap later; it is not a study. The synthesis should say so, or the team will wait for data that never becomes evidence.

5. **The single-mic, speakers-on case contaminates every sounding reference.** With EC/NS/AGC off (by design), a humming resonator or a returning reference at the target pitch is heard by the detector; hum-on rooms with speakers will wake themselves (H for the mechanism; L for the magnitude on real devices, C055). Headphones, gating or a timbre/register offset must be architectural, not a setting.

Beneath these, the eight-primitive grammar, the coarse-band policy, the five feedback kinds, the fade-guide-keep-consequence rule and the onsight/flash/redpoint labelling survive intact. The choice of the *memory spine* as the product's centre does not: the musicality test (§12) selects the harmonic responder, and the spine must become subordinate to it in the experience even while it remains primary in the ledger.

## 2. WHAT SURVIVES THE ATTACK

- The eight primitives and the reduction (LEAP/SETTLE as phases; LOCK and RETURN as variants; DARK/REWIND as operators). Attacked from every archetype and exploit below; nothing required a ninth primitive, and nothing collapsed two. (H)
- "Tolerance is not a coordinate": a fixed ≥25 c policy. Every attempt to make the product feel more precise for experts (§8, archetype C) ran into the firewall, not into the design. (H)
- The five feedback kinds and their placement (corrective on request; informational terminal; consequence concurrent; world/reflective later). (M–H)
- Fade the guide, never the consequence. Survives, with one exception found: HOLD, where the harmony is both consequence and reference (§16). (H)
- Onsight/flash/redpoint labels as the honest attempt vocabulary; state moves only on feedback-off repeats; unlocks only on blind events. (H)
- The five feedback loops that survived the consequence audit with the fewest caveats: relation chord (L2), warmer/colder (L6), reference-returns-where-it-was (L7), the unresolved question (L11), the band-goes-where-you-are (L12). (M)
- MVP-1's capture (M1) and the versioned centers: the only irreplaceable engineering in the plan. (H)

## 3. WHAT LOOKED CLEVER BUT IS ACTUALLY WEAK

- **Resonators that "keep ringing" as the memory hook.** Lovely on paper; in practice a sustained tone that outlives the voice is (a) a continuous reference for anything sung next (the room becomes a drone, FW10–13 by accident), (b) a mic contaminant on speakers, (c) fatiguing after two minutes. The persistence must be *visual or short*, or the ring must be spectrally distinct from anything the detector would lock to. (H for a and b)
- **JUDGE as a button in the main loop.** A tactile interruption inside a vocal flow, judging a note against a memory that is itself the thing being tested (after 10 s the learner is comparing two faded traces). Enriches research, interrupts play. The correction *is* the judgement: a re-sung note carries direction implicitly (§10).
- **The daily "home" cold moment as a ritual.** If a learner fails it three nights running, the ritual becomes a nightly certificate of inability. The ritual must *always end lit* (the cold attempt is logged; then the hum comes and the learner finds home). (M)
- **Silence as informational feedback** ("nothing wakes"). For the "I can't sing" archetype, silence is indistinguishable from "the mic is broken". Silence is never feedback; every voicing must produce an acknowledgement. (M–H)
- **The map as ledger view in MVP-2.** It renders states the learner does not yet have enough of to make a map meaningful (weeks of items). Premature; a list is honest and faster.
- **Mutations of the *model* as "surprise".** Surprise comes from transformations of *the learner's* material, including their inaccurate version; mutating the bank is a playlist.
- **The claim that E-A/E-B run "inside play".** See verdict 4.
- **Words named "rain", "door".** Cute, and infantilising for archetypes B, C, E, H (§8); names should be optional and learner-given.

## 4. THE 20-SESSION DECAY ANALYSIS

Simulated under the proposed MVP ladder (MVP-0 sessions 1–5, MVP-1 by session 10, MVP-2 by session 20), one learner of archetype B (amateur), ten-minute sessions unless noted. Ruthless reading.

**Session 1 (MVP-0).** 0:00 mic permission; 0:30 "sing anything for 30 s" (range calibration) — the learner does not know what to sing; sings a scale; 1:00 five targets chosen; 1:15 tone (1.5 s) → immediate sing → three buttons appear → taps "on" → the tone returns with a fifth, a chord. First delight: the chord. 2:00–6:00 twelve more trials at 0 s and 3 s; the buttons stop being read; the learner taps "on" reflexively, then notices the reveal disagrees, then starts listening to the reveal instead of to their own note. 6:00–9:00 10-s delays: the countdown feels like a test; the learner hums the note to themselves during the delay (exploit E-11) — the app cannot tell; 9:30 home at 10 s; 10:00 end. Why another attempt? Because the chord is pleasant and the loop is fast. What was musical: the reveal chord. What was complicated: the buttons.

**Session 2.** 0:00 "sing home" with nothing sounding — the learner sings something; the reveal shows home was a fourth away (a coarse arrow); no consequence except the reference now sounding. First flinch. 0:30 flashes of the other four; 2:00–10:00 the same loop as session 1 at 3 and 10 s with the same five targets. Changed since session 1: nothing except the memory of failing home. Novelty decaying: the chord (same chord); the buttons (already ignored).

**Session 5.** The learner knows the five targets by *order* if the scheduler is not randomised, and by *feel* if it is (they are in a narrow comfortable range). Delays are 10 s throughout. The learner has learned to sing a straight, loud, slightly nasal tone because the reveal comes faster and "on" is more frequent (exploit E-4, detector-friendly phonation). Session length has fallen to six minutes. What is more autonomous: nothing; the app poses everything. What is more expressive: nothing. Quit risk: high unless MVP-1 lands.

**Session 10 (MVP-1).** 0:00 blind block: "wake what you can" in yesterday's room — 60 s of singing into a room that responds to two of six resonators; the other four stay silent (silence = failure, §11). 1:00 guided finds with hum; resonators wake ≈1 s after arrival (settled gating); the learner learns to hold and *wait*; the ring is nice; by 4:00 four tones are ringing at once and the room is a cluster; the learner starts to dislike the sound. 5:00 a cold request: "wake the fourth one" — the learner tries three pitches; the second neighbour wakes; informative but slow. 8:00 a second room in a new key: the same thing. 12:00 end. Changed: two keys, states, a blind block. More difficult: delays and cold requests. More musical: marginally — a lit room is a chord. More complicated: rooms, states, hum on/off ("why does that room hum and this one not?"). Loops that still hold: waking a neighbour and sliding to the right one (L3) is interesting; keeping the room alive is a juggling task with mild appeal.

**Session 20 (MVP-2).** 0:00 dark-phrase check (blind), 1:00 the partner sings a three-note word; the learner mirrors; the partner plays back the learner's take (their own voice — the first time they hear it in-app; discomfort for many, §11), then the model; the difference is audible; 2:00 mutation; 3:00 "from where you are, go to 5" — the triad reveals minor instead of major; the learner does not know what "minor" implies for their pitch (archetype B/F cannot map chord quality to direction; E can); 5:00 a question phrase; the learner answers; cadence hangs; the home hums; 8:00 Koch: "a new degree has joined" — this is the first *growth* event since session 1; 10:00 free dialogue with the partner keeping the frame — the first *expressive* minute in twenty sessions. 15:00 end. Changed: words, a partner, relation chords, a growth event. More expressive: the free dialogue (one minute). More autonomous: the learner chooses which word. More musical: cadences. More complicated: states × rooms × words × arms ("this room hums, that phrase went dark, the creature forgot Tuesday's word").

**Session 50.** Two futures. (i) The learner has folded the app into a four-minute daily warm-up: home, one room, one word, the free minute. The world/creature/fog are unread; the ledger is rich; nobody looks at it. (ii) The learner left around session 25 when the word bank started repeating and the free minute stayed one minute. Neither future contains songs, and the learner (B) came for songs.

**Why another attempt, honestly:** in sessions 1–5, the chord and the speed; in 10, the neighbour-wakes loop; in 20, the free minute and the growth event. Everything else is compliance.

**Novelty that will decay:** the bloom chord (by session 3); resonator timbre (by 8); the judge buttons (by 2); fog/visuals (immediately, since they are rare); the creature's face (by 15); mutations of the bank (by 25).

**Loops that remain intrinsically interesting after novelty:** (1) HOLD while the harmony moves under you — open-ended, musical, never the same twice; (2) STEP with the relation chord — for anyone who can hear chord quality; (3) free ROAM with a harmony that follows — an instrument; (4) the neighbour-wakes-slide loop — a small but real skill loop; (5) ANSWER with a frame — the only expressive loop; (6) a partner that *also attempts* (not in the synthesis). KEEP at growing delays decays into a test by session 5; cold requests never become fun, only tolerable.

**What merely became more complicated:** item states, rooms with different conditions, arms, the map, the ledger. None of it is felt as capability; all of it is felt as bookkeeping unless it is invisible.

## 5. FLASHCARD-RISK ANALYSIS

**Where the spine is flashcards, exactly:**

| Synthesis element | Flashcard equivalent | Verdict |
|---|---|---|
| item registry with onsight/flash/redpoint | card with "new / seen / learned" | identical |
| due schedule with expanding delays (3 → 10 → 30 s → day → week) | spaced-repetition interval | identical (Pimsleur-shaped by design) |
| cold request ("wake the fourth one", "the word for rain") | card front | identical |
| coarse outcome moves state on feedback-off repeats | grade → interval update | identical, with a better criterion |
| opening blind block | daily review queue | identical |
| dark phrase | "mature card" | identical |
| musical consequence on the reveal | card back with a sound | cosmetic difference |

So yes: as specified, the spine is Anki with a chord on the back. The musical consequence changes what success sounds like, not what a request is.

**What must be true for retention mechanics to feel like musical play rather than retrieval testing** (no cosmetics, no lore, no XP):

1. **The requested pitch must have a musical function *now*.** A chord is sounding with a hole in it; a phrase has a gap; a bass line needs its root. The request is "complete this", not "produce item 4". The pitch is the same; the reason differs. (Note the firewall consequence: a sounding chord with a hole is *tonal context*, i.e. partial reference; the truly context-free probe still exists and is still a card — keep it rare and label it honestly in the ledger as `bare`.)
2. **The learner's response must change what happens next musically**, not only what is logged. Fill the hole with the third → the chord turns major and the progression continues one way; fill it with the fourth → a suspension and a different continuation. Branching, not grading.
3. **The learner must be able to initiate and to decline.** "Ask me something" and "not now" both exist; the world does not chase.
4. **How the pitch is reached must be audible and allowed**: a slide, an ornament, a swell — expressive routes are heard by the consequence tier, never marked as error (they are descriptive-only under the firewall anyway).
5. **Probe time under 10% of session time**, and never last.
6. **No due-list is ever displayed.** The learner never sees a queue; the partner or the music asks.
7. **Items are roles, not pitches**: "the third of this chord", "the note the phrase needs", "home" — the same f0 target, but the item's identity is relational. This also makes untrained items free (a new chord, a new phrase) and stops the room from being a scale drill.

Condition 1 and 7 are the load-bearing ones. Without them the rest is decoration.

**What stays a card no matter what:** the bare, context-free retention probe required by E-A (no tonal context, no reference). It is the price of the science; it should be one request per session, framed as the partner's question, and logged as `bare` so that the embedded-context probes are not mistaken for it in analysis.

## 6. CONVERSATION / AGENCY ANALYSIS

**Does MIRROR → ANSWER → COMPLETE create conversation?** No. As specified it is: system emits a phrase → learner reproduces → system emits a transformed phrase → learner reproduces or completes → system emits. The learner never sets the topic, the partner never risks anything, and nothing accumulates. It is a dispenser with a face.

**Minimum requirements**, and which mechanics satisfy them:

| Requirement | Minimum condition | Satisfied by | Only pretends |
|---|---|---|---|
| Agency | the learner can start an exchange with their own material, choose direction, and decline | CALL (in the grammar, not in MVP-2); ROAM feeding items | ANSWER with a fixed frame (the frame is chosen for you) |
| Surprise | the partner's output is a rule applied to *the learner's* material, so the learner can influence but not predict it | none in MVP-2 (mutations are of the bank) | "mutate one note of the model" |
| Reciprocity | the partner also attempts things and can fail; the learner can judge the partner | none — the mirror-back is a replay, not an attempt | mirror-back |
| Musical consequence | the exchange sits on a rhythmic/harmonic bed so the turns are music | cadence/suspension (L11) | words in silence |
| Expression | dynamics, timing, ornament are heard and answered in kind, never scored | none (the partner answers pitch classes) | — |
| Co-creation | the exchange persists as something (a loop, a piece, a chain) | Loop garden (M44), relay (N16) — both deferred | the ledger |

**What would make it a game:** (a) the partner *imitates the learner* and sometimes gets it wrong, and the learner says so — reciprocity plus an honest JUDGE that is about the *partner*; (b) the partner's answers are transformations of what the learner actually sang (including "wrong" notes, which become the partner's material — error becomes content, §6.2 of the synthesis promised this and MVP-2 did not deliver it); (c) exchanges are recorded as loops that layer (co-creation) and can be kept; (d) the learner can open with a CALL and the partner must answer within the frame the *learner* set. The cheapest way to find the rules is a Wizard-of-Oz session with Nikolai at a keyboard (§20).

**Where "place" as partner stands:** a place cannot converse; it can only *need* (a hole in a chord). That is fine and it is a different thing; the synthesis was right to keep both posers, but only one of them is a conversation.

## 7. MUSICAL-CONSEQUENCE AUDIT

Four properties are audited separately: GOOD SOUND (pleasant regardless of accuracy), INFORMATION (tells what happened), REWARD (marks success), CAUSE-AND-EFFECT (perceived as *caused by my voice, now*). Robustness columns cover vibrato (±20 c real, ×0.71 measured), scoops (first frames read toward settled, C054), octave errors (mixed windows read the lower octave), unstable detection (dropouts; sufficiency flicker).

| Consequence | Understandable? | Causal link | Sounds good when inaccurate? | Annoying? | Conceals? | Gameable? | Vibrato / scoop / octave / dropout |
|---|---|---|---|---|---|---|---|
| Resonance (room wakes) | yes if ≤5 resonators with distinct timbres; "which one woke" is legible | **broken at ~1 s gating** (settled + 500 ms); perceptible only if a fast tier exists | inaccurate = silence or a neighbour; silence is not good sound | yes: sustained clusters; persistence becomes a drone | conceals magnitude *and direction* unless a neighbour wakes; needs warmer/colder | harmonics wake octave/fifth neighbours; slow sweeps | vibrato ±14 c measured inside 25 c band OK, larger flickers at edges (needs hysteresis); scoop delays the wake (fine); octave error wakes the wrong octave if the room spans >1 octave (keep rooms ≤1 octave); dropouts kill the decay reset |
| Chord bloom (on arrival) | yes (binary) | delayed by settling; acceptable as a *reveal*, not as an instrument response | inaccurate = no bloom; neutral | same chord every time → yes | conceals direction | none | robust (settled-based) |
| Thin/bloom under HOLD | partly: "thick vs thin" is legible; *which way* requires hearing the bass relative to the voice — hard for A/F archetypes | continuous, per-frame → good causality *if* on the fast tier | thin is not ugly; acceptable | flutter at band edges with vibrato → yes without hysteresis | conceals magnitude (fine) | straight tone, loud | vibrato: flutter (hysteresis + slower envelope needed); scoop: fine; octave: bass may sit under a phantom octave — confusing; dropout: thinning that is not the singer's doing |
| Relation chord (STEP) | only for listeners who can hear major/minor/diminished (E, C, some B); for F/A it is "different", which still carries *that* something changed | terminal; acceptable | yes — a minor triad is beautiful even when unintended | no | conceals direction for non-musicians ("minor" ≠ "lower" for them) | none | needs both settled centers; ambiguous near ±50 c → suspension chord (specified); octave errors wreck interval categories (log and treat as ambiguous) |
| Partner mirror-back (own take) | yes, if the learner can hold two versions in memory | terminal; slow (doubles trial time) | own inaccurate voice played back is not good sound for most people | yes if every trial | conceals nothing; over-informs | none | raw playback carries scoops/vibrato faithfully — that is the point — but the *model* is clean, so the comparison is timbre-confounded (C047-type problem) |
| Warmth (warmer/colder) | yes, universally | terminal per candidate; fine | neutral | mildly, if verbose; a sound is better than a word | conceals magnitude by design (good) | sweeping through | robust (settled) |
| Fog | yes (reflective) | n/a | n/a | no | it hides *why* (forgot vs never learned) — acceptable | no | n/a |
| Ghost (fades in on divergence) | yes | during the note → but then the trial is no longer blind | the ghost is a clean voice; sounds fine | if it keeps appearing | conceals nothing | none | ghost fade-in threshold must be coarse and the *silent* run is the probe; fade-in *after* the note preserves blindness |
| Harmony follows the voice (band) | yes | per-frame → best causality of all | **always** — this is its problem | can be, if the pad never stops | conceals everything about error (pure forgiveness) | comfortable roots | per-frame is where vibrato/scoop/octave artefacts live: harmony will lurch on octave flips and scoop through chords on attacks; needs 65 ms smoothing + label hysteresis + octave-flip suppression *for sound only* |

**Separation of the four properties, summarised:**
- GOOD SOUND: harmony-follows, relation chord, chord bloom. Resonance and thin/bloom are conditional. Mirror-back is not good sound for most.
- INFORMATION: relation chord (for those who can hear it), warmth, neighbour-wakes, thin/bloom (in/out only), mirror-back (over-informs). Harmony-follows and bloom carry almost none.
- REWARD: bloom, room lit, cadence. Rewards are binary and decay fastest.
- CAUSE-AND-EFFECT: only the per-frame consequences (harmony-follows, thin/bloom) can deliver it; every settled-gated consequence is a *reveal*, not a response. This is the central finding: **the architecture has no fast tier**, and without one the "instrument" identity is a claim, not an experience.

**Consequence of the audit:** the consequence layer must be split into (i) a fast sound tier driven by the smoothed per-frame path (25/65 ms smoothing, label hysteresis, octave-flip suppression for *sound only*), which never writes to the ledger and is allowed to be wrong, and (ii) a slow state tier driven by settled evidence, which is the only thing that moves item states. The firewall permits this: per-frame values are forbidden as *verdicts*, not as *sound*. The two tiers must be audibly different in kind (a pad that follows vs a chord that arrives), or the learner will read the fast tier as judgement.

## 8. PLAYER-ARCHETYPE STRESS TEST

Product/user-intent archetypes only; no scientific phenotypes are implied.

| | Attracts | Confuses | Bores | Infantilises | Too technical | Meaningful | Quits when |
|---|---|---|---|---|---|---|---|
| **A "I can't sing"** | nothing judges; something answers the voice | silence (is it me or the mic?); hum on/off rooms; "degree 5" | KEEP delays (a test they expect to fail) | creature names; "words for rain" | interval categories, keys | the first time a chord forms under their voice; home lit | session 2 if home fails and the room stays dark; needs the always-audible acknowledgement and a guaranteed-lit ritual |
| **B amateur** | songs (absent); harmony that follows | why they cannot just sing a song; why rooms differ | the five targets; rooms as scales | creature; fog metaphors | none | STEP with relation chord; HOLD under a moving bass; the free minute | session 5–10 if no song door; session 25 if the bank repeats |
| **C trained vocalist** | descriptive ledger, ghosts, capture | coarse language ("a bit above") when they *know* they were 8 c flat and want to see it; the firewall reads as evasion | most of MVP-0/1 | everything named; the creature | nothing is too technical; it is too *un*technical | HOLD under harmony with vibrato allowed; ANSWER; teacher view with versioned centers | session 1–2 unless the expert/teacher descriptive view exists; they will use a real tuner alongside |
| **D child** | rooms, ringing, creature, warmth | delays; buttons; "onsight" labels | anything ten minutes long; text | nothing (it is for them) | keys, degrees, intervals | waking things; the creature answering | when an adult is not in the loop; when sessions exceed five minutes |
| **E interval-literate musician** | relation chords; STEP; transformations; onsight labels (climbers' ethics resonate) | why tolerance is hidden; why no numbers | single-pitch rooms; KEEP with pure tones | creature names; fog | none | STEP, ANSWER(transform), HOLD, LOCK rooms (they will ask for beats) | session 10 if items stay diatonic and single-note; they will deliberately exploit harmonics for fun |
| **F complete beginner** | responsiveness; no wrong | degrees, keys, "third of the chord", chord quality as information | nothing yet — everything is new for ~10 sessions | nothing | relation chords, arms, states | warmth; home lit; the pad following | when the language path starts using jargon (Stage 1–2) without a bridge |
| **G wants songs** | a song door | why there is no song until month two | rooms, words, everything pre-song | creature | keys | Farnsworth song reassembling; the pad under a song they know | day 1 if no song-shaped thing exists |
| **H improviser** | the band that follows; ANSWER with frame only; LOCK | why the band is deferred; why the partner keeps a frame | items, states, delays, rooms as scales | creature, fog | none | HOLD under moving harmony; ROAM with pad; free dialogue | session 3 if the instrument is not there; they want the deferred part first |

Cross-archetype findings:
- Two archetypes (G, H) want the *deferred* parts first (song door; harmonic responder). The MVP order is inverted for them.
- Two archetypes (C, E) are alienated by coarse language *as verdict-avoidance*; they need a descriptive view with numbers presented as description ("settled center −8 c under this definition; another definition says −3") — firewall-compliant, since the firewall governs *wording*, not visibility to teachers/experts.
- Two archetypes (A, F) need silence never to occur and jargon never to appear before a bridge.
- D needs five-minute sessions and an adult.
- B, the largest group, needs a song-shaped context by session 5 or leaves.

## 9. EXPLOIT MAP

Severity (what it does to learning or data) · Detectability · Matters? · Minimal mitigation (no punitive scoring).

| # | Exploit | Severity | Detectable | Matters | Minimal mitigation |
|---|---|---|---|---|---|
| E1 | Always sing comfortable notes (narrow ROAM calibration → narrow items) | medium | yes (range metadata) | yes for transfer, not for play | items placed at the range *edges* of calibration by the scheduler; calibration re-run monthly; nothing else |
| E2 | Wait for the detector to settle (hold still, breathe, then sing "properly") | low | partly (onset timing) | no — waiting is holding | none; but onset-shape research (E-D) must record that instruction was absent |
| E3 | Scoop/sweep until the consequence activates | medium | yes (monotone f0 trajectory before band entry) | yes for state transitions; no for play | state tier requires *stationary* settled span (internal stationarity gate), not merely band membership; sweeps still ring on the fast tier |
| E4 | **Detector-friendly phonation**: straight, loud, chesty, closed vowel, because it settles faster and blooms sooner | **high** — the app would train an unmusical timbre | partly (vibrato extent, RMS, spectral tilt over weeks) | **yes** — the single most damaging exploit; it is anti-pattern 14 in the discovery pass | fast tier robust to vibrato (hysteresis, slower envelopes); items across vowels and dynamics; never make settling faster for straighter tone; monitor vibrato extent in-app vs in a free recording |
| E5 | Vibrato to cross a band edge | low (measured extent ×0.71; ±20 c real ≈ ±14 c measured, inside 25 c) | yes | rarely | hysteresis on the sound tier; the state tier uses the settled center, which averages vibrato (C038 for synthetic; H010 caveat) |
| E6 | Memorise item order | medium for research | yes if not randomised | yes | randomise; interleave rooms |
| E7 | **Environmental cues: a piano app or a real tuner on the side during cold requests** | high for research validity, zero for play | low (time-to-onset, headphone state are weak signals) | yes for E-A/E-B data | none reliable; label research sessions as supervised; treat unsupervised cold data as descriptive |
| E8 | Repeat only easy items / rooms | medium | yes | for transfer | scheduler chooses; choice is over content within a due set |
| E9 | Humming with closed mouth (detector-friendly, not singing) | medium | partly (spectral) | for vocal transfer | items require vowels (spoken as "sing *ah*", not enforced) |
| E10 | Octave-down singing where the detector reports the lower octave anyway; harmonics waking octave/fifth neighbours | medium | yes (cmndHalf/cmndDouble diagnostics from M1b) | for state transitions | rooms ≤1 octave; fundamental weighting on resonators; log octave hits, treat as ambiguous |
| E11 | Humming/whispering the kept note to oneself during KEEP delays | high for L1 measurement | low (RMS gate catches loud humming only) | yes for research; no for play | filler tasks that occupy the voice (speak a word, breathe out audibly); accept in play; supervised for research |
| E12 | **Reference leakage**: speakers on, hum/reference at the target, detector locks onto the room's own tone | **high** — false wakes, false "on" | yes (wake with no RMS increase from the voice; spectral match to the reference) | **yes** | headphones for any sounding reference (logged); or gate all references off during measurement windows; or hum at a register/timbre the detector will not lock to (risky); the first is the only clean one |
| E13 | Learning the game instead of the voice: the band's edges, the settle time, the hysteresis, the wake latency | high over months | partly (performance drops under a different detector configuration — replay through M1b variants) | yes | keep state criteria coarse and stationary; vary rooms/keys/timbre; periodic re-analysis under alternative windows |
| E14 | Singing loudly to pass the RMS gate rather than singing well | low | yes | no | none |

The two exploits that matter most (E4, E12) are not learner misbehaviour; they are design faults, and both are fixed at the renderer/measurement boundary, not by scoring.

## 10. COGNITIVE-LOAD AUDIT

Load inventory per proposed loop (each item is a concurrent or sequential demand):

| Loop | Listen | Remember | Sing | Attend to consequence | Judge self | Understand room/state | Follow partner | Interpret fog | Musical decision | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| MVP-0 KEEP+JUDGE | ● | ● (delay) | ● | ● | ● (button) | – | – | – | – | 5, with a modality switch (voice → hand → ear) |
| MVP-1 room find | ● | – | ● | ● (which woke) | – | ● (which room, hum?) | – | – | – | 4 |
| MVP-1 cold request | – | ● | ● | ● | – | ● | – | – | – | 4 |
| MVP-2 word mirror | ● | ● | ● | ● (two versions) | – | ● (state) | ● | – | – | 6 |
| MVP-2 STEP | – | ● (home) | ● | ● (chord quality → direction: a translation step) | – | – | – | – | ● | 5 |
| MVP-2 ANSWER | ● | ● (frame) | ● | ● (cadence) | – | – | ● | – | ● | 6 |
| Pad/ROAM (not in synthesis MVP-0) | – | – | ● | ● | – | – | – | – | ● (optional) | 2–3 |

Where it becomes too much: any loop that adds a *translation* step between consequence and action (chord quality → direction for non-musicians; state → what to do; fog → why), and any loop with a modality switch mid-flow (the JUDGE button).

**MVP-0 specifically.** hear → delay → sing → judge low/on/high → reveal has three problems: (1) the button is a modality switch inside a vocal act; (2) the judgement after a 10-s delay compares two memories, not a note to a reference — it measures something, but not what the learner thinks; (3) the reveal then has to serve two purposes (about the note, about the prediction), which doubles interpretation.

Variants compared:

- **sing → consequence.** Lowest load; best flow; the consequence must carry direction or the learner cannot improve (warmth or relation chord, not bloom alone). Research loses explicit judgements; keeps everything else.
- **sing → self-judge → consequence.** Highest load; interrupts flow; yields E-C-adjacent agreement data; likely to become reflexive tapping by session 2 (§4). Research-session variant only.
- **sing → consequence → occasional reflection.** Judge on one trial in four, *after* the consequence, about the consequence ("did the higher neighbour wake?") — keeps flow, keeps some perception data, but measures a different thing (perception of the consequence, not of one's own voice).
- **Implicit judge (not in the synthesis): sing → consequence → the learner may re-sing.** A second settled note within 2 s is an implicit judgement that the first was off, with implicit direction. No button, no modality switch, and it is the natural instrument gesture. Data: correction rate and direction; not an explicit category.

Prototype questions (not decidable from theory): Does explicit judging change the *next* attempt relative to implicit correction? Does it shorten sessions? Do learners tap reflexively (agreement collapses to base rate after N trials)? Does implicit re-singing correlate with explicit judgements in a supervised session? Is chord-quality-as-direction legible to B/F after a 30-second bridge ("when it turns dark, you were under")?

## 11. EMOTIONAL-RISK AUDIT

Singing is vulnerable; the honest language of the firewall can turn that vulnerability into coldness. Situations and principles:

- **Repeated misses.** The world must respond to *every* voicing with something that is not silence and not a verdict: a shimmer at the sung pitch on the fast tier. The learner is never ignored. Misses change *where the music goes*, not whether music happens. (Principle: no silence, no red, always somewhere.)
- **The room stays dark.** A dark room is a locked door; for archetype A it is a diagnosis. Principle: a room is never fully dark — the sung pitch always sounds *somewhere* in it (the shimmer), and the cold request is followed within seconds by the hum so that the item is *found* today whether or not it was *recalled*. Recall is logged; finding is experienced.
- **The creature misunderstands.** A partner that plays back your inaccurate take, then the correct one, twice per word, is a mirror held up to a face. Principle: mirror-back is opt-in, rendered (not raw audio) until the learner chooses raw, and the partner's *own* attempts are also imperfect (reciprocity is emotional design, not only game design).
- **Yesterday's item is forgotten.** Fog is gentle; a dim lighthouse nightly is not. Principle: the ritual always ends lit; the ledger records the cold outcome; the learner sees "found" and never "forgot" — because "forgot" is a claim about L1 the model does not license (identifiability rule) and because it is unkind.
- **Their recorded voice plays back.** Many people dislike their recorded voice; some strongly. Principle: never unannounced; first exposure through the partner's *rendering* of the contour (a clean voice or instrument playing the learner's pitch trajectory), raw audio only on request; ghosts are silent by default.
- **Another person performs better.** Social is deferred; when it comes, no ranking, chains not scores, and a peer's phrase is a *question*, not a benchmark. Ghosts of peers are opt-in.
- **The system refuses to say "correct".** "A bit above" every time, with no "yes", reads as evasion. Principle: the firewall permits descriptive location words — "there", "in the band", "lit", "returned" — and the *consequence* (bloom, cadence) is the yes. Use them. What is forbidden is "in tune", "good", "learned", "mastered". The difference between "there" and "in tune" is small in the ear and large in the claim; use the former without embarrassment.

Where honest language is likely to feel cold, evasive or patronising: "changed since the start" (bureaucratic — say what changed in world terms: "home is lit tonight; it was dim on Monday"); "descriptive only" surfacing to the learner (never surface the epistemology; surface the world); "this is not a skill claim" (never say it; just do not claim); "a bit" as a permanent hedge (alternate with world words); "the creature forgot" (blames the partner for the learner's recall — acceptable once, patronising nightly); any sentence that names a condition ("this room has no hum because you are in the no-reference arm").

## 12. MUSICALITY CORE

**Remove all learning claims: is it still an interesting musical experience?** As specified in the synthesis MVP ladder — mostly no. A chord that arrives a second after you settle is a curiosity for three sessions. A room of ringing tones is a modest sound toy. A partner with a motif bank is call-and-response homework. What *is* musically interesting, independent of any claim: (a) harmony that reorganises itself around what you actually sing, immediately (the band-that-follows, deferred in the synthesis); (b) holding a note while a bass line walks under it and feeling the harmony change *because* you are still there (HOLD, L1); (c) the relation chord — the moment your interval becomes a chord quality (L2), for anyone who hears chords; (d) answering a question so that a cadence happens (L11); (e) hearing beats disappear into a ring (M21, hum rooms with headphones). These are the *only* interactions in the whole architecture that a musician would do for their own sake.

**Remove all audiovisual/world dressing: is the learning loop still meaningful?** Only to someone who already believes in the goal. Hear → wait → sing → "a bit above" → again tomorrow, without a musical bed, is homework by definition, however honest.

**Intersection — the candidate CORE:** *the voice as a harmonic controller with an honest memory.* Concretely: a harmony that follows the sung pitch in real time (fast tier, forgiving, always sounding), inside which three things are asked of the learner — hold while it moves (HOLD), step so that it changes quality (STEP), and, once a day, arrive somewhere before the harmony comes (a bare KEEP: home) — with a ledger underneath. That is simultaneously an instrument (you can just play it), a loop with information (the chord quality and the thinning tell you where you are), and a retention instrument (the daily cold arrival). Everything else in the architecture — rooms, resonators, words, creature, fog, map — is either a *renderer variant* of this core or a *lab* around it.

Note what this does to the synthesis's choice of spine: the *experience* is centred on HOLD/STEP/ROAM with harmonic response (architecture A/B territory), and the memory spine is one bare moment a day plus the ledger. The spine stays primary for *science* and becomes subordinate in *experience*. The synthesis inverted that, and the 20-session simulation shows why it matters.

## 13. COMPLEXITY AUDIT AND DELETION

Classification of every major system:

| System | Classification | Reason |
|---|---|---|
| Action grammar (8 primitives) | ESSENTIAL TO THESIS | it is the thesis: the voice as a set of playable actions; but only FIND/HOLD/STEP/KEEP/ROAM are needed early |
| Consequences — fast sound tier (harmony follows, thin/bloom) | ESSENTIAL | without it there is no instrument and no causality |
| Consequences — slow reveal tier (bloom, relation chord, warmth) | ESSENTIAL (relation chord, warmth); USEFUL (bloom) | carries the information the fast tier lacks |
| Partner (creature, motif bank) | PREMATURE | no reciprocity/co-creation yet; Wizard-of-Oz first |
| Item state (onsight/flash/redpoint × lit/dark × due) | USEFUL, reduced | keep `heard/cold-success/due`; the full lattice is bookkeeping until MVP-2+ |
| Scheduler (due → new → practised, 1–3 cold requests) | EXPERIMENTAL, reduced | one bare cold moment per session; everything else embedded in musical need |
| Rooms (resonator sets as places) | USEFUL as *keys/chords*, CUT as *places* | a room is a key with a chord; persistence-as-place adds nothing yet |
| Map | PREMATURE | renders states the learner does not have; a list suffices for months |
| Ghosts | USEFUL, deferred | needs capture; silent-by-default; a research device more than a game device |
| Words (2–4-note items, Koch growth) | USEFUL, deferred | the growth event is real; the bank is not a conversation |
| Judge (button) | EXPERIMENTAL → research sessions only | replace with implicit re-sing in play |
| Research ledger (attempt/item/probe schema, versioned centers, capture) | ESSENTIAL | the only irreplaceable engineering; it is what makes designed studies cheap later |
| Fading arms | EXPERIMENTAL, downgraded to logging | assignment without N is discipline, not a study |
| Fog / weather / choral hall / echo cave / shelf | CUT (for now) | fail the six-way test at current scale |

**Delete 50%.** Survives: the grammar (FIND, HOLD, STEP, KEEP, ROAM), the fast sound tier (harmony follows + thin/bloom), the relation chord and warmth as reveals, one bare cold moment per session (home), a reduced item state (`heard / cold-success / due`), the ledger with capture. Cut: partner, words, map, rooms-as-places, ghosts, judge button, fog and the rest of the world, arms as experiments, the scheduler's queue.

**Delete another 25%.** Survives: **a harmony that follows the actual voice (fast tier); HOLD while it moves; STEP that changes its quality; one cold arrival a day; a ledger.** That is the irreducible product.

## 14. THE IRREDUCIBLE PRODUCT CORE

*Sing, and the harmony organises itself around what you actually sang, now. Hold, and it moves under you. Step, and it changes colour. Once a day, arrive somewhere before it comes. Everything is remembered; nothing is graded.*

Four verbs (ROAM, HOLD, STEP, KEEP), one renderer (harmonic response, fast tier for sound, settled tier for the ledger), one bare probe a day, one ledger. It is an instrument you can just play (archetypes B, H, F, A), it carries information in chord quality and thinning (E, C), and it produces a daily retention series (science) without a queue. It has no partner, no rooms, no map, no words, no fog. Those are all *additions to* this core; none of them is *the* core, and the synthesis's MVP-0 (KEEP + JUDGE) is the core's least musical corner.

## 15. MVP-0 ALTERNATIVES

The proposed MVP-0 (KEEP + JUDGE + chord bloom) against three radically smaller prototypes, each buildable in 1–3 days on the existing detector, keyboard/drone, evidence and history. No numeric ranking; trade-offs only.

**P0 — KEEP + JUDGE + bloom (as proposed).** Delight: one chord, decays by session 3. Clarity: high (a note, a wait, a reveal). Musicality: low — the chord is a reveal, not music. Scientific usefulness: highest of the four *for research* (delay curve, agreement matrices, four centers) — but only if learners keep tapping honestly, which §4 doubts. Replayability: low (five targets, a test shape). Technical risk: lowest (all pieces exist). Thesis expression: weak — it demonstrates honesty and memory, not "the voice as a control medium". Verdict: a good *research session* protocol; a poor first playable.

**P1 — THE PAD (harmonic responder).** Build: nearest-degree classification on the smoothed per-frame path (25/65 ms smoothing and 2 c label hysteresis already exist) → a pad synth (Web Audio) voiced so the sung degree is root, third or fifth of a diatonic triad in a chosen key, with voice-leading between chords, octave-flip suppression for sound only, attack ≈80–120 ms to hide detector latency. Add HOLD: when the sung degree is stable ≥2 s (settled tier), a bass line starts walking a progression under it; the pad thickens while the voice stays inside the band, thins outside; on the bass's return home, a cadence if the voice is still there. Everything logged descriptively; nothing scored. Delight: immediate and repeatable (an instrument). Clarity: high for "it follows me"; medium for "why did it change colour" (the relation chord emerges for free: sing a third → minor/major). Musicality: highest of the four. Scientific usefulness: low alone (no items, no probes); moderate as a *descriptive* source (hold durations under perturbation, degrees used, range). Replayability: high (keys, progressions, ROAM). Technical risk: medium — per-frame artefacts (scoops through chords, octave flips on attacks) will be audible and must be smoothed; the pad must not sound like a demo synth. Thesis expression: strongest — this *is* "vocal control as a playable medium". Missing: the honest memory; add one bare cold moment (P3) and it becomes the core.

**P2 — WARMER / COLDER HUNT.** Build: a hidden target inside the calibrated range; the learner sings candidates; after each settled note a single sound-word (a rising or falling shimmer, or the words "warmer/colder"); inside 25 c → "there" and the target sounds with the voice plus a fifth. Re-hunt the same target after 30 s and next session. Delight: moderate (search is curious); decays by session 5. Clarity: highest of all (direction only). Musicality: low. Scientific usefulness: good (search efficiency, C014 re-hunts, hidden-band feel — H007 adjacent). Replayability: medium (targets vary; the loop does not). Technical risk: lowest. Thesis expression: medium — no meter, no note name, honest; but it is a search game, not a medium.

**P3 — HOME AND RETURN (the lighthouse alone).** Build: day 1, find home with the hum; then ROAM freely with a minimal pad (a single pad voice following the pitch); after ≥60 s away, "come home" with nothing sounding; the pad tells you where you landed (it forms the chord of the place you actually reached); then the hum comes and you find home; lit. Next day, the same two moments. Delight: the return moment is quietly satisfying; the ROAM is pleasant if the pad is good. Clarity: high (one verb: return). Musicality: medium (the pad). Scientific usefulness: high per minute — a daily anchor series (C013-type), return-after-own-excursion (KEEP with own filler), all on one item; small but clean. Replayability: as a ritual, high; as a game, low. Technical risk: low. Thesis expression: strong on memory and honesty, weak on instrument.

**Trade-off summary.** P0 maximises data and minimises music; P1 maximises music and thesis and minimises data; P2 maximises clarity; P3 maximises science-per-minute and ritual. The combination P1 + P3 — a harmonic responder you can play, with one bare arrival a day — is the irreducible core of §14 and costs about three days. P0 becomes a *supervised research-session mode* (JUDGE explicit), not the first thing a learner meets. P2 is the right first *cold* mechanic when items multiply (MVP-1), replacing "the room stays dark".

## 16. FUNDAMENTAL VS DESIGN-SOLVABLE CONTRADICTIONS

| Contradiction | Nature | Why |
|---|---|---|
| Instrument responsiveness (fast, forgiving, per-frame) vs honest measurement (slow, settled) | **design-solvable** | two tiers: sound never writes state; state never drives sound *timing*; they must be audibly different in kind |
| Musical forgiveness vs informative feedback | **fundamental**, partially solvable | a harmony that always sounds good carries no error; information requires something *not* to happen or to happen *elsewhere*. Solution space: forgiveness in the fast tier, information in *where* the harmony went (relation chord, thinning), never in *whether* it sounded — the residue is that a forgiven learner may never seek the information |
| Retention measurement vs flow | **fundamental** | a bare cold probe is a test and cannot be dissolved; it can be one, short, framed, and never last — the residue is one test a day |
| World persistence vs experimental neutrality | design-solvable at the cost of agency | if rooms carry conditions and learners choose rooms, assignment breaks; if rooms are assigned, agency breaks. Resolution: conditions live on *items within* a room, never on rooms the learner chooses; and at studio scale, assignment is logging, not experiment (§17 F9) |
| Personalisation vs experimental assignment | **fundamental at scale**, moot at studio scale | with N in the tens, no assignment yields evidence; personalise freely, log conditions, run designed studies separately |
| Creative agency vs controlled measurement | **fundamental** | ANSWER and ROAM are unscorable by design; accept: creative modes are logged, never measured; measurement lives in FIND/HOLD/STEP/KEEP |
| Assistance fading vs musical richness | design-solvable except for HOLD | "fade the guide, keep the consequence" works everywhere except HOLD, where the moving harmony is both the consequence and a continuous reference; HOLD is therefore *always* an E-E-style condition and never a faded item — accept and label |
| Coarse categories vs expert users | **fundamental for verdicts**, solvable for description | the firewall governs wording and learner-facing verdicts; a teacher/expert *descriptive* view may show settled centers under named definitions with the wording rules; experts get description, never a grade — some will still leave |
| Sounding references vs single-mic measurement | technical but architectural | headphones for any sounding reference, or measurement-window gating; without one of these, hum-rooms and KEEP reveals self-contaminate |
| Scientific honesty vs emotional warmth | design-solvable | world words ("lit", "there", "returned") are both honest and warm; the failure mode is surfacing the epistemology, not the honesty |

## 17. TOP 10 FAILURE HYPOTHESES

| # | Hypothesis | Early warning signal | Cheapest test | What we change if true |
|---|---|---|---|---|
| F1 | **Latency destroys causality**: settled-gated consequences (~1 s) are experienced as reveals, not responses; "voice as instrument" is a claim | learners say "it's slow" or "it doesn't hear me"; they hold and wait; sessions become staccato | build the pad on the per-frame path and on the settled path; three learners, A/B, ask "did it respond to *you*?"; count spontaneous ROAM time | two-tier consequence; settled tier only for the ledger and reveals |
| F2 | **Silence demoralises**: "nothing wakes" reads as "I am broken" for A/F | first-session drop-off within 3 min; learners tap the mic; ask "is it working?" | watch three A/F learners for 5 minutes with and without an always-on shimmer | no silence, ever; shimmer at the sung pitch on the fast tier |
| F3 | **Cold requests feel like tests** and drive day-2 dropout | day-2 return rate lower with the opening blind block than without; session length falls after the probe | randomise the presence/position of the daily bare probe across sessions; compare return and length | one bare probe, mid-session, framed as the partner's question, always followed by the hum |
| F4 | **Consequences are pleasant but unreadable** — learners cannot say what happened | think-aloud after attempts disagrees with the log; learners repeat identical attempts | after 10 attempts ask "what happened on the last one?"; score agreement with the ledger | warmth/direction words as the default informational layer; relation chord only with a bridge |
| F5 | **Detector-friendly phonation**: the app trains straight, loud, closed tones (anti-pattern 14) | vibrato extent and vowel variety in-app drift lower than in a free song recording over two weeks | record a free verse on day 1 and day 14; compare vibrato/RMS/spectral tilt to in-app | hysteresis and slower envelopes on the sound tier; never faster settling for straighter tone; vowel/dynamics in items |
| F6 | **Users want songs**, and nothing song-shaped exists until month two | day-1 question "what did you come for?" answered "songs"; ROAM used to sing songs anyway | offer a "sing a song over the pad" mode on day 1 with no items; measure usage | a song door in MVP-0/1 (pad under a known song; Farnsworth gaps later), no claims |
| F7 | **Reference leakage** on speakers wakes rooms and confirms KEEP with no singing | wakes with no voice RMS; "on" outcomes cluster with headphones off | play the hum through speakers with nobody singing; count wakes on three devices | headphones mandatory for sounding references (logged); or gate references during measurement windows |
| F8 | **The partner is a dispenser**: exchanges feel like drills with a face | learners skip the partner; free minute is the only used minute | Wizard-of-Oz: Nikolai as the partner at a keyboard for 10 min with two learners vs the motif-bank build; ask which was a conversation and why | reciprocity (partner attempts and fails), learner material as source, loops as artefacts; or cut the partner |
| F9 | **The research engine yields nothing**: N per arm never reaches evidence; choice confounds conditions | after a month, arms have 3–8 learners each; conditions correlate with preference | count learners per arm; check whether room choice predicts condition | treat assignment as logging discipline; run E-A as a designed study with volunteers in supervised sessions |
| F10 | **Experts and teachers reject the coarse language** as evasion and use a real tuner beside it | C/E archetypes ask "how many cents"; teachers open another app | show three trained singers the learner view, then a descriptive view with named centers; ask what is missing | a descriptive expert/teacher view with versioned centers and wording rules; learner view unchanged |
| F11 (bonus) | **Items-as-pitches make rooms scale drills** | session-5 boredom in B/E; "it's just a scale" | ask after session 5 what a room *is* | items as roles (the third of *this* chord); rooms as chords/keys, not pitch sets |

## 18. KEEP / CHANGE / CUT / PROTOTYPE / EXPERIMENT LEDGER

**KEEP**
- Eight-primitive grammar; LEAP/SETTLE as phases; LOCK/RETURN as variants; DARK/REWIND as operators.
- ≥25 c coarse-band policy; tolerance not a coordinate; one coordinate moves at a time.
- Five feedback kinds and their placement; corrective only on request.
- Onsight/flash/redpoint labels; state moves only on feedback-off, *stationary* settled repeats; unlocks only on blind events.
- Fade the guide, keep the consequence (with HOLD labelled as a permanent condition).
- Loops L2 (relation chord), L6 (warmth), L7 (reference returns where it was), L11 (unresolved question), L12 (band goes where you are), L1 (thin/bloom) — L1 and L12 on the fast tier.
- Ledger schema, versioned centers, M1 capture as the first engineering priority after the pad.
- All of §11.12 "not yet" and the Graveyard discipline.

**CHANGE**
1. **Split the consequence layer into two tiers**: fast sound tier (smoothed per-frame path; hysteresis; octave-flip suppression; never writes state) and slow state tier (settled, stationary spans; the only writer). Audibly different in kind.
2. **Re-centre the experience on the harmonic responder** (ROAM/HOLD/STEP with harmony that follows); the memory spine becomes one bare probe a day plus the ledger — primary for science, subordinate in experience.
3. **Items are roles, not pitches**; cold requests are embedded in musical need (a hole in a sounding chord, a gap in a phrase) except the one daily bare probe, which is logged as `bare`.
4. **MVP-0 = the Pad + Home** (P1 + P3); **KEEP + JUDGE becomes a supervised research-session mode**.
5. **JUDGE in play is implicit** (re-sing = judgement); explicit buttons only in research sessions.
6. **No silence as feedback**: an always-on shimmer at the sung pitch; rooms are never fully dark; the daily ritual always ends lit.
7. **Headphones rule** for any sounding reference (logged), or measurement-window gating; hum-rooms without it are cut.
8. **Downgrade the research engine** in the product story to *logging discipline*; E-A/E-B are designed studies run in supervised sessions with volunteers; the app makes them cheap, not automatic.
9. **Partner prerequisites**: reciprocity (the partner attempts and fails; the learner judges it), learner material as the source of transformations, exchanges kept as loops; until these exist, no partner ships.
10. **Expert/teacher descriptive view** with named center definitions and firewall wording; learner view unchanged.
11. **A song door early**: "sing a song over the pad" (ROAM with harmony) from MVP-0; Farnsworth gaps later; no claims.
12. **Words unnamed by default**; names optional and learner-given.

**CUT (for now)**
- Map/world in MVP-2 (a list of keys/chords and lit states suffices); fog, weather, choral hall, echo cave, dark-phrase shelf as objects.
- Rooms as *places*; resonators that ring on for a minute (persistence becomes visual or ≤10 s, or spectrally distinct).
- The motif-bank partner as specified.
- Fading arms as *experiments* (keep as logged conditions only).
- Chord bloom as the *only* reveal (keep as one reveal among warmth and relation chord).

**PROTOTYPE BEFORE DECIDING**
- Per-frame vs settled consequence: causality and artefact tolerance (F1).
- Shimmer vs silence for A/F (F2).
- Relation-chord legibility for B/F with a 30-second bridge (F4).
- Wizard-of-Oz partner rules (F8).
- Bare-probe placement and framing (F3).
- Hidden band feel, 25 vs 50 c, on the fast tier's thin/bloom (H007-adjacent feel, not evidence).
- Song-door demand (F6).
- Own-voice playback tolerance (rendered contour vs raw).

**EXPERIMENT BEFORE CLAIMING** (unchanged from the canonical base)
- E-A before any statement about fading, S0, or "retained"; E-B before any grain default or song statement; E-C before interpreting cold-arrival series as ear or map; E-G before any center is called perceived; E-D before any onset display; E-E before any reference default beyond "initial"; E-F before any band change.

## 19. REVISED ARCHITECTURE (only where necessary)

```
ATTEMPT = ACTION × CONSEQUENCE{fast sound tier | slow state tier} × POSER × ITEM-STATE(reduced) → LEDGER

ACTION     : ROAM · HOLD · STEP · FIND · KEEP   (early)     MIRROR · ANSWER · JUDGE   (later / research)
FAST TIER  : harmony follows the sung pitch now (pad, voice-led, hysteresis, octave-flip suppressed);
             thin/bloom under HOLD; shimmer always; never writes state; allowed to be wrong
SLOW TIER  : settled, stationary spans → relation chord, warmth, arrival/return outcomes, item state;
             the only writer; delayed by design and presented as reveals, not responses
POSER      : the music itself (a hole in a chord, a gap in a phrase) · the learner (ROAM, CALL)
             · [later] a partner that attempts and fails · [later] peers
ITEM-STATE : heard / cold-success / due   (+ onsight/flash/redpoint labels in the ledger, not the UI)
BARE PROBE : one per session, mid-session, framed as a question, always followed by the hum; logged `bare`
PLACE      : a list of keys/chords with lit states (no map until states are plural for weeks)
LEDGER     : unchanged schema; versioned centers; capture; conditions logged, not experimented, at studio scale
RULES      : headphones for any sounding reference (or gating); no silence; tolerance fixed; nothing graded
```

Changes from the synthesis are exactly: the two tiers; the poser is first the music and the learner, not a partner; item state reduced; the bare probe made singular and framed; place demoted to a list; the research engine reclassified; the headphone/no-silence rules made architectural. The grammar, the firewall discipline, the ledger and the fork list are untouched. Forks preserved: earned vs scheduled fading (H009), words-first vs notes-first (H003), resonance vs harmony-following as the primary renderer (now leaning harmony-following on causality grounds, undecided until F1's test), partner vs music as poser (music first; partner after Wizard-of-Oz), center definition (H010), band policy (H007).

## 20. THE NEXT THREE THINGS TO BUILD OR TEST

1. **Build the Pad in two variants and test causality (2 days, then one afternoon with three learners).** Variant A on the smoothed per-frame path with hysteresis and octave-flip suppression; variant B gated on settled evidence. Add HOLD (bass walks after 2 s of stability; thin/bloom). Log everything descriptively. Ask each learner "did it respond to you?" and count unprompted ROAM time. This decides F1, gives the first musical experience of the product, and is the irreducible core's first half.

2. **Add Home and the headphone/leakage rule (1 day, same learners).** Day 1: find home with the hum, roam over the pad, return cold, the pad shows where you landed, the hum comes, lit. Day 2: same. Before that, the leakage test: hum through speakers, nobody singing, three devices, count wakes/"on". This gives the daily bare series (the only retention data that needs no queue), fixes E12 architecturally, and completes the core.

3. **Wizard-of-Oz the partner before writing it (one hour, two learners, recorded).** Nikolai plays the partner live at a keyboard: imitates the learner (imperfectly), answers with transformations of what the learner sang, keeps a frame, sometimes fails and lets the learner correct him. Then the same learners get five minutes of the motif-bank sketch (can be a hand-driven mock). Ask which was a conversation and what made it one. Extract the reciprocity rules from the recording. This decides F8 and whether a partner exists in MVP-2 at all.

Not among the three, deliberately: rooms, resonators, words, the map, arms, the JUDGE button. Each waits on one of the tests above.

---

Confidence: the latency finding (F1) and the leakage finding (E12) follow from the measured stack (H); the flashcard and dispenser findings are structural readings of the synthesis (H); the archetype and emotional judgements are design reasoning (M); the claim that the Pad + Home core is the right first playable is the review's strongest *opinion* and is exactly what the three next steps test (M, falsifiable in a week).
