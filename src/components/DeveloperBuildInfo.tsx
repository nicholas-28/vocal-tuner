import { BUILD_INFO, formatCompactBuildInfo } from '../config/buildInfo';

export function DeveloperBuildInfo() {
  return (
    <footer
      className="developer-build-info"
      aria-label="Deployment build information"
      title={BUILD_INFO.gitRef ? `Git ref: ${BUILD_INFO.gitRef}` : undefined}
    >
      {formatCompactBuildInfo(BUILD_INFO)}
    </footer>
  );
}
