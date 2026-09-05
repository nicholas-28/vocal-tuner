# Pitch Detection Spike

Issue 013 leaves raw semantics and thresholds unchanged: RMS `0.005`, YIN/CMND `0.35`, confidence `0.70`, and `65–1200 Hz`. Fixtures distinguish rejection stages, but no retained real-device session establishes which dominates sustained-voice breaks. The proven downstream cause was that every isolated rejection became an immediate gap. Session counters now support measurement without recording audio.

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

## Known limitations

### Sub-multiple aliasing above the range ceiling

Previously, `findThresholdCandidate` started at lag 2, allowing a below-range lag to win before the search reached a valid vocal period. It now starts at `minimumLag`, matching the existing `findMinimumIndex` fallback bound. Both searches stay within `[minimumLag, maximumLag]`, where `minimumLag = max(2, floor(sampleRate / maximumFrequencyHz))`. Interpolation, final frequency-range checks, and detector thresholds are unchanged.

This corrects the generated regression in which a short high-frequency noise burst over a 110 Hz tone caused an early, out-of-range candidate to be selected. It does not solve octave or subharmonic ambiguity, nor establish how often this cause occurs in real voices.

A periodic signal can have deep normalized-difference minima at multiples of its true period. When the true period is below the searched lag range, an in-range multiple can therefore be accepted as a lower pitch. At 48 kHz with `maximumFrequencyHz = 1200` (`minimumLag = 40`), the 1500 Hz sine fixture has a true period of 32 samples; the detector instead selects approximately 64 samples and reports approximately 750 Hz with high confidence.

This above-ceiling/subharmonic behavior is an intentionally retained limitation. The final range check bounds the reported candidate, not the true frequency of every possible input. Existing deterministic noise fixtures remain rejected, but the lag bound alone does not guarantee rejection of every noisy or above-ceiling signal. Resolving that ambiguity requires separate work on candidate selection; it is outside this minimum-lag fix. See `src/audio/pitchDetector.test.ts` — `reports a sub-multiple for periodic signals above the range ceiling` — for the reproducing case.

## Acceptance or replacement criteria

Keep and tune YIN if sustained voices across the device matrix usually produce plausible frequency, silence clears promptly, computation remains affordable, and octave errors are infrequent enough for the technical proof. Compare or replace it with MPM before continuing if octave/subharmonic errors are common, low voices are unreliable, or mobile computation materially harms responsiveness or battery use.

## Real-voice detector tuning

### Observed failure and root-cause evidence

Manual sustained vowels produced RMS around 0.015–0.016, 4–5 ms computation, 10–12 Hz UI cadence, frequent 0% confidence, and no accepted frequency. That RMS exceeded the old 0.01 gate, so the signal gate was not the primary rejection point.

The audit found that confidence was calculated only after CMND crossed the strict 0.15 absolute threshold. A plausible harmonic voice candidate with a higher CMND minimum therefore became indistinguishable from “no candidate”: confidence was reset to zero and raw frequency was discarded before the 0.85 application threshold. This is the strongest proven implementation cause. Physical-device retesting is still required to quantify how much of the original failure it explains.

The audit also reproduced a stronger-second-harmonic case where the first threshold crossing selected half the fundamental period. Candidate selection now prefers a later full-period minimum only when it is approximately twice the first lag and its CMND is materially lower. This avoids changing clean sine results while recovering the generated weak fundamental.

### YIN audit

- Difference function: correct squared sample differences over valid overlapping samples.
- CMND: starts at lag 1, handles a zero running sum, and remains finite.
- Lag bounds: derived from the actual sample rate, 65–1200 Hz range, and half-buffer limit.
- Threshold search: continues to the local minimum and now preserves a best allowed candidate when no crossing occurs.
- Interpolation: falls back to the integer lag for zero, invalid, or non-positive refinement.
- Conversion: rejects non-finite and out-of-range frequencies explicitly.
- Confidence: derived from the selected candidate and retained separately from final accepted confidence.

### Diagnostics

The development panel now shows raw RMS and gate result, selected lag, raw candidate frequency, minimum CMND, raw and accepted confidence, exact rejection reason, computation duration, cadence, sample rate, FFT size/window duration, and active thresholds. Audio samples are never logged.

### Preprocessing and thresholds

The detector subtracts the sample-buffer mean to remove DC offset. RMS is calculated first from the untouched samples. No amplitude normalization is used because YIN is scale invariant and normalizing quiet noise could create false evidence. A Hann window was rejected because its amplitude envelope distorts time-domain comparisons between delayed samples.

Provisional defaults changed from RMS 0.01 / CMND 0.15 / confidence 0.85 to RMS 0.005 / CMND 0.35 / confidence 0.70. The lower RMS threshold gives built-in microphones more margin, although the observed voice already passed the former gate. Harmonic, weak-fundamental, noisy harmonic, DC-offset, amplitude-modulated, attack/sustain, and mild-vibrato fixtures remain accepted, while silence, very low input, random noise, and breath-like noise remain rejected.

Auto gain remains disabled in production constraints. That preserves raw input behavior but may yield low levels on built-in microphones; basic `{ audio: true, video: false }` constraints can be compared manually through the existing compatibility fallback, never through a simultaneous second stream.

### Temporal behavior

No pitch-hold policy was added. Each frame exposes raw and accepted results, and silence or rejection clears frequency immediately at the next published diagnostic. This avoids stale notes, concealed slides, and premature graph smoothing. A short temporal policy should be considered only after multi-device recordings demonstrate isolated confidence dips.

### Manual retest and acceptance

Repeat humming, “oo,” “ah,” quiet/normal/loud voice, low/middle/high pitch, glides, vibrato, silence, breath, and consonants in Chrome and Safari. For each, record RMS, raw candidate, raw confidence, accepted frequency, rejection reason, perceived delay, and octave jumps.

Detection is acceptable for continuation when sustained vowels and humming across representative devices normally produce plausible raw and accepted frequencies, silence and breath remain rejected, and octave errors are uncommon enough for the technical proof. Replace or compare YIN with MPM if raw CMND remains poor on common voices or harmonic selection remains unreliable after this retest.
