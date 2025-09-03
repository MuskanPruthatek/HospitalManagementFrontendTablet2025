import { useEffect, useState } from "react";
import { db } from "./db";

/**
 * Returns live counts of queued requests per collection.
 *
 * @param {string[]=} collections  Optional whitelist. If omitted, auto-discovers from outbox.
 */
export function useOutboxCounts(collections) {
  const [counts, setCounts] = useState({ total: 0, byCollection: {} });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      // Total first
      const total = await db.outbox.count();

      let byCollection = {};
      if (Array.isArray(collections) && collections.length > 0) {
        // Fast path when you know the module keys you care about
        const pairs = await Promise.all(
          collections.map(async (c) => [c, await db.outbox.where("collection").equals(c).count()])
        );
        byCollection = Object.fromEntries(pairs);
      } else {
        // Auto-discover (safe & simple): read all and reduce
        // If your outbox could be very large, switch to a cursor/each():
        const rows = await db.outbox.toArray();
        for (const r of rows) {
          byCollection[r.collection] = (byCollection[r.collection] || 0) + 1;
        }
      }

      if (!cancelled) setCounts({ total, byCollection });
    }

    // initial load
    refresh();

    // live updates via Dexie hooks
    const h1 = db.outbox.hook("creating", refresh);
    const h2 = db.outbox.hook("deleting", refresh);
    const h3 = db.outbox.hook("updating", refresh);

    // tiny safety net in case hooks miss something
    const t = setInterval(refresh, 4000);

    return () => {
      cancelled = true;
      db.outbox.hook("creating").unsubscribe(h1);
      db.outbox.hook("deleting").unsubscribe(h2);
      db.outbox.hook("updating").unsubscribe(h3);
      clearInterval(t);
    };
  }, [collections?.join("|")]); // rebind if list changes

  return counts; // { total, byCollection: { bedExchange: 2, labReports: 1, ... } }
}
