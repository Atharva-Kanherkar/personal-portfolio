'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useMonitoring() {
  const pathname = usePathname();

  useEffect(() => {
    const startTime = performance.now();
    
    const trackPageView = async () => {
      try {
        const responseTime = performance.now() - startTime;
        
        await fetch('/api/monitoring/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: pathname,
            responseTime: Math.round(responseTime),
            success: true,
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
        
        // Track the error
        try {
          await fetch('/api/monitoring/metrics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: pathname,
              success: false,
            }),
          });
        } catch {
          // Silently fail to avoid infinite loops
        }
      }
    };

    // Track page view after a short delay to ensure the page is fully loaded
    const timer = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
