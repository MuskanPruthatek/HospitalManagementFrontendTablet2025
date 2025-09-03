import React, { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

/**
 * SignatureField
 * ──────────────────────────────────────────────────────────
 * • Shows an existing signature (URL or File) below the pad.
 * • Lets the user draw / clear / save a NEW signature.
 * • Emits the new drawing as File through onCapture().
 * • Because we never paint the remote image on the canvas,
 *   the canvas remains same-origin → no “tainted” errors.
 */
export default function SignatureField({
  onCapture,           // (File) → void
  existing = null,     // string URL | File/Blob | null
  label,
  style = {},
}) {
  const padRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  /* -------- preview only (never touches the canvas) -------- */
  useEffect(() => {
    if (!existing) return setPreviewSrc(null);

    if (typeof existing === "string") {
      setPreviewSrc(existing);            // remote URL
    } else {
      const url = URL.createObjectURL(existing); // File/Blob
      setPreviewSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [existing]);

  /* -------- actions -------- */
  const handleClear = () => padRef.current?.clear();

  const handleSave = () => {
    const canvas = padRef.current?.getCanvas();
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture?.(new File([blob], "signature.png", { type: "image/png" }));
      },
      "image/png",
      1.0
    );
  };

  /* -------- UI -------- */
  return (
    <div
      className="flex flex-col items-center gap-2 w-full"
      style={style}
    >
      {label && (
        <p className="text-xs font-medium text-gray-600">{label}</p>
      )}

      <SignatureCanvas
        ref={padRef}
        penColor="#000"
        canvasProps={{
          className:
            "border rounded shadow-sm w-full h-24 cursor-crosshair",
        }}
      />

      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 text-xs rounded bg-[#36D7A0] text-white hover:brightness-110"
        >
          Save
        </button>
      </div>

      <div className="mt-2 w-full h-12 flex items-center justify-center overflow-hidden">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="existing signature"
            className="max-h-12 object-contain"
          />
        ) : (
          <span className="text-[11px] text-gray-400">No saved signature</span>
        )}
      </div>
    </div>
  );
}
