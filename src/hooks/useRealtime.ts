'use client';

import { useEffect } from 'react';
import { RealtimeEventType } from '@/lib/types';

export function useRealtimeSubscription(
  eventTypes: RealtimeEventType[],
  onEvent: (type: RealtimeEventType, data: any) => void
) {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      eventSource = new EventSource('/api/realtime');

      eventTypes.forEach((type) => {
        eventSource?.addEventListener(type, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent(type, parsed);
          } catch (err) {
            console.error('Error parsing SSE data for', type, err);
          }
        });
      });

      eventSource.onerror = () => {
        // Reconnect after 3 seconds on error/disconnect
        eventSource?.close();
        if (isMounted) {
          setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, [eventTypes, onEvent]);
}
