import { MongoClient, Db } from 'mongodb';

// ---------------------------------------------------------------------------
// Multi-cluster MongoDB utility
// ---------------------------------------------------------------------------
// Supports one (legacy) or many clusters.  When multiple clusters are desired
// add `MONGODB_CLUSTERS` as a JSON string mapping keys to base connection URIs,
// e.g.  { "geoff-vrijmoet-com": "mongodb+srv://user:pass@clusterA.mongodb.net", ... }
// ---------------------------------------------------------------------------

type ClusterMap = Record<string, string>;

function parseClusterMap(): ClusterMap {
  const raw = process.env.MONGODB_CLUSTERS;
  if (raw) {
    try {
      return JSON.parse(raw) as ClusterMap;
    } catch (err) {
      throw new Error(`Invalid MONGODB_CLUSTERS JSON: ${(err as Error).message}`);
    }
  }
  // Fallback to legacy single-URI env var
  if (process.env.MONGODB_URI) {
    return { default: process.env.MONGODB_URI } as ClusterMap;
  }
  throw new Error('Please add MONGODB_CLUSTERS or MONGODB_URI to environment');
}

const clusterMap: ClusterMap = parseClusterMap();

// Cache client promises per connection string to enable reuse & HMR friendliness
const clientPromises: Map<string, Promise<MongoClient>> = new Map();

function getClientPromise(connectionString: string): Promise<MongoClient> {
  if (clientPromises.has(connectionString)) {
    return clientPromises.get(connectionString)!;
  }

  const promise = new MongoClient(connectionString).connect();
  clientPromises.set(connectionString, promise);
  return promise;
}

/**
 * Obtain a Db handle for a given cluster key & database name.
 *
 * @param clusterKey  Key in MONGODB_CLUSTERS JSON.  Defaults to 'default'.
 * @param dbName      Database name.  If omitted, defaults to 'next-shadcn-template'.
 */
export async function getDatabase(
  clusterKey: string = 'default',
  dbName: string = 'next-shadcn-template'
): Promise<Db> {
  let resolvedKey = clusterKey;
  if (resolvedKey === 'default' && !clusterMap['default']) {
    // Use the first available key as implicit default
    resolvedKey = Object.keys(clusterMap)[0];
  }

  const baseUri = clusterMap[resolvedKey];
  if (!baseUri) {
    const available = Object.keys(clusterMap).join(', ');
    throw new Error(`Unknown MongoDB cluster key '${clusterKey}'. Available: ${available}`);
  }

  // If consumer already appended a DB name we strip it to re-append cleanly
  const connectionString = baseUri.endsWith('/') ? baseUri.slice(0, -1) : baseUri;
  const clientPromise = getClientPromise(connectionString);
  const client = await clientPromise;
  return client.db(dbName);
}

export default getDatabase; 