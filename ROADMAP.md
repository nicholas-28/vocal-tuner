# Roadmap

## Milestone 0 — Foundation

Goal: create a repository that agents can work in safely.

- Initialize Vite, React, and TypeScript
- Add linting and formatting
- Add Vitest
- Add Playwright
- Add CI for lint, test, and build
- Add `AGENTS.md`
- Add mobile viewport and basic app shell

Exit condition: the project installs, runs, tests, and builds.

## Milestone 1 — Technical Proof

Goal: prove that live vocal pitch detection works on a real phone.

- Microphone permission flow
- Start and stop microphone
- Release audio resources correctly
- Implement or integrate a pitch detector
- Return frequency and confidence
- Convert frequency to MIDI pitch, note, octave, and cents
- Build a plain developer readout
- Test on iPhone Safari, Android Chrome, and desktop

Exit condition: singing a stable note produces a plausible note, frequency, cents value, and confidence.

## Milestone 2 — Pitch Monitor

Goal: reproduce the core moving-line mechanic.

- Pitch history buffer
- Time-based horizontal scrolling
- Equal semitone spacing
- Major and minor grid lines
- Note labels
- Live pitch curve
- Gaps during silence
- Pause and clear
- Manual visible range

Exit condition: the user can sing a short phrase and inspect the pitch contour.

## Milestone 3 — Reference Keyboard

Goal: connect listening and singing.

- Vertical piano-style keyboard
- Touch and pointer support
- Reference oscillator
- Soft attack and release
- Target-note state
- Highlight selected note

Exit condition: the user can hold a note, hear it, release it, and sing against it.

## Milestone 4 — Vocal Stability

Goal: make the tool trustworthy for teaching.

- Noise gate
- Confidence threshold
- Silence detection
- Median filtering
- Octave-jump suppression
- Separate raw, filtered, and rendered pitch
- Vibrato-preserving smoothing
- Low-latency tuning
- Device testing

Exit condition: the graph is responsive without becoming nervous or misleading.

## Milestone 5 — Testable MVP

Goal: make the app easy to share with students.

- Responsive mobile layout
- PWA manifest and icons
- Offline application shell
- Microphone privacy explanation
- Friendly permission and error states
- Deployment previews
- Production deployment
- Basic anonymous usage events only if later approved

Exit condition: a teacher can send one link and a student can use the tuner without help.

## Later candidates

These require separate product validation:

- Record and replay a take
- Compare two attempts
- Stable-note exercise
- Listen → sing → compare mode
- Hidden-feedback ear-training mode
- Custom tuning reference such as A4 = 432–442 Hz
- Teacher-created exercises
- Session summaries
