export const NATIVE_AUDIO_TEST_DURATION_SECONDS = 1;
export const NATIVE_AUDIO_TEST_FREQUENCY_HZ = 440;
export const NATIVE_AUDIO_TEST_SAMPLE_RATE = 16_000;
export const NATIVE_AUDIO_TEST_AMPLITUDE = 0.15;

export function createNativeA4WavBlob(): Blob {
  const sampleCount =
    NATIVE_AUDIO_TEST_SAMPLE_RATE * NATIVE_AUDIO_TEST_DURATION_SECONDS;
  const bytesPerSample = 2;
  const dataSize = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, NATIVE_AUDIO_TEST_SAMPLE_RATE, true);
  view.setUint32(28, NATIVE_AUDIO_TEST_SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.min(1, index / 160, (sampleCount - index) / 160);
    const sample =
      Math.sin(
        (2 * Math.PI * NATIVE_AUDIO_TEST_FREQUENCY_HZ * index) /
          NATIVE_AUDIO_TEST_SAMPLE_RATE,
      ) *
      NATIVE_AUDIO_TEST_AMPLITUDE *
      Math.max(0, envelope);
    view.setInt16(44 + index * bytesPerSample, sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1)
    view.setUint8(offset + index, text.charCodeAt(index));
}
