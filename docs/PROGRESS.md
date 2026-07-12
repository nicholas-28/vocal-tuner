# Implementation Progress

## Issue 002 — Microphone permission and lifecycle

Implemented on branch `issue-002-microphone-lifecycle`.

- Explicit lifecycle states: idle, requesting, active, stopping, denied, unsupported, no-device, and error
- Start, stop, repeated-use, unexpected-ended, stale-resource, and unmount cleanup paths
- Conservative voice constraints with one basic-audio retry for over-constrained browsers
- Local RMS input-level monitoring with controlled UI updates
- Accessible status, recovery guidance, and adaptive controls
- No pitch detection, recording, storage, or audio upload

## Issue 003 — Monophonic pitch detection spike

Implemented on branch `issue-003-pitch-detection-spike`.

- Local YIN detector with 65–1200 Hz range, RMS gating, and normalized confidence
- One shared Web Audio analysis graph for input level and pitch
- Throttled raw frequency, confidence, signal, cadence, and computation diagnostics
- Deterministic generated-signal and lifecycle coverage
- Technical evaluation and real-device acceptance checklist in `PITCH_DETECTION_SPIKE.md`
- Note, octave, cents, pitch history, recording, and upload remain unimplemented

## Issue 004 — Real-voice detection follow-up

Implemented on branch `issue-004-real-voice-detection-fix`.

- Audited the YIN stages and exposed raw candidate evidence plus exact rejection reasons
- Fixed hidden 0% confidence when no strict threshold crossing occurred
- Added DC-mean removal while preserving raw RMS
- Tuned provisional RMS, CMND, and confidence thresholds against vocal-like fixtures
- Added a narrow weak-fundamental safeguard for stronger second harmonics
- Added harmonic, noisy, DC-offset, modulated, attack, vibrato, breath, and threshold tests
- Preserved microphone lifecycle and shared-analysis cleanup behavior
