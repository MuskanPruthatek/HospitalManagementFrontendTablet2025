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


