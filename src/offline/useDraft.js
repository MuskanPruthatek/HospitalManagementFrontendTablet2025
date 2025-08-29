// /src/offline/useDraft.js
import { useEffect, useRef } from 'react';
import { saveDraft, loadDraft } from './helpers';

export function useLoadDraft(collection, key, setData) {
  useEffect(() => {
    (async () => {
      const d = await loadDraft(collection, key);
      if (d) setData(d);
    })();
  }, [collection, key, setData]);
}

export function useAutosaveDraft(collection, key, value, delay = 700) {
  const t = useRef(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => { saveDraft(collection, key, value); }, delay);
    return () => t.current && clearTimeout(t.current);
  }, [collection, key, value, delay]);
}
