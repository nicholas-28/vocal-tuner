import type { ReactNode } from 'react';

export type AppErrorBoundaryState = Readonly<{
  error: Error | null;
}>;

export type AppErrorBoundaryProps = Readonly<{
  children: ReactNode;
  reload?: () => void;
  showDevelopmentDetail?: boolean;
}>;
