# GitHub Issues Backlog

Each issue should be created separately and assigned to one milestone.

---

## Issue 001 — Initialize the application

**Milestone:** Foundation  
**Labels:** `type: feature`, `area: foundation`, `priority: high`, `codex-ready`

### Goal

Create a working Vite, React, and TypeScript project with standard quality checks.

### Scope

- Initialize project
- Add linting
- Add formatting
- Add Vitest
- Add Playwright
- Add scripts for dev, lint, test, and build
- Add basic mobile application shell
- Add CI workflow

### Acceptance criteria

- `npm install` succeeds
- `npm run dev` starts the app
- `npm run lint` succeeds
- `npm run test` succeeds
- `npm run build` succeeds
- CI runs lint, test, and build
- App renders on a mobile viewport

### Out of scope

- Microphone input
- Pitch detection
- Final visual design

---

## Issue 002 — Implement microphone permission and lifecycle

**Milestone:** Technical Proof  
**Labels:** `type: feature`, `area: audio`, `priority: high`, `codex-ready`

### Goal

Allow the user to safely start and stop microphone capture.

### Acceptance criteria

- Capture begins only after user interaction
- Permission denial shows a useful message
- Unsupported browsers show a useful message
- Start changes to stop while active
- All media tracks are stopped on stop and unmount
- Audio is not uploaded or recorded
- A basic input-level indicator confirms signal activity

### Out of scope

- Pitch detection
- Recording
- Device selector

---

## Issue 003 — Add monophonic pitch detection spike

**Milestone:** Technical Proof  
**Labels:** `type: research`, `area: audio`, `priority: high`, `codex-ready`

### Goal

Detect the fundamental frequency of a single singing voice in real time.

### Tasks

- Evaluate one or two suitable algorithms or libraries
- Document bundle size, license, confidence output, and mobile suitability
- Implement the chosen first detector
- Return frequency, confidence, and signal level
- Add a plain developer readout

### Acceptance criteria

- Stable tones in a normal vocal range produce plausible frequencies
- Silence produces no pitch
- Low-confidence values can be rejected
- The implementation works in a deployed mobile browser
- The choice and known limitations are documented

---

## Issue 004 — Diagnose and improve real-voice pitch detection

**Milestone:** Technical Proof

**Status:** implemented

Improved YIN candidate diagnostics, real-voice thresholds, DC-offset handling, and harmonic fixture coverage.

---

## Issue 005 — Implement musical pitch conversion

**Milestone:** Technical Proof  
**Labels:** `type: feature`, `area: music-theory`, `priority: high`, `codex-ready`

### Goal

Convert frequency into fractional MIDI, note, octave, and cents deviation.

### Acceptance criteria

- A4 at 440 Hz maps to MIDI 69, A4, and 0 cents
- C4 maps correctly near 261.63 Hz
- Frequencies below and above note centers return signed cents
- Functions are pure and typed
- Unit tests cover boundaries and octave changes
- Tuning reference is represented as a configurable value, defaulting to 440 Hz

---

## Technical pitch readout — implemented across Issues 003–005

**Milestone:** Technical Proof  
**Status:** implemented

### Goal

Show current note, frequency, cents, confidence, and signal state.

### Acceptance criteria

- Current note and octave are prominent
- Frequency is shown to one decimal place
- Cents are signed
- Silence shows a neutral state
- Low confidence is visibly distinguished
- Layout works on a phone
- No final graph is required

---

## Issue 006 — Implement timestamped pitch history buffer

**Milestone:** Pitch Monitor  
**Labels:** `type: feature`, `area: visualization`, `priority: high`

### Acceptance criteria

- Stores timestamped pitch points
- Supports null points for gaps
- Trims history to a configured duration
- Does not grow without bound
- Has unit tests

---

## Issue 007 — Render semitone grid

**Milestone:** Pitch Monitor  
**Labels:** `type: feature`, `area: visualization`, `priority: high`

### Acceptance criteria

- Every semitone has equal height
- Natural-note and accidental lines are visually distinct
- Note labels remain aligned
- Visible range can be configured
- Canvas remains sharp on high-density displays

---

## Issue 008 — Render scrolling pitch curve

**Milestone:** Pitch Monitor  
**Labels:** `type: feature`, `area: visualization`, `priority: high`

### Acceptance criteria

- New points appear at the present-time edge
- Older points move left according to timestamps
- Silence creates gaps
- Resize does not corrupt the graph
- Rendering uses `requestAnimationFrame`
- React is not re-rendered for each audio frame

---

## Issue 009 — Add pause and clear controls

**Milestone:** Pitch Monitor  
**Labels:** `type: feature`, `area: ui`, `priority: medium`

### Acceptance criteria

- Pause freezes incoming graph data
- Resume continues safely
- Clear removes current history
- Microphone lifecycle remains predictable
- Controls have accessible labels

---

## Issue 010 — Add visible-range controls

**Milestone:** Pitch Monitor  
**Labels:** `type: feature`, `area: ui`, `priority: medium`

### Acceptance criteria

- User can select low and high notes
- Invalid ranges are prevented
- Grid and keyboard update together
- Selection persists locally

---

## Issue 011 — Build vertical reference keyboard

**Milestone:** Reference Keyboard  
**Labels:** `type: feature`, `area: ui`, `area: music-theory`, `priority: high`

### Acceptance criteria

- White and black keys align with the pitch grid
- Touch, pointer, and keyboard interactions are supported
- Press state is visible
- Notes are correctly labeled
- Scrolling or range changes preserve alignment

---

## Issue 012 — Implement reference tone synthesizer

**Milestone:** Reference Keyboard  
**Labels:** `type: feature`, `area: audio`, `priority: high`

### Acceptance criteria

- Tone starts after a user gesture
- Tone sounds while the key is held
- Tone stops on release, cancellation, and blur
- Attack and release avoid clicks
- Gain is capped
- Multiple rapid presses do not leak audio nodes

---

## Issue 013 — Add target note state

**Milestone:** Reference Keyboard  
**Labels:** `type: feature`, `area: practice`, `priority: medium`

### Acceptance criteria

- A selected reference key can become the target
- Target note is visually highlighted
- Current cents are calculated relative to the same tuning reference
- Target can be cleared

---

## Issue 014 — Add silence and confidence filtering

**Milestone:** Vocal Stability  
**Labels:** `type: feature`, `area: audio`, `priority: high`

### Acceptance criteria

- Quiet input creates no pitch point
- Low-confidence frames create gaps
- Thresholds are documented and adjustable
- Behavior is tested with silence and noise fixtures

---

## Issue 015 — Reduce octave-jump errors

**Milestone:** Vocal Stability  
**Labels:** `type: research`, `area: audio`, `priority: high`

### Acceptance criteria

- Obvious single-frame octave jumps are reduced
- Genuine sustained octave changes remain possible
- Raw detector output remains available for debugging
- Tests include false and true octave transitions

---

## Issue 016 — Add vibrato-preserving visual smoothing

**Milestone:** Vocal Stability  
**Labels:** `type: feature`, `area: visualization`, `priority: high`

### Acceptance criteria

- The curve is readable without feeling delayed
- Natural vibrato remains visible
- Short false spikes are reduced
- Raw and rendered pitch remain separate
- Smoothing parameters are documented

---

## Issue 017 — Add PWA shell and privacy copy

**Milestone:** Testable MVP  
**Labels:** `type: feature`, `area: foundation`, `priority: medium`

### Acceptance criteria

- App has a manifest
- App can be added to a home screen
- Application shell loads offline after first visit
- Privacy text states that audio is processed locally
- No claim exceeds actual implementation

---

## Issue 018 — Conduct first student test

**Milestone:** Testable MVP  
**Labels:** `type: research`, `area: product`, `priority: high`

### Goal

Test with three to five students.

### Questions

- Can they start without explanation?
- Do they understand high versus low?
- Does the graph help correction?
- Does the graph distract from listening?
- Is the reference keyboard useful?
- Which errors reduce trust?
- What feature do they ask for next?

### Deliverable

A short findings document with observed problems, direct user language, and recommended next issues.
