import { ObjectId, Collection, WithId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export interface Integration {
  _id?: ObjectId;
  orgId: string; // Clerk organization or user id
  name: string; // e.g., GitHub, AWS
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, unknown>; // any integration specific tokens/config
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

let _collection: Collection<Integration> | null = null;

async function getCollection() {
  if (_collection) return _collection;
  const db = await getDatabase();
  _collection = db.collection<Integration>('integrations');
  // ensure indexes once
  await _collection.createIndex({ orgId: 1 });
  await _collection.createIndex({ orgId: 1, name: 1 }, { unique: true });
  return _collection;
}

export async function createIntegration(data: Omit<Integration, '_id' | 'createdAt' | 'updatedAt'>) {
  const col = await getCollection();
  const now = new Date();
  const doc: Integration = { ...data, createdAt: now, updatedAt: now };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId } as WithId<Integration>;
}

export async function findIntegrationsByOrg(orgId: string) {
  const col = await getCollection();
  return col.find({ orgId }).toArray();
}

export async function updateIntegrationStatus(orgId: string, name: string, status: Integration['status']) {
  const col = await getCollection();
  await col.updateOne({ orgId, name }, { $set: { status, updatedAt: new Date() } }, { upsert: true });
}

export async function deleteIntegration(orgId: string, name: string) {
  const col = await getCollection();
  await col.deleteOne({ orgId, name });
}