export const runtime = 'edge';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const steps = [
        'Creating GitHub repository...',
        'Generating codebase...',
        'Setting up MongoDB database...',
        'Configuring Clerk authentication...',
        'Deploying to Vercel...',
        'Configuring environment variables...',
        'Finalising setup...'
      ];

      for (const step of steps) {
        controller.enqueue(encoder.encode(`data: ${step}\n\n`));
        await new Promise(r => setTimeout(r, 1500));
      }

      controller.enqueue(encoder.encode('data: __COMPLETE__\n\n'));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
} 