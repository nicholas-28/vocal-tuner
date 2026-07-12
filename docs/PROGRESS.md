# Implementation Progress

## Issue 002 — Microphone permission and lifecycle

Implemented on branch `issue-002-microphone-lifecycle`.

- Explicit lifecycle states: idle, requesting, active, stopping, denied, unsupported, no-device, and error
- Start, stop, repeated-use, unexpected-ended, stale-resource, and unmount cleanup paths
- Conservative voice constraints with one basic-audio retry for over-constrained browsers
- Local RMS input-level monitoring with controlled UI updates
- Accessible status, recovery guidance, and adaptive controls
- No pitch detection, recording, storage, or audio upload
