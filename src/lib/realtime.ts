import { EventEmitter } from 'events';
import { RealtimeEventType, RealtimeEventPayload } from './types';

// Global singleton event emitter across hot-reloads
const globalForRealtime = globalThis as unknown as {
  realtimeEmitter: EventEmitter | undefined;
};

export const realtimeEmitter =
  globalForRealtime.realtimeEmitter ?? new EventEmitter();

realtimeEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== 'production') {
  globalForRealtime.realtimeEmitter = realtimeEmitter;
}

export function broadcastRealtimeEvent(type: RealtimeEventType, data: any) {
  const payload: RealtimeEventPayload = {
    type,
    data,
    timestamp: Date.now(),
  };
  realtimeEmitter.emit('realtime-event', payload);
}
