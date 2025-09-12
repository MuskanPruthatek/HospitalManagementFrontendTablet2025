// PDFWriter.jsx
import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { ChevronLeft } from 'lucide-react';
import { fetchWithCache } from '../../../../offline/fetchWithCache';
import { usePatient } from '../../../../context/PatientContext';
import axios from "axios";
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

// ⬇️ put these near your other imports
import * as pdfjsLib from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

// ⬇️ remove GlobalWorkerOptions.workerSrc ... and use workerPort instead
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfJsWorker();

// ✅ NEW: offline helpers
import { useOnline } from "../../../../offline/useOnline";
import { queueRequest, drainOutbox } from "../../../../offline/helpers";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const PDFWriter = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();   
  const navigate = useNavigate();

  const [numPages, setNumPages] = useState(0);
  const [pageSizes, setPageSizes] = useState([]);
  const [viewports, setViewports] = useState([]);
  const containerRefs = useRef([]);
  const bgCanvasRefs = useRef([]);
  const overlayRefs = useRef([]);
  const [loading, setLoading] = useState(false);

  const { selectedPatient } = usePatient();
  const [patientData, setPatientData] = useState(null);

  const online = useOnline();

  // 🔎 Read from query first, then fallback to state
  const qpId   = searchParams.get("id");
  const qpFile = searchParams.get("file");
  const qpName = (searchParams.get("name") || "").trim();

  const st = location.state || {};
  const pdfId   = qpId   ?? st.id   ?? null;
  const file    = qpFile ?? st.file ?? null;        // could be URL string, Blob, or ArrayBuffer
  const pdfName = (qpName || st.name || "Document").trim();
  const existingPath = st.path || qpFile || null;   // optional if you need it

  const originalBytesRef = useRef/** @type {Uint8Array|null} */(null);

  // tool: 'pen' | 'eraser'
// tool: 'pen' | 'eraser'
const [tool, setTool] = useState('pen');
const [eraserSize, setEraserSize] = useState(24);

// NEW: pen options
const [penColor, setPenColor] = useState('#6F3CDB'); // default matches your Save btn
const [penSize, setPenSize] = useState(2.5);         // px; SignaturePad uses width, not radius


  // per-page erase state
  const erasingRefs   = useRef([]);   // boolean per page
  const lastPtRefs    = useRef([]);   // {x,y} per page

  async function loadOriginalPdf() {
    if (!file) throw new Error('No file provided to PDFWriter.');
    if (file instanceof ArrayBuffer) {
      originalBytesRef.current = new Uint8Array(file);
      return;
    }
    if (file instanceof Blob) {
      const ab = await file.arrayBuffer();
      originalBytesRef.current = new Uint8Array(ab);
      return;
    }
    if (typeof file === 'string') {
      const res = await fetch(file);
      const ab = await res.arrayBuffer();
      originalBytesRef.current = new Uint8Array(ab);
      return;
    }
    throw new Error('Unsupported `file` prop.');
  }

  const freshBytes = () =>
    originalBytesRef.current ? new Uint8Array(originalBytesRef.current) : null;

  // Phase A: load & measure
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!file) return;
      setLoading(true);
      try {
        await loadOriginalPdf();
        const pdfDoc = await PDFDocument.load(freshBytes());
        const n = pdfDoc.getPageCount();
        const sizes = Array.from({ length: n }, (_, i) => {
          const p = pdfDoc.getPage(i);
          return { widthPts: p.getWidth(), heightPts: p.getHeight() };
        });
        if (!cancelled) {
          setNumPages(n);
          setPageSizes(sizes);
        }
      } catch (e) {
        console.error("Phase A failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  // Phase B: render with pdf.js
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!numPages || !pageSizes.length) return;
      await new Promise(requestAnimationFrame);
      try {
        const loadingTask = pdfjsLib.getDocument({ data: freshBytes() });
        const pdf = await loadingTask.promise;

        const vpList = [];
        for (let i = 1; i <= numPages; i++) {
          if (cancelled) return;

          const page = await pdf.getPage(i);
          const vp1 = page.getViewport({ scale: 1 });
          const target = pageSizes[i - 1];
          const scale = target.widthPts / vp1.width;
          const viewport = page.getViewport({ scale });
          vpList.push(viewport);

          const bgCanvas = bgCanvasRefs.current[i - 1];
          if (!bgCanvas) await new Promise(requestAnimationFrame);
          const canvas = bgCanvasRefs.current[i - 1];
          if (!canvas) continue;

          const ctx = canvas.getContext('2d');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({ canvasContext: ctx, viewport }).promise;

          const overlay = overlayRefs.current[i - 1];
          if (overlay) {
            overlay.off?.();
            overlay.getCanvas().width = canvas.width;
            overlay.getCanvas().height = canvas.height;
            overlay.on?.();
          }
        }
        if (!cancelled) setViewports(vpList);
      } catch (e) {
        console.error("Phase B failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [numPages, pageSizes]);

  const clearPage = (i) => { overlayRefs.current[i]?.clear(); };
  const clearAll  = () => { overlayRefs.current.forEach(ref => ref?.clear()); };

  // Fetch patient meta for upload fields
  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    const fetchPatientsWithId = (forceOnline = false) =>
      fetchWithCache({
        collection: `patientData-${selectedPatient.patientId}`,
        url: `${VITE_APP_SERVER}/api/v1/patient/${selectedPatient.patientId}`,
        setItems: setPatientData,
        forceOnline,
      });
    fetchPatientsWithId();
  }, [selectedPatient?.patientId]);

  const patientId = patientData?._id || patientData?.patientId;
  const admissionId = selectedPatient?.admissionId;

  function dataURLToUint8Array(dataURL) {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  const exportFlattenedPdfBlob = async () => {
    const base = await PDFDocument.load(freshBytes());
    const pages = base.getPages();
    for (let i = 0; i < pages.length; i++) {
      const sig = overlayRefs.current[i];
      if (!sig || sig.isEmpty?.()) continue;
      const dataUrl = sig.getCanvas().toDataURL('image/png');
      const pngBytes = dataURLToUint8Array(dataUrl);
      const png = await base.embedPng(pngBytes);
      const page = pages[i];
      page.drawImage(png, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }
    const out = await base.save();
    return new Blob([out], { type: 'application/pdf' });
  };

  // ➕/✏️ Add vs Update based on presence of `pdfId`
  const saveAndUploadPdf = async () => {
    if (!patientId || !admissionId) {
      alert('Missing patientId or admissionId.');
      return;
    }

    setLoading(true);
    try {
      const blob = await exportFlattenedPdfBlob();
      const filename = `${pdfName || 'Document'}-annotated.pdf`;

      const fd = new FormData();
      fd.append('patientId', String(patientId));
      fd.append('admissionId', String(admissionId));
      fd.append('pdfName', pdfName || 'Document');
      fd.append('pdfFile', new File([blob], filename, { type: 'application/pdf' }));

      // If updating, include the id expected by your backend (using `pdfId`)
      const isUpdate = Boolean(pdfId);
      const url = isUpdate
        ? axios.put(`${VITE_APP_SERVER}/api/v1/document-pdf/update-pdf`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : axios.post(`${VITE_APP_SERVER}/api/v1/document-pdf/add-pdf`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      
      if (isUpdate) {
        fd.append('pdfId', String(pdfId));
        // If your API needs existing path, uncomment:
        // if (existingPath) fd.append('existingPath', existingPath);
      }

      if (online) {
        await url;
        try { await drainOutbox?.(); } catch {}
        alert(isUpdate ? 'PDF updated successfully.' : 'PDF saved & uploaded successfully.');
      } else {
        await queueRequest({
          method: 'POST',
          url,
          data: fd,
          headers: { 'Content-Type': 'multipart/form-data' },
          meta: {
            kind: isUpdate ? 'update_annotated_pdf' : 'upload_annotated_pdf',
            pdfId: pdfId ?? undefined,
            filename,
            patientId,
            admissionId,
          },
        });
        alert('You’re offline. Action saved locally and will sync when online.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save/upload the PDF.');
    } finally {
      setLoading(false);
    }
  };

  function getCanvasPoint(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left);
    const y = (evt.clientY - rect.top);
    return { x, y };
  }

  function startErase(i, evt) {
    const sig = overlayRefs.current[i];
    if (!sig) return;
    const canvas = sig.getCanvas?.() || sig._canvas || overlayRefs.current[i].canvas;
    if (!canvas) return;

    erasingRefs.current[i] = true;
    lastPtRefs.current[i] = getCanvasPoint(canvas, evt);
    drawDotErase(canvas, lastPtRefs.current[i], eraserSize);
  }
  function moveErase(i, evt) {
    if (!erasingRefs.current[i]) return;
    const sig = overlayRefs.current[i];
    if (!sig) return;
    const canvas = sig.getCanvas?.() || sig._canvas || overlayRefs.current[i].canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const prev = lastPtRefs.current[i];
    const cur  = getCanvasPoint(canvas, evt);
    lastPtRefs.current[i] = cur;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = eraserSize;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(cur.x,  cur.y);
    ctx.stroke();
    ctx.restore();
  }
  function endErase(i) {
    erasingRefs.current[i] = false;
    lastPtRefs.current[i] = null;
  }
  function drawDotErase(canvas, pt, size) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  useEffect(() => {
    if (!numPages) return;
    const cleanups = [];

    for (let i = 0; i < numPages; i++) {
      const sig = overlayRefs.current[i];
      if (!sig) continue;

      const canvas = sig.getCanvas?.() || sig._canvas || overlayRefs.current[i].canvas;
      if (!canvas) continue;

      if (tool === 'eraser') {
        sig.off?.();

        const down = (e) => { e.preventDefault(); startErase(i, e); };
        const move = (e) => { e.preventDefault(); moveErase(i, e); };
        const up   = (e) => { e.preventDefault(); endErase(i); };

        canvas.addEventListener('pointerdown', down, { passive: false });
        window.addEventListener('pointermove',  move, { passive: false });
        window.addEventListener('pointerup',    up,   { passive: false });

        cleanups.push(() => {
          canvas.removeEventListener('pointerdown', down);
          window.removeEventListener('pointermove',  move);
          window.removeEventListener('pointerup',    up);
        });
      } else {
        // Pen mode
        sig.on?.();
        cleanups.push(() => {});
      }
    }

    return () => cleanups.forEach((fn) => fn && fn());
  }, [tool, numPages, eraserSize]);

  return (
    <div className="w-full h-full bg-white font-inter">
      {/* Top bar */}
      <div className="w-full h-[94px] overflow-x-scroll bg-[#FDFDFD] drop-shadow-lg drop-shadow-[#18171740] flex justify-between items-center pr-5">
        <div className="flex gap-x-4 items-center">
          <ChevronLeft size={60} onClick={() => navigate(-1)} className="cursor-pointer" />
          <p className="font-semibold text-[20px] text-[#282D30] line-clamp-1 max-w-[60vw]">
            {pdfName}
          </p>
        </div>

        <div className="flex gap-x-3 items-center">
          <button className="w-[97px] h-[44px] bg-[#36D7A0] rounded-[10px] flex justify-center items-center px-4 text-white" title="Share (WhatsApp preview)">
            <img src="/assets/whatsapp-line.svg" alt="wa" />
          </button>

          <button
            onClick={clearAll}
            disabled={loading}
            className="w-[97px] h-[44px] flex justify-center items-center rounded-[10px] border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
            title="Clear all pages"
          >
            <span className="text-sm font-medium">Clear All</span>
          </button>

          <button
            onClick={saveAndUploadPdf}
            disabled={loading || !numPages}
            className="w-[97px] h-[44px] flex justify-center items-center rounded-[10px] bg-[#6F3CDB] text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
            title={pdfId ? "Update PDF" : "Save & Upload PDF"}
          >
            <span className="text-sm font-semibold">{pdfId ? "Update" : "Save PDF"}</span>
          </button>

          <div className="flex items-center gap-3 pl-2 ml-1 border-l border-zinc-200">
  <div className="inline-flex rounded-xl p-1 bg-zinc-100 border border-zinc-200">
    <button
      onClick={() => setTool('pen')}
      className={`h-[44px] px-3 rounded-lg text-sm font-medium transition ${tool === 'pen' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-600 hover:text-zinc-800'}`}
      title="Pen (P)"
    >
      ✒️ Pen
    </button>
    <button
      onClick={() => setTool('eraser')}
      className={`h-[44px] px-3 rounded-lg text-sm font-medium transition ${tool === 'eraser' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-600 hover:text-zinc-800'}`}
      title="Eraser (E)"
    >
      🧽 Eraser
    </button>
  </div>

  {tool === 'pen' && (
    <div className="flex items-center gap-4">
      {/* Color swatches */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">Color</span>
        {['#111827', '#6F3CDB', '#EF4444', '#10B981', '#2563EB', '#F59E0B'].map((c) => (
          <button
            key={c}
            onClick={() => setPenColor(c)}
            className={`h-6 w-6 rounded-full border ${penColor === c ? 'ring-2 ring-offset-2 ring-zinc-400' : 'border-zinc-300'}`}
            style={{ background: c }}
            title={c}
          />
        ))}
        {/* Custom color picker (optional) */}
        <label className="relative inline-flex items-center">
          <input
            type="color"
            className="h-6 w-6 rounded-md border border-zinc-300 p-0 bg-transparent cursor-pointer"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            title="Custom color"
          />
        </label>
      </div>

      {/* Thickness slider */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-600">Thickness</label>
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.5}
          value={penSize}
          onChange={(e) => setPenSize(Number(e.target.value))}
          className="accent-zinc-800 h-1 w-36"
          title={`Pen thickness: ${penSize}px`}
        />
        <span className="text-xs text-zinc-700 w-8 text-right tabular-nums">
          {penSize.toFixed(1)}px
        </span>
      </div>
    </div>
  )}

  {tool === 'eraser' && (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-600">Size</label>
      <input
        type="range"
        min={6}
        max={72}
        value={eraserSize}
        onChange={(e) => setEraserSize(Number(e.target.value))}
        className="accent-zinc-800 h-1 w-28"
        title={`Eraser size: ${eraserSize}px`}
      />
      <span className="text-xs text-zinc-700 w-5 text-right tabular-nums">
        {eraserSize}px
      </span>
    </div>
  )}
</div>

        </div>
      </div>

      {loading && <p className="px-4 py-2">Loading PDF…</p>}

      <div className="w-full mt-5 flex justify-center relative portrait:h-[90%] landscape:h-[85%] overflow-y-scroll">
        {Array.from({ length: numPages }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (containerRefs.current[i] = el)}
            className="relative inline-block m-4"
            style={{ touchAction: 'none' }}
          >
            <canvas ref={(el) => (bgCanvasRefs.current[i] = el)} className="block" />
            <SignatureCanvas
  ref={(el) => (overlayRefs.current[i] = el)}
  penColor={penColor}
  minWidth={penSize}
  maxWidth={penSize}
  canvasProps={{ className: 'absolute top-0 left-0' }}
/>

            <div className="flex gap-2 mt-2">
              <button className="btn" onClick={() => clearPage(i)}>
                Clear Page {i + 1}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFWriter;
