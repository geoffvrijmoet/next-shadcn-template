import { NextRequest } from 'next/server';
import { deploymentEventBus, DeploymentEvent } from '@/lib/deployment-events';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Heartbeat keep-alive every 15s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(':keep-alive\n\n'));
      }, 15000);

      const listener = (evt: DeploymentEvent) => {
        if (evt.deploymentId !== id) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };

      deploymentEventBus.on(id, listener);

      controller.enqueue(encoder.encode('event: connected\n\n'));

      // Cleanup on cancel
      // @ts-ignore
      controller.queue = undefined;
      return () => {
        clearInterval(heartbeat);
        deploymentEventBus.off(id, listener);
      };
    },
    cancel() {
      /* noop cleanup handled above */
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}