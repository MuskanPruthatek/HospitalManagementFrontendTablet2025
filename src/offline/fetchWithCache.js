// /src/offline/fetchWithCache.js
import axios from "axios";
import { saveCache, loadCache } from "./cache";
import { isOnline } from "./helpers";

export async function fetchWithCache({
  collection,      // "patients" | "doctors" | "admissionReasons"
  url,             // API URL
  setItems,        // state setter for list
  setUpdatedAt,    // optional: state setter for timestamp
  forceOnline = false,
  setLoading       // optional: state setter for spinner
}) {
  try {
    setLoading?.(true);

    if (isOnline()) {
      const headers = forceOnline ? { "Cache-Control": "no-cache" } : undefined;
      const { data } = await axios.get(url, headers ? { headers } : undefined);
      const list = data?.data ?? [];
      setItems(list);
      await saveCache(collection, list);
      setUpdatedAt?.(Date.now());
      return "server";
    }

    // offline → cache
    const { items, updatedAt } = await loadCache(collection);
    setItems(items);
    setUpdatedAt?.(updatedAt);
    return "cache";
  } catch (err) {
    // server failed → cache fallback
    const { items, updatedAt } = await loadCache(collection);
    setItems(items);
    setUpdatedAt?.(updatedAt);
    console.warn(`[${collection}] using cache due to error`, err);
    return "cache";
  } finally {
    setLoading?.(false);
  }
}
