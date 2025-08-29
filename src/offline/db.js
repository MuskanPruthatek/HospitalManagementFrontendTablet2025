import Dexie from 'dexie';

export const db = new Dexie('hms-offline');
db.version(1).stores({
  drafts: 'id, collection, key, updatedAt',   // autosaved form drafts
  outbox: 'id, collection, createdAt',         // queued API requests
  caches: 'collection, updatedAt'          // ⟵ NEW: 1 row per list (patients, doctors, etc.)
});
