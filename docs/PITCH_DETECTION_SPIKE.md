# Pitch Detection Spike

## Decision

The spike uses a small local TypeScript implementation of YIN. No detector dependency was added, so there is no third-party license obligation or dependency bundle cost. The production bundle increase is limited to the local detector, analysis orchestration, diagnostics hook, and UI.

YIN was selected because it estimates a fundamental period directly, provides a useful normalized-difference confidence measure, is understandable enough to audit locally, and is commonly suitable for sustained monophonic signals. McLeod Pitch Method (MPM) was also considered. MPM has strong musical-pitch applications and a useful clarity measure, but its normalized square-difference and peak-selection implementation is more involved. It was not selected without real-device evidence that it would outperform YIN for this product.

Recommendation: accept YIN provisionally for the MVP, with threshold and device tuning required after varied real-voice testing.

## Implementation

```text
Existing MediaStream
  → one detector-owned AudioContext
  → MediaStreamAudioSourceNode
  → AnalyserNode (not connected to speakers)
  → reusable 4096-sample Float32Array
  → RMS gate
  → YIN difference and cumulative normalized difference
  → confidence and 65–1200 Hz range rejection
  → diagnostics published to React at a controlled cadence
```

The same analysis graph now supplies input level and pitch, so the application retains one stream and does not create a second level-only `AudioContext`. Samples are reused in memory for the current analysis only; they are not stored, recorded, logged, or uploaded.

## Configuration

- Supported frequency range: 65–1200 Hz
- Analyser `fftSize`: 4096 samples
- Window duration at 44.1 kHz: approximately 92.9 ms
- Window duration at 48 kHz: approximately 85.3 ms
- Internal analysis target: 30 analyses per second
- React diagnostic publication target: 15 updates per second
- RMS silence threshold: 0.01
- Minimum confidence: 0.85 on a normalized 0–1 scale
- YIN threshold: 0.15

The RMS and confidence thresholds are provisional. They require tuning with real low, high, quiet, breathy, and vibrato-heavy voices on phones.

`analysisDurationMs` measures detector computation only. It is not total latency. Perceived response also includes microphone capture buffering, the 85–93 ms sample window, analysis cadence, confidence requirements, and the UI publication cadence.

## Expected behavior

Sustained vowels, humming, and clean single tones should produce a plausible frequency and high confidence. Silence and very quiet input clear the frequency. Noise, breath, and consonants should generally remain low-confidence, though real rooms require validation.

YIN can select a harmonic or subharmonic for spectrally complex voices, especially during attacks, register changes, breathy phonation, or strong upper harmonics. No octave-jump suppression or display smoothing is included in this issue. Vibrato remains visible as raw frequency movement. Low notes use fewer periods per window and may feel less stable or slower.

## Automated evidence

Generated tests cover silence, very low amplitude, deterministic random noise, phase and amplitude changes, out-of-range signals, finite normalized output, input immutability, and sine waves at 110, 220, 261.63, 440, and 880 Hz. Browser lifecycle tests remain hardware-independent.

## Real-device evaluation checklist

Test recent iPhone Safari, Android Chrome, macOS Safari, and desktop Chrome:

1. Grant permission and verify the live signal and detector status.
2. Sustain “ah” and hum at known notes, including A3 (220 Hz) and A4 (440 Hz).
3. Compare frequency against a trusted tuner.
4. Try low and high notes, slow upward/downward glides, and vibrato.
5. Try breath, spoken consonants, silence, quiet voice, and louder voice.
6. Record perceived delay, octave jumps, CPU/heat concerns, and frequency plausibility.
7. Stop, confirm frequency clears and the system microphone indicator disappears, then start again.
8. Refresh while active and confirm browser capture ends.

## Acceptance or replacement criteria

Keep and tune YIN if sustained voices across the device matrix usually produce plausible frequency, silence clears promptly, computation remains affordable, and octave errors are infrequent enough for the technical proof. Compare or replace it with MPM before continuing if octave/subharmonic errors are common, low voices are unreliable, or mobile computation materially harms responsiveness or battery use.
