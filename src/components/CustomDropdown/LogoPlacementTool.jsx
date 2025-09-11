import React, { useEffect, useRef, useState, useMemo } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

// 1) IMPORTANT: point worker to a local file to avoid CORS issues
//    Copy the worker into /public/pdf.worker.min.js or serve from your own domain
GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const defaultCfg = {
  placement: "right",     // 'left' | 'center' | 'right'
  topMargin: 24,          // PDF points (1 pt = 1/72 inch)
  sideMargin: 24,         // left/right margin in points
  maxBoxW: 160,           // max logo box width (points)
  maxBoxH: 60,            // max logo box height (points)
  pageIndex: 0,           // usually page 0
};

function fitToBox(imgW, imgH, boxW, boxH) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  return { w: imgW * scale, h: imgH * scale };
}

// Core coordinate math used by BOTH preview and stamping
function computeLogoRect({ pageW, pageH, cfg, imgW, imgH }) {
  const { placement, topMargin, sideMargin, maxBoxW, maxBoxH } = cfg;
  const { w, h } = fitToBox(imgW, imgH, maxBoxW, maxBoxH);

  // y from bottom (PDF coords); we want a top margin:
  const y = pageH - topMargin - h;

  let x;
  if (placement === "left") {
    x = sideMargin;
  } else if (placement === "right") {
    x = pageW - sideMargin - w;
  } else {
    // center horizontally
    x = (pageW - w) / 2;
  }

  return { x, y, w, h };
}

export default function LogoPlacementTool({
  pdfUrl,           // string: PDF to load
  logoUrl,          // string: hospital logo (PNG/JPG recommended; PNG preferred)
  initialConfig,    // optional: override defaults
  onSave,           // function(bytes) -> you upload/share; receives Uint8Array
}) {
  const [cfg, setCfg] = useState({ ...defaultCfg, ...(initialConfig || {}) });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [pdfBytes, setPdfBytes] = useState(null);
  const [logoBytes, setLogoBytes] = useState(null);

  // Preview canvas refs
  const canvasRef = useRef(null);

  // Fetch original assets once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError("");
        setLoading(true);

        const [pdfRes, logoRes] = await Promise.all([
          fetch(pdfUrl, { credentials: "include" }),
          fetch(logoUrl, { credentials: "include" }),
        ]);
        if (!pdfRes.ok) throw new Error("Failed to fetch PDF");
        if (!logoRes.ok) throw new Error("Failed to fetch logo");

        const pdfArr = new Uint8Array(await pdfRes.arrayBuffer());
        const logoArr = new Uint8Array(await logoRes.arrayBuffer());

        if (!cancelled) {
          setPdfBytes(pdfArr);
          setLogoBytes(logoArr);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Load error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfUrl, logoUrl]);

  // Draw preview (page 1 + logo)
  useEffect(() => {
    if (!pdfBytes || !logoBytes) return;

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const page = await pdf.getPage(cfg.pageIndex + 1); // pdf.js is 1-based
        const viewport = page.getViewport({ scale: 1.5 }); // preview scale

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Draw the logo preview
        // We need its natural size in (preview) pixels; we'll keep aspect fitting
        const img = await loadImageFromBytes(logoBytes);
        const pageW_pts = page.view[2] - page.view[0]; // PDF pts width
        const pageH_pts = page.view[3] - page.view[1]; // PDF pts height

        // Convert PDF points → preview pixels using scale = viewport.width / pageW_pts
        const scalePxPerPt = viewport.width / pageW_pts;

        // Compute placement in PDF points first (source of truth)
        const rect = computeLogoRect({
          pageW: pageW_pts, pageH: pageH_pts,
          cfg, imgW: img.naturalWidth, imgH: img.naturalHeight
        });

        // Convert to pixels for canvas preview
        const px = {
          x: rect.x * scalePxPerPt,
          y: (pageH_pts - rect.y - rect.h) * scalePxPerPt, // convert from bottom-left to canvas top-left
          w: rect.w * scalePxPerPt,
          h: rect.h * scalePxPerPt,
        };

        // Fit image to rect (we already computed w,h inside computeLogoRect)
        // Draw
        ctx.drawImage(img, px.x, px.y, px.w, px.h);
      } catch (e) {
        console.error(e);
        setError("Preview error");
      }
    })();

  }, [pdfBytes, logoBytes, cfg]);

  const saveStamped = async () => {
    try {
      setError("");
      setLoading(true);

      const stamped = await stampPdfWithLogo({
        pdfBytes,
        logoBytes,
        cfg
      });

      // hand bytes back to parent (upload to server or share), or trigger download directly
      if (onSave) onSave(stamped);
      else {
        const blob = new Blob([stamped], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "document-with-logo.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-12 gap-6">
      {/* Controls */}
      <div className="col-span-12 lg:col-span-4">
        <div className="rounded-2xl border p-4 space-y-4">
          <h3 className="font-semibold text-lg">Logo placement</h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="placement"
                value="left"
                checked={cfg.placement === "left"}
                onChange={(e) => setCfg((c) => ({ ...c, placement: e.target.value }))}
              />
              <span>Top-Left</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="placement"
                value="center"
                checked={cfg.placement === "center"}
                onChange={(e) => setCfg((c) => ({ ...c, placement: e.target.value }))}
              />
              <span>Top-Center</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="placement"
                value="right"
                checked={cfg.placement === "right"}
                onChange={(e) => setCfg((c) => ({ ...c, placement: e.target.value }))}
              />
              <span>Top-Right</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Top margin (pt)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={cfg.topMargin}
                onChange={(e) => setCfg((c) => ({ ...c, topMargin: Number(e.target.value) }))}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Side margin (pt)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={cfg.sideMargin}
                onChange={(e) => setCfg((c) => ({ ...c, sideMargin: Number(e.target.value) }))}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Max width (pt)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={cfg.maxBoxW}
                onChange={(e) => setCfg((c) => ({ ...c, maxBoxW: Number(e.target.value) }))}
                min={10}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Max height (pt)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={cfg.maxBoxH}
                onChange={(e) => setCfg((c) => ({ ...c, maxBoxH: Number(e.target.value) }))}
                min={10}
              />
            </div>
          </div>

          <button
            onClick={saveStamped}
            disabled={loading || !pdfBytes || !logoBytes}
            className="w-full mt-2 rounded-xl bg-black text-white py-2 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save / Download PDF"}
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <p className="text-xs text-gray-500">
            Points → inches: divide by 72. PNG with transparent background looks best.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="col-span-12 lg:col-span-8">
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold text-lg mb-3">Preview (Page 1)</h3>
          <canvas ref={canvasRef} className="max-w-full h-auto border rounded" />
          {!pdfBytes && <p className="text-sm text-gray-500 mt-2">Loading PDF…</p>}
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------

async function loadImageFromBytes(uint8arr) {
  const blob = new Blob([uint8arr]);
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // don’t revoke immediately; some browsers draw after microtask
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function stampPdfWithLogo({ pdfBytes, logoBytes, cfg }) {
  // Load PDF
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // Embed logo
  let logo;
  try {
    logo = await pdfDoc.embedPng(logoBytes);
  } catch {
    logo = await pdfDoc.embedJpg(logoBytes);
  }

  const page = pdfDoc.getPage(cfg.pageIndex);
  const pageW = page.getWidth();
  const pageH = page.getHeight();

  // Compute rect using same logic as preview
  const { width: imgW, height: imgH } = logo.size();
  const rect = computeLogoRect({
    pageW, pageH,
    cfg,
    imgW, imgH,
  });

  page.drawImage(logo, {
    x: rect.x,
    y: rect.y,
    width: rect.w,
    height: rect.h,
  });

  // Return bytes (Uint8Array)
  return await pdfDoc.save();
}
