import { ObjectId, Collection, WithId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface Evidence {
  _id?: ObjectId;
  orgId: string;
  integrationId: ObjectId;
  controlId: string; // e.g., 'CC6.1'
  description: string;
  artifactPath?: string; // S3 path or similar
  collectedAt: Date;
  createdAt: Date;
}

let _collection: Collection<Evidence> | null = null;

async function getCollection() {
  if (_collection) return _collection;
  const db = await getDatabase();
  _collection = db.collection<Evidence>('evidence');
  await _collection.createIndex({ orgId: 1 });
  await _collection.createIndex({ integrationId: 1 });
  await _collection.createIndex({ controlId: 1 });
  return _collection;
}

export async function insertEvidence(data: Omit<Evidence, '_id' | 'createdAt'>) {
  const col = await getCollection();
  const doc: Evidence = { ...data, createdAt: new Date() };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId } as WithId<Evidence>;
}

export async function findEvidenceByOrg(orgId: string) {
  const col = await getCollection();
  return col.find({ orgId }).toArray();
}