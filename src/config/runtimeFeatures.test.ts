import { describe, expect, it } from 'vitest';
import { createBuildInfo } from './buildInfo';
import { createRuntimeFeaturePolicy } from './runtimeFeatures';

describe('runtime feature policy', () => {
  it('blocks public diagnostic and fabricated input flags in production', () => {
    const production = createBuildInfo({
      mode: 'production',
      vercelEnvironment: 'production',
      enableTestControls: 'true',
    });

    expect(
      createRuntimeFeaturePolicy(
        '?droneDiagnostics=1&droneDebug=1&centsMeterDemo=1',
        production,
      ),
    ).toEqual({
      showDeveloperDiagnostics: false,
      showReferenceDroneDiagnostics: false,
      showAudioDiagnostics: false,
      enableReferenceDroneDebugLog: false,
      enableCentsMeterDemo: false,
    });
  });

  it('allows only read-only audio diagnostics in production', () => {
    const production = createBuildInfo({
      mode: 'production',
      vercelEnvironment: 'production',
    });
    expect(
      createRuntimeFeaturePolicy(
        '?audioDiagnostics=1&centsMeterDemo=1',
        production,
      ),
    ).toMatchObject({
      showAudioDiagnostics: true,
      enableCentsMeterDemo: false,
      showDeveloperDiagnostics: false,
    });
  });

  it('keeps intended diagnostics in preview without enabling fake input', () => {
    const preview = createBuildInfo({
      mode: 'production',
      vercelEnvironment: 'preview',
    });

    expect(
      createRuntimeFeaturePolicy(
        '?droneDiagnostics=1&droneDebug=1&centsMeterDemo=1',
        preview,
      ),
    ).toEqual({
      showDeveloperDiagnostics: true,
      showReferenceDroneDiagnostics: true,
      showAudioDiagnostics: false,
      enableReferenceDroneDebugLog: true,
      enableCentsMeterDemo: false,
    });
  });

  it('allows explicitly compiled test input outside production', () => {
    const previewTestControls = createBuildInfo({
      mode: 'production',
      vercelEnvironment: 'preview',
      enableTestControls: 'true',
    });
    expect(
      createRuntimeFeaturePolicy('?centsMeterDemo=1', previewTestControls)
        .enableCentsMeterDemo,
    ).toBe(true);
  });

  it('retains local diagnostics and requires the demo query even in tests', () => {
    const development = createBuildInfo({ mode: 'development' });
    expect(createRuntimeFeaturePolicy('', development)).toMatchObject({
      showDeveloperDiagnostics: true,
      showReferenceDroneDiagnostics: true,
      enableReferenceDroneDebugLog: false,
      enableCentsMeterDemo: false,
    });

    const test = createBuildInfo({ mode: 'test' });
    expect(
      createRuntimeFeaturePolicy('?centsMeterDemo=1', test)
        .enableCentsMeterDemo,
    ).toBe(true);
  });
});
