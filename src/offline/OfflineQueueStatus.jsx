import React from "react";
import { useOutboxCounts } from "./useOutboxCounts";
import { drainOutbox } from "./helpers";
import { senders } from "./senders";
// import { useOutboxCounts } from "../../offline/useOutboxCounts";
// import { drainOutbox } from "../../offline/helpers";
// import { senders } from "../../offline/senders";

// Map your internal collection keys to friendly labels
const DEFAULT_LABELS = {
  bedExchange: "Bed exchanges",
  beds: "Beds",
  labReports: "Lab reports",
  patientReg: "Patient registration",
};

export default function OfflineQueueStatus({
  labels = DEFAULT_LABELS,       // { key: "Label" }
  showZeroes = false,            // whether to show modules with 0
  showSyncButton = true,         // show a "Sync now" button
  onAfterSync,                   // optional callback after a drain
}) {
  const keys = Object.keys(labels);
  const { total, byCollection } = useOutboxCounts(keys);

  const handleSync = async () => {
    const res = await drainOutbox(senders);
    if (typeof onAfterSync === "function") onAfterSync(res);
  };

  const items = keys
    .map((k) => ({ key: k, label: labels[k], count: byCollection[k] || 0 }))
    .filter((it) => (showZeroes ? true : it.count > 0));

  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          {total > 0 ? (
            <span><b>{total}</b> change(s) waiting to upload</span>
          ) : (
            <span>All data synced ✅</span>
          )}
        </div>
        {showSyncButton && (
          <button
            onClick={handleSync}
            className="px-3 py-1.5 rounded-lg bg-[#6F3CDB] text-white text-sm font-semibold disabled:opacity-60"
            disabled={total === 0}
            type="button"
          >
            Sync now
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length === 0 && showZeroes === false ? (
          <span className="text-xs text-gray-500">No pending items per module.</span>
        ) : (
          items.map(({ key, label, count }) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-xs"
              title={key}
            >
              <span className="font-medium text-gray-700">{label}</span>
              <span className="rounded-full px-2 py-0.5 text-[11px] bg-gray-100">{count}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
