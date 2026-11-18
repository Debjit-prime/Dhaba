'use client';

import { useEffect, useRef } from 'react';
import { RealtimeEventType } from '@/lib/types';

export function useRealtimeSubscription(
  eventTypes: RealtimeEventType[],
  onEvent: (type: RealtimeEventType, data: any) => void,
  onPoll?: () => void | Promise<void>,
  pollIntervalMs = 4000
) {
  const onEventRef = useRef(onEvent);
  const onPollRef = useRef(onPoll);
  onEventRef.current = onEvent;
  onPollRef.current = onPoll;

  const eventsKey = eventTypes.join('|');

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    const startPolling = () => {
      if (pollTimer || !onPollRef.current) return;
      pollTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        onPollRef.current?.();
      }, pollIntervalMs);
    };

    function connect() {
      if (!isMounted) return;

      eventSource = new EventSource('/api/realtime');

      eventSource.addEventListener('mode', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.serverless) {
            eventSource?.close();
            eventSource = null;
            startPolling();
          }
        } catch {
          // Ignore malformed mode payload
        }
      });

      const types = eventsKey ? (eventsKey.split('|') as RealtimeEventType[]) : [];
      types.forEach((type) => {
        eventSource?.addEventListener(type, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            onEventRef.current(type, parsed);
          } catch (err) {
            console.error('Error parsing SSE data for', type, err);
          }
        });
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        // Ensure updates still arrive if SSE is unavailable on serverless hosts
        startPolling();
        if (isMounted) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearInterval(pollTimer);
      eventSource?.close();
    };
  }, [eventsKey, pollIntervalMs]);
}
