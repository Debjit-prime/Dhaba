import { NextRequest } from 'next/server';
import { realtimeEmitter } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  if (process.env.VERCEL === '1') {
    const serverlessStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`event: mode\ndata: ${JSON.stringify({ serverless: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(serverlessStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`));

      const onRealtimeEvent = (payload: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${payload.type}\ndata: ${JSON.stringify(payload.data)}\n\n`)
          );
        } catch (err) {
          console.error('Error writing to SSE stream:', err);
        }
      };

      realtimeEmitter.on('realtime-event', onRealtimeEvent);

      // Heartbeat interval to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`));
        } catch (err) {
          clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        realtimeEmitter.off('realtime-event', onRealtimeEvent);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
