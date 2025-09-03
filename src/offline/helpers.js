// /src/offline/helpers.js
import { db } from './db';

const makeId = (collection, key) => `${collection}:${key}`;

export async function saveDraft(collection, key, data) {
  await db.drafts.put({
    id: makeId(collection, key),
    collection,
    key,
    data,
    updatedAt: Date.now()
  });
}

export const isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);

export async function queueRequest({ id, collection, endpoint, method, dto, meta }) {
  await db.outbox.put({
    id, collection, endpoint, method, dto, meta,
    retries: 0,
    createdAt: Date.now()
  });
}

export async function loadDraft(collection, key) {
  const row = await db.drafts.get(makeId(collection, key));
  return row?.data ?? null;
}

export async function clearDraft(collection, key) {
  await db.drafts.delete(makeId(collection, key));
}

export async function listDrafts(collection) {
  return db.drafts.where('collection').equals(collection).reverse().sortBy('updatedAt');
}

/** Runs all queued requests. 
 *  Pass a map of "collection name -> sender function" that knows how to call your API.
 */
export async function drainOutbox(senders) {
  const items = await db.outbox.orderBy('createdAt').toArray();

  let processed = 0;
  const byCollection = {};   // e.g., { bedExchange: 1, labReports: 2 }

  for (const row of items) {
    // Choose which sender to call:
    const senderKey = row?.meta?.sender;             // explicit override
    const fn =
      (senderKey && senders[senderKey]) ||
      senders[row.collection] ||
      senders.auto ||                                 // generic auto
      senders.genericJSON;                            // final fallback

    try {
      await fn(row);
      await db.outbox.delete(row.id);
      processed += 1;
      byCollection[row.collection] = (byCollection[row.collection] || 0) + 1;
    } catch (e) {
      const status = e?.response?.status;
      // Drop permanent client errors; keep others for retry
      if (status && status >= 400 && status < 500 && status !== 429) {
        await db.outbox.delete(row.id);
      } else {
        await db.outbox.update(row.id, { retries: row.retries + 1, lastError: String(e) });
      }
    }
  }

  return { processed, byCollection };
}

// --- events you can fire so UI can update without polling ---
const OUTBOX_CHANGED_EVT = "outbox:changed";
export const signalOutboxChanged = () => {
  window.dispatchEvent(new CustomEvent(OUTBOX_CHANGED_EVT));
};

// --- if you already have a DB util, reuse it; otherwise minimal open helper ---
async function openOfflineDB() {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open("HMS_OFFLINE_DB", 1);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      // these store names should match what queueRequest uses
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "id" });
      if (!db.objectStoreNames.contains("syncLog")) db.createObjectStore("syncLog", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Count queued items for the given collections
export async function getOutboxCountsByCollection(collections = []) {
  const db = await openOfflineDB();
  const tx = db.transaction("outbox", "readonly");
  const store = tx.objectStore("outbox");
  const all = await store.getAll();
  const by = {};
  let total = 0;
  for (const c of collections) {
    const n = all.filter(x => x.collection === c).length;
    by[c] = n;
    total += n;
  }
  return { total, by };
}

// Persist & read the last flush result so you can show "Uploaded"
const LAST_FLUSH_KEY = "offline:lastFlushSummary";
export function saveLastFlushSummary(summary) {
  try { localStorage.setItem(LAST_FLUSH_KEY, JSON.stringify(summary || {})); } catch {}
  signalOutboxChanged();
}
export function loadLastFlushSummary() {
  try { return JSON.parse(localStorage.getItem(LAST_FLUSH_KEY) || "{}"); } catch { return {}; }
}
export { OUTBOX_CHANGED_EVT };



