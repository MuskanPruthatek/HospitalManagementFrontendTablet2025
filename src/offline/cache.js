import { db } from './db';

export async function saveCache(collection, items) {
  await db.caches.put({
    collection,         // e.g. "patients"
    items,              // array of objects you got from server
    updatedAt: Date.now()
  });
}

export async function loadCache(collection) {
  const row = await db.caches.get(collection);
  return row ? { items: row.items, updatedAt: row.updatedAt } : { items: [], updatedAt: 0 };
}
