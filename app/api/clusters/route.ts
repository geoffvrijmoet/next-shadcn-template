import { NextResponse } from 'next/server';

export async function GET() {
  const clustersRaw = process.env.MONGODB_CLUSTERS;
  let clusterKeys: string[] = [];

  if (clustersRaw) {
    try {
      const parsed = JSON.parse(clustersRaw) as Record<string, unknown>;
      clusterKeys = Object.keys(parsed);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid MONGODB_CLUSTERS JSON', message: (error as Error).message },
        { status: 500 }
      );
    }
  } else if (process.env.MONGODB_URI) {
    clusterKeys = ['default'];
  }

  return NextResponse.json({ clusters: clusterKeys });
} 