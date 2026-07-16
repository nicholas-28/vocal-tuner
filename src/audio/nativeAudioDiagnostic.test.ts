import { describe, expect, it } from 'vitest';
import {
  createNativeA4WavBlob,
  NATIVE_AUDIO_TEST_SAMPLE_RATE,
} from './nativeAudioDiagnostic';

describe('native audio diagnostic WAV', () => {
  it('creates a local one-second mono PCM WAV', async () => {
    const blob = createNativeA4WavBlob();
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + NATIVE_AUDIO_TEST_SAMPLE_RATE * 2);
    const bytes = new Uint8Array(
      await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () =>
          resolve(reader.result as ArrayBuffer),
        );
        reader.addEventListener('error', () => reject(reader.error));
        reader.readAsArrayBuffer(blob);
      }),
    );
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WAVE');
  });
});
