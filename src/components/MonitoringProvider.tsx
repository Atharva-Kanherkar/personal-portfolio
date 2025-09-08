'use client';

import { useMonitoring } from '@/hooks/useMonitoring';

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useMonitoring();
  return <>{children}</>;
}
