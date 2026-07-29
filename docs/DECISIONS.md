# Architecture Decision Log

## ADR-001 — Start as a web application

Status: accepted

The first version will be a mobile-first web application rather than a native App Store application.

Reasons:

- fastest path to testing;
- accessible through one link;
- avoids store availability problems;
- simpler deployment;
- sufficient browser audio capabilities for technical validation.

Revisit when browser limitations materially block the product.

## ADR-002 — No backend for MVP

Status: accepted

Pitch analysis and reference tones will run locally.

Reasons:

- privacy;
- lower complexity;
- no account requirement;
- no infrastructure cost;
- lower latency.

## ADR-003 — Canvas for the pitch monitor

Status: accepted

The scrolling pitch history will use Canvas rather than one DOM element per point.

Reasons:

- high update rate;
- efficient custom rendering;
- predictable mobile performance;
- easier timeline scrolling.

## ADR-004 — Fractional MIDI for graph coordinates

Status: accepted

Pitch will be represented as fractional MIDI values for visualization.

Reasons:

- equal spacing for semitones;
- direct mapping to note names and cents;
- simpler vertical layout.

## ADR-005 — Separate raw, filtered, and rendered pitch

Status: accepted

The system will retain conceptual separation between detector output, musical filtering, and visual smoothing.

Reasons:

- easier debugging;
- less misleading display behavior;
- future analytics;
- safer tuning of the UI.

## ADR-006 — Direct browser microphone lifecycle

Status: accepted

Microphone capture uses `navigator.mediaDevices.getUserMedia` directly. The application first requests mono audio with echo cancellation, noise suppression, and automatic gain control disabled. If a browser rejects those optional constraints as over-constrained, it retries once with `{ audio: true, video: false }`.

The React hook owns lifecycle coordination while dedicated modules own capture and level monitoring. Active streams, track listeners, animation frames, audio nodes, and the level-monitoring `AudioContext` are released through one idempotent cleanup path. No audio samples are stored, recorded, logged, or uploaded.

## ADR-007 — Local YIN detector for the technical spike

Status: accepted provisionally

The first monophonic detector is a local TypeScript implementation of YIN. It uses the microphone lifecycle's existing stream and a shared `AnalyserNode` graph for both RMS level and pitch analysis, avoiding another stream or `AudioContext`. No third-party detector dependency or license obligation is introduced.

YIN was selected for its direct fundamental-period estimate, normalized confidence signal, small bundle impact, and testability with generated signals. McLeod Pitch Method was considered but deferred because its normalized square-difference and peak-selection path adds complexity without clear evidence of better results for this first browser spike. The decision must be revisited after real-device and varied-voice testing.

## ADR-008 — Separate raw YIN candidates from application acceptance

Status: accepted

YIN now always exposes the best raw candidate and CMND evidence before application filtering. The prior implementation calculated confidence only after crossing a strict CMND threshold, so plausible harmonic candidates that missed that threshold appeared as 0% confidence and their rejection stage was invisible.

Detector samples have their buffer mean removed to tolerate DC offset, while RMS remains measured from the untouched input. Amplitude normalization and Hann windowing are intentionally omitted: YIN is amplitude-scale invariant, normalization could promote quiet noise, and an amplitude window distorts time-domain period comparisons. Provisional defaults are RMS 0.005, YIN CMND 0.35, and confidence 0.70. A narrowly scoped candidate rule prefers a full-period minimum over a half-period harmonic only when it is approximately twice the lag and materially stronger.

## ADR-009 — Equal-temperament musical pitch conversion

Status: accepted

Accepted detector frequencies convert through a browser-independent twelve-tone equal-temperament layer. A4 defaults to 440 Hz, with a validated future configuration range of 400–480 Hz. MIDI numbering follows C4 = 60 and A4 = 69, and internal/display names use sharps only.

Nearest-note selection uses `Math.round`, so exact half steps select the higher integer. Musical pitch remains separate from raw detector results and contains no history, smoothing, or scoring. Only detector results accepted as `detected` are converted; rejected raw candidates remain diagnostic data.

## ADR-010 — Timestamped bounded pitch history

Status: accepted

Pitch history stores immutable accepted musical points using monotonic detector timestamps and fractional MIDI. Rejected or silent input creates sparse null gap points, preventing a future renderer from connecting through unpitched intervals. Regular pitch sampling is capped at 15 points per second, while gap transitions and changes of at least 0.5 semitone are preserved immediately.

History retains 15 seconds by default, with validated 5–60 second configuration. Trimming uses timestamp cutoffs and an optional cutoff boundary point, keeping normal memory near 225 points. A successful microphone Start clears and activates a fresh in-memory session; Stop freezes it; Clear empties it without affecting capture or the current note. No persistence, timer, rendering state, or backend is introduced.

## ADR-011 — Validated semitone-center Canvas viewport

Status: accepted

The pitch monitor grid uses a typed, validated Canvas viewport with an inclusive fixed C3–C5 range. Each integer MIDI note occupies the center of one equal-height band, so fractional MIDI maps continuously and half-semitone boundaries meet the graph edges. A graph-relative present marker defaults to 80% of graph width.

Canvas CSS and backing-store sizes remain separate, with device-pixel ratio normalized to 1–3. Rendering resets the transform before clearing and applies an absolute DPR transform. A configuration-only, React-free renderer draws the grid after observed size or configuration changes; it does not receive history, detector state, or create an animation loop. Note labels reuse the shared music conversion utilities.

## ADR-012 — Layered timestamp-driven pitch curve

Status: accepted

Live pitch history uses a transparent foreground Canvas over the static grid Canvas. Both layers share the validated viewport, backing dimensions, DPR, and fractional-MIDI mapping. This keeps the grid out of the animation cadence while allowing the curve layer to clear independently.

The 15-second historical interval spans graph-left to the existing present marker. Active rendering advances with monotonic RAF timestamps compatible with detector `performance.now()` timestamps; Stop freezes the last render reference. Straight segments break at explicit gaps, invalid data, non-monotonic time, intervals over 250 ms, and points outside the fixed time or MIDI range. The React layer owns one cancellable RAF chain and performs no per-frame state update.

## ADR-013 — Rebased history-only pause time

Status: accepted

Pitch-history capture uses explicit `recording` and `paused` states independent from microphone lifecycle. Pause blocks only history ingestion and curve RAF; audio analysis and live tuner state continue. Effective history and render timestamps subtract accumulated paused monotonic duration, so paused wall-clock time neither ages retained history nor shifts the curve after Resume.

Resume arms one sparse gap boundary before the next accepted pitch when retained history exists, preventing connection across the capture break. Clear preserves capture state and pause accounting. Stop resets pause accounting for the next successful microphone session without rewriting retained timestamps.

## ADR-014 — Visualization-only fixed-span graph range

Status: accepted

The graph range is an App-level visualization preference independent from microphone, detector, musical conversion, and history storage. It uses an inclusive fixed 24-semitone span within MIDI 36–84, with C2–C4, C3–C5, and C4–C6 presets. C3–C5 remains the default. Octave shifts move both bounds by 12 and reject boundary overflow without clamping.

Grid and curve layers consume the same validated range. Out-of-range curve points are omitted and break segments but remain unchanged in retained history and live tuner output. The selection survives in-page history and microphone operations but intentionally resets on refresh; no localStorage is introduced without demonstrated persistence need.

## ADR-015 — DOM reference keyboard on the shared semitone viewport

Status: accepted

The vertical reference keyboard uses semantic DOM buttons beside the layered Canvas graph. It replaces the Canvas note-label gutter and consumes the same inclusive visible MIDI range. One CSS-grid row represents each semitone, and shared top/bottom padding makes every key center equal to the existing Canvas semitone-center mapping without per-key measurement.

Interaction is monophonic. A press creates transient pressed state; a completed activation creates persistent in-page selection. Release clears only pressed state. Pointer cancellation, lost capture, blur, unmount, and range changes clean up safely. Roving tabindex provides semitone arrow navigation. As extended in Issue 012, selection is independent from microphone, history, and visible-range state and may remain selected outside the current range.

## ADR-016 — Dedicated lazy monophonic reference-drone engine

Status: accepted

Reference playback uses its own lazily created `AudioContext`, separate from microphone analysis. This keeps speaker-output lifecycle, suspension, errors, and disposal from mutating capture or detector resources. One sine oscillator feeds a per-voice envelope gain, then a protected master-volume gain. The engine retains at most one voice and ramps frequency for note changes rather than overlapping oscillators.

A completed key activation selects and starts a note. Release removes only pressed feedback; activating the sounding note toggles audio off without clearing selection. Start and Stop remain explicit alternatives. Selection and playback survive visible-range changes, including when the note is not rendered. Operation tokens and shared asynchronous lifecycle promises make newer play/stop intent win over stale context-resume or release work. Disposal stops and disconnects nodes and closes the dedicated context. No audio is recorded, retained, logged, or uploaded.

The initial implementation optimistically published `playing` after `resume()` and `oscillator.start()` returned, without proving the context had reached `running` or tracking graph connections. Manual testing exposed a silent graph with a false playing label. The accepted policy now requires post-resume `running`, destination and voice connection confirmation, successful oscillator start and attack scheduling, valid effective gain, and a current operation token. Context `statechange` invalidates active playback when output leaves `running`. Development-only transition diagnostics expose these invariants. This policy confirms Web Audio readiness but cannot guarantee the physical output route.

## ADR-017 — Temporal continuity owns deferred gap confirmation

Status: accepted

Raw YIN results remain unchanged and inspectable. A pure timestamp-driven continuity layer before live/history state defers a gap for at most 160 ms after an established voice becomes uncertain. Recovery requires a new normally accepted raw pitch and emits no duplicated samples; uncertainty beyond the inclusive boundary emits exactly one gap at uncertainty onset. Entry and continuation keep the same raw thresholds, and candidate recovery remains disabled. Canvas retains its independent 250 ms safeguard.

## ADR-018 — Cents smoothing belongs only to marker presentation

Status: accepted

Nearest-note raw cents remain the musical measurement and drive numeric text and stable classification. A separate constant-space display value positions only the cents marker with a 150 ms time-aware exponential response. It never feeds detector, continuity, history, curve, drone, or scoring state.

The marker initializes directly, freezes during uncertainty, hides and resets when unvoiced, and snaps to new note-relative cents when nearest MIDI changes. The semantic range remains ±50 cents; a ±5-cent center band is visual guidance only. Reduced motion selects direct marker updates.

## ADR-019 — Selected-target cents are unbounded and do not wrap

Status: accepted

The persistent reference-keyboard selection, not drone sounding state, defines the practice target. Target-relative cents use `(detectedFractionalMidi - targetMidi) × 100`, remain separate from nearest-note cents, and are never rounded, wrapped, or clamped in the musical result. An inclusive ±10-cent tolerance controls only target classification.

The dedicated target meter presents a bounded ±50-cent view with explicit overflow while text retains meaningful unbounded distance. Its independent 180 ms display-only smoother resets on target changes and no pitch, freezes during uncertainty, and is bypassed for reduced motion. Target comparison never enters detector, continuity, history, Canvas, drone, or scoring state.

## ADR-020 — Practice accounting uses capped previous-observation evidence

Status: accepted

A practice session locks the persistent selected target and requires an explicitly active microphone. Its discriminated idle/running/paused/completed state uses the detector-compatible `performance.now()` origin. Each interval is attributed to the previous observation for at most 250 ms; excess, initial, and post-resume time becomes explicit unobserved time. Active elapsed reconciles measurable voice, uncertainty, no pitch, and unobserved time in constant space.

Measurable voice uses only stable accepted raw target-relative cents and the existing inclusive ±10 tolerance. On-target share divides on-target time by measurable voice, so silence and uncertainty neither count as off-target voice nor lower the denominator. A zero denominator produces no percentage. Practice Pause, history Pause, microphone capture, and drone playback remain independent; loss of active microphone auto-pauses practice and requires explicit Resume.

## ADR-021 — Practice timeline events originate in metric settlement

Status: accepted

The completed practice timeline is an immutable event journal produced by the existing Issue 016 settlement path. Each metric-bearing or unobserved interval appends its exact monotonic start, end, and category at the same point that totals change. Pause boundaries append paused wall-time events on Resume or Finish. The UI never reconstructs chronology from summary totals, pitch history, event count, or interpolated samples.

Completed rendering is DOM-only and memoizes duration and proportional wall-time geometry once from the frozen summary. A one-pixel CSS minimum preserves visibility without changing timestamps, duration, percentage, or neighboring accounting. Segments remain individually focusable for hover, tap, and screen-reader detail. No live timeline, Canvas, animation, timer, persistence, or audio data is added.

## ADR-022 — Git-connected Vercel serves a validated static SPA

Status: accepted

Vercel hosts the existing Vite `dist` output through GitHub Preview Deployments and `main` Production Deployments. A minimal catch-all rewrite supports direct SPA paths while Vercel’s filesystem continues serving hashed assets, the manifest, and icons. There is no custom server, Function, API route, Firebase service, SSR layer, or runtime secret.

Node 22 matches GitHub Actions and is declared in `package.json`. Builds run TypeScript, Vite, then a local deployment validator. Vercel environment and Git values are explicitly selected at build time, validated in one typed module, and shown only in developer diagnostics. Production derives from Vercel build metadata rather than hostname guessing.

Diagnostics and demo query handling use one environment policy. Development and Preview retain intended diagnostics; Production hides them and always rejects fabricated tuner input. Automated Playwright uses an explicit non-production build flag. A React error boundary handles unexpected render failures locally without external reporting or production stack disclosure.

## ADR-023 — Reference output starts inside trusted activation and confirms rendering

Status: accepted

A production iPhone Safari report exposed a timing gap in ADR-016: context construction and resume were synchronous in the semantic click, but oscillator construction and start occurred only after awaiting resume. WebKit applies stricter transient-activation rules to starting Web Audio rendering. Reference activation now synchronously creates/connects a zero-gain voice and starts its oscillator in the trusted activation task, then awaits resume and confirms actual running state plus an advancing rendering clock before scheduling attack or publishing `playing`.

Runtime constructor selection prefers `AudioContext`, falls back to `webkitAudioContext` only when present, and remains lazy. Context/voice generations reject stale events. Visibility loss invalidates output without automatic foreground playback; a later explicit gesture attempts recovery. Production diagnostics remain hidden by default but `audioDiagnostics=1` temporarily exposes read-only lifecycle data, a bounded local log, report copying, and an explicit protected A4 output test. It cannot enable fake microphone or practice data.

## ADR-024 — Diagnose physical output with pre-destination samples and isolated comparisons

Status: superseded by ADR-028

Physical Safari 18.4 testing on iOS 18.4.1 showed that ADR-023's activation and rendering checks can all pass while both the persistent drone and same-engine output test remain inaudible. Control-node connections, an advancing context clock, and `AudioParam.value` do not prove that rendered buffers contain signal or that `AudioDestinationNode` reaches the physical route.

The temporary `audioDiagnostics=1` surface therefore inserts a time-domain analyser on the actual persistent path immediately before destination. It classifies RMS/peak only after three consecutive 1,024-sample buffers at 8 Hz cross a `0.0001` threshold, using one interval and reusable memory. It also provides isolated ramped and constant-gain Web Audio paths, generated native HTML media, and explicit fresh-context comparison. Manual audibility annotations remain local and all paths avoid microphone data.

These experiments are diagnostics rather than an automatic recovery policy. Active pre-destination samples do not prove speaker output; native media and physical observations determine the interpretation branch. Experimental `navigator.audioSession` information is capability-detected and read-only. No production envelope, output routing, or automatic context-recreation behavior changes until physical A/B evidence identifies the smallest safe repair.

**Resolution (ADR-028):** the diagnostic tooling built here — the pre-destination analyser and the native-media/isolated-path comparisons — was sound engineering and is retained. The premise it was built to test, that inaudibility was a physical-output defect in the application's Web Audio graph, was wrong: the device's hardware mute switch was silencing the graph. The native-media comparison staying audible while Web Audio stayed silent, observed repeatedly during this investigation, is exactly the signature the mute switch produces, not evidence of a broken route.

## ADR-025 — Preserve Web Audio ownership while measuring session transitions and improving harmonic audibility

Status: superseded by ADR-028 (previously superseded by ADR-026)

Physical iOS 18.4.1 testing showed that microphone capture can make an already digitally active reference drone physically audible. The microphone and drone use separate contexts, capture creates its context only after permission, and its source/analyser graph has no destination connection. The strongest supported explanation is therefore an implicit iOS audio-session/category or route transition caused by `getUserMedia`, rather than a dependency in the application graph.

The temporary audio diagnostic mode now records a bounded cross-context timeline and permits explicit, capability-detected `playback` and `play-and-record` assignments with prior-value restoration. These assignments are not used in normal mode: the Audio Session API remains a Working Draft, and WebKit has documented microphone-capture failures when `playback` is left active. Web Audio remains the only production backend; neither microphone permission nor native-media fallback is selected without a successful physical A/B result.

Mobile audibility is improved independently with one deterministic `PeriodicWave`. The selected note stays harmonic 1, all upper partials are integer multiples, and low/middle/high profiles reduce harmonic support as MIDI rises. Coefficients are normalized by their absolute sum with Web Audio normalization disabled. The existing 0.16 maximum master gain and volume semantics remain unchanged, so the conservative predicted peak cannot exceed 0.16. Unsupported periodic-wave construction falls back to the exact sine fundamental.

**Resolution (ADR-028):** the `getUserMedia` correlation recorded here was real, but the mechanism was misattributed. Starting capture moves the page's audio session into a play-and-record category; per Apple's published category documentation, that category (like media playback) is not silenced by the hardware mute switch, while the category an idle Web Audio graph was apparently using is. The drone was never route- or graph-dependent on the microphone. The harmonic-profile work in this ADR is unrelated to audibility and remains correct.

## ADR-026 — Prepare an inactive playback session before constructing reference output

Status: superseded by ADR-028 (previously superseded by ADR-027)

Physical iOS 18.4.1 testing established that a fresh-page drone has strong pre-destination samples but no physical output, while `getUserMedia` makes that same unrecreated drone audible immediately and it remains audible after capture stops. The microphone creates a separate input-only context after permission and never connects to destination. The implementation therefore has no application graph edge capable of waking the drone; the changing resource is WebKit's shared page/OS audio session and physical route.

On a reference-key gesture, the production engine now capability-detects `navigator.audioSession`. When its state is not active and its type is not already `playback`, it assigns `playback` before constructing output. If a stopped output context is retained, the engine discards it after preparation; the replacement context, graph, zero-gain voice, and oscillator are created synchronously in the same trusted gesture. This is candidate A. An active session is never overwritten. The prior type is restored on the next task only while the session still contains the temporary `playback` value, which avoids leaving a capture-incompatible playback policy or overwriting another session owner.

The fallback on browsers without the draft API is the unchanged lazy Web Audio path. The repair does not inspect the browser user agent, call `getUserMedia`, change master gain, change the exact fundamental, add a native-media backend, or couple drone ownership to microphone analysis. The now-resolved interactive session experiments and phase annotations are removed; the bounded transition timeline remains for physical verification.

Physical iPhone Safari testing rejected this candidate: the temporary `playback` assignment plus fresh-context construction remained inaudible before microphone capture and introduced unreliable key presentation and foreground recovery. It must not run during normal reference activation.

**Resolution (ADR-028):** this candidate targeted the theoretically correct idea — assign a category that Apple documents as exempt from the mute switch — and still measured as ineffective on device. Whether the Working-Draft `navigator.audioSession` write simply does not produce the same practical category change that `getUserMedia` triggers in this WebKit build, or something else prevented it from taking effect, is Unknown; this was not root-caused further once the actual variable (the physical switch) was identified. The rejection of this candidate as a production repair stands regardless: it did not help, and the real fix required no application change at all.

## ADR-027 — Roll back session mutation and make reference state authoritative

Status: superseded by ADR-028; the state-machine changes below remain accepted on their own merits

Normal reference activation no longer writes `navigator.audioSession.type`. The playback-session plus context-recreation sequence remains available only as an explicitly labeled `audioDiagnostics=1` action. Neither normal nor diagnostic reference playback calls `getUserMedia`; microphone permission remains owned exclusively by the microphone control.

The physical evidence locates the microphone wake-up before the microphone analysis context exists: `getUserMedia` resolves with a live track, the already-created drone becomes audible, and only afterward does the application create the separate input-only analysis context. Stopping its track and closing that input context does not silence the drone. The implementation therefore proves no graph, node, destination, or context-generation dependency between capture and output; the remaining explanation is a browser/platform audio-session or route transition outside the application graph. The exact undocumented platform mutation is not asserted.

Reference presentation now derives from separate pressed, selected, pending, confirmed-sounding, needs-reactivation, and error fields. Selection is published synchronously before audio work. `activeMidi` is confirmed only after a running context and complete voice graph; pending starts use `pendingMidi`. Operation generations implement newest-command-wins semantics and prevent stale completions or failures from overwriting newer intent.

Hidden/pagehide invalidates and cleans the current voice, clears transient key pressure, and marks the selected note as needing an explicit reactivation. Foreground events never play audio. The next explicit gesture closes the invalidated retained context and constructs a fresh generation before starting a voice. Healthy contexts are still retained across an ordinary Stop. Physical audibility remains an unverified acceptance gate.

**Resolution (ADR-028):** removing the AudioSession-mutation workaround from the production path was the right call, but not because it fixed audibility — nothing about it ever affected the mute switch. It cost nothing to remove because it was doing nothing. The `pendingMidi`/`recoveryState` presentation-state split and the newest-command-wins serialization are unrelated to the audibility question, fix a real activation race, and remain accepted as-is. The diagnostics-gated AudioSession experiment kept here is now a documented negative result, not a working mechanism, and is a deletion candidate in a future engine/diagnostics cleanup. "Physical audibility remains an unverified acceptance gate" is no longer accurate as written — see ADR-028 for the verified result.

## ADR-028 — Web Audio on iOS respects the hardware mute switch

Status: accepted, verified on device

Physical testing on one iPhone (clean tree at commit `68ea3e8`, ordinary Safari tab, hardware mute switch in ring/sound-enabled position, no microphone started) confirmed the reference drone is audible from a plain Web Audio graph with none of the ADR-024–ADR-027 workarounds applied. The symptom ADR-023 through ADR-027 investigated — "reference drone inaudible on iPhone Safari" — did not have an application-level cause. The switch was in silent position for the original report and for much of this investigation; Web Audio on iOS Safari honors that switch, so a fully connected, `running`, otherwise-healthy context produces no audible output while it is engaged.

`HTMLAudioElement` does not honor the same switch. This is why the native-media diagnostic built under ADR-024 kept reporting audible results independent of drone state — that observation was accurate at the time and is now understood, not merely logged.

This also reconciles the `getUserMedia` correlation from ADR-025/ADR-026: starting microphone capture moves the page's OS audio session into a recording category. Apple's published audio-session-category documentation distinguishes sound-effect/game-audio categories, which the switch silences, from playback and recording categories, which it does not. The drone becoming audible after `getUserMedia` was never a graph dependency, a route "wake-up," or an undocumented WebKit transition — it was a side effect of leaving the mute-switch-affected category. ADR-026's attempt to write `navigator.audioSession.type = 'playback'` targeted the same idea and, on paper, should have produced a comparable escape; that it measured as ineffective on device suggests the Working-Draft `navigator.audioSession` write did not produce the same practical category change that `getUserMedia` does in this WebKit build. The exact internal reason is Unknown — no WebKit source was inspected as part of this finding.

Reference: Apple's documented audio-session-category behavior (sound-effect/game-audio categories silenced by the switch; media-playback categories not silenced) is treated here as background context for why the symptom behaves the way it does, not as a WebKit source-level citation.

**What this changes:**

- ADR-024 through ADR-027 investigated a cause that did not exist. Their diagnostic tooling (pre-destination analyser, isolated comparisons, native-media test, bounded lifecycle timeline) remains useful and is retained. Their causal conclusions are superseded by this entry.
- The production removal of the AudioSession-mutation workaround (ADR-027) remains the right call independent of this finding: it never fixed anything, so removing it cost nothing.
- The diagnostics-gated `navigator.audioSession` experiment (the "Prepare playback session, recreate context, and test" action) survives in the codebase as a documented negative result, not a working mechanism. It is a deletion candidate during a future engine/diagnostics cleanup; removing diagnostics tooling was out of scope for this correction.
- `pendingMidi` and `recoveryState` (introduced while resolving ADR-027) are unaffected by this finding — they fix a real activation-race and lifecycle-messaging issue unrelated to audibility and remain correct.

**What this does not establish:** this is one physical device, checked once, with the switch toggled by hand. It does not establish behavior across iOS versions, does not audit WebKit source, and does not rule out a future iOS release changing this behavior. Treat "Web Audio respects the mute switch" as the working assumption for this codebase, sourced from one manual verification plus Apple's published category documentation, not as an exhaustively tested platform guarantee.
