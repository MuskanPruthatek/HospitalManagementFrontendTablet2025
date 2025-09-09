import { useMemo } from "react";
import { FIELD_BINDINGS } from "./fieldBindings";

export const useAdmissionFlags = (fields = []) => {
  const lookup = useMemo(() => {
    const m = new Map();
    for (const f of fields) {
      m.set((f.fieldName || "").trim().toLowerCase(), !!f.status);
    }
    return m;
  }, [fields]);

  const showByFieldName = (name, fallback = true) => {
    const key = (name || "").trim().toLowerCase();
    return lookup.has(key) ? lookup.get(key) : fallback; // default to visible if not configured
  };

  const show = (uiKey, fallback = true) => {
    const bound = FIELD_BINDINGS[uiKey] ?? uiKey;
    if (Array.isArray(bound)) {
      // visible if ANY bound field is enabled; switch to .every if you want ALL required
      return bound.some((n) => showByFieldName(n, fallback));
    }
    return showByFieldName(bound, fallback);
  };

  return { show };
}