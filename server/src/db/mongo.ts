import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'cryptox';

let client: MongoClient | null = null;
let db: ReturnType<MongoClient['db']> | null = null;

export async function getMongo() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log('MongoDB connected');
  return db;
}

export async function closeMongo() {
  if (client) await client.close();
}
