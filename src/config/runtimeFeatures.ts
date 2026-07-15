import { BUILD_INFO } from './buildInfo';
import type { BuildInfo } from '../types/buildInfo';
import type { RuntimeFeaturePolicy } from '../types/runtimeFeatures';

export function createRuntimeFeaturePolicy(
  search: string,
  buildInfo: BuildInfo = BUILD_INFO,
): RuntimeFeaturePolicy {
  const query = new URLSearchParams(search);
  const developerEnvironment =
    buildInfo.deploymentEnvironment === 'development' ||
    buildInfo.deploymentEnvironment === 'preview' ||
    buildInfo.deploymentEnvironment === 'test' ||
    buildInfo.testControlsEnabled;

  return Object.freeze({
    showDeveloperDiagnostics: developerEnvironment,
    showReferenceDroneDiagnostics:
      developerEnvironment &&
      (buildInfo.deploymentEnvironment === 'development' ||
        buildInfo.deploymentEnvironment === 'test' ||
        buildInfo.testControlsEnabled ||
        query.has('droneDiagnostics')),
    showAudioDiagnostics: query.has('audioDiagnostics'),
    enableReferenceDroneDebugLog:
      developerEnvironment && query.has('droneDebug'),
    enableCentsMeterDemo:
      buildInfo.deploymentEnvironment !== 'production' &&
      buildInfo.testControlsEnabled &&
      query.has('centsMeterDemo'),
  });
}

export function getCurrentRuntimeFeaturePolicy(): RuntimeFeaturePolicy {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  return createRuntimeFeaturePolicy(search);
}
