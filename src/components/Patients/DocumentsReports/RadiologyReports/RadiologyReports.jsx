import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePatient } from "../../../../context/PatientContext";
import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import {
  ChevronLeft,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ----------------------------- Rename Modal ----------------------------- */
const RenameModal = ({
  open,
  onClose,
  record,
  onSubmit,     // (newName: string) => Promise<void>
  renaming = false,
}) => {
  const [name, setName] = React.useState(record?.name || "");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setName(record?.name || "");
      // autofocus
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, record?.name]);

  if (!open || !record) return null;

  // basic filename validation (no path/illegal chars)
  const ILLEGAL = /[\\/:*?"<>|]/g;

  const onSave = () => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (ILLEGAL.test(trimmed)) return alert("File name has illegal characters: \\ / : * ? \" < > |");

    // keep original extension if the user removed it
    const old = record.name || "";
    const dot = old.lastIndexOf(".");
    const oldExt = dot !== -1 ? old.slice(dot) : "";
    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(trimmed);

    const finalName = hasExt ? trimmed : (oldExt ? `${trimmed}${oldExt}` : trimmed);

    onSubmit(finalName);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center px-4"
         onClick={onClose}>
      <div className="relative w-[520px] rounded-2xl bg-[#FDFDFD] border border-[#D8D8D8] p-6"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 hover:bg-black/5">
          <X size={28} />
        </button>

        <h3 className="text-[24px] font-semibold mb-4">Rename File</h3>
        <label className="block text-[16px] font-medium mb-1">New name</label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-[48px] rounded-lg border px-3 outline-none focus:ring-2 focus:ring-[#6F3CDB]"
          placeholder="Enter new file name"
          onKeyDown={(e) => e.key === "Enter" && onSave()}
        />
        <p className="text-sm text-gray-500 mt-2">
          Tip: Avoid characters \ / : * ? " &lt; &gt; |. If you remove the extension, we’ll keep the original one.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[16px] rounded-lg border">Cancel</button>
          <button
            onClick={onSave}
            disabled={renaming}
            className="px-4 py-2 rounded-lg bg-[#6F3CDB] text-[16px] text-white"
          >
            {renaming ? "Renaming…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------- Camera Capture Modal -------------------------- */
const CameraCaptureModal = ({
  open,
  onClose,
  onUpload,
  uploading = false,
  progress = 0,
}) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  const [stream, setStream] = React.useState(null);
  const [devices, setDevices] = React.useState([]);        // [{deviceId,label}, ...]
  const [deviceIndex, setDeviceIndex] = React.useState(0); // which camera we're using
  const [facing, setFacing] = React.useState("environment");// 'environment' | 'user' (hint only)
  const [shots, setShots] = React.useState([]);            // [{ dataUrl, w, h }]
  const [error, setError] = React.useState("");

  const stopStream = React.useCallback(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const attachStreamToVideo = async (mediaStream) => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    // attributes that help iOS Safari
    v.setAttribute("playsinline", "");
    v.muted = true;
    v.autoplay = true;
    v.srcObject = mediaStream;
    try {
      await v.play();
    } catch (_) {
      // ignore autoplay race; user will press capture after interaction anyway
    }
  };

  const listCameras = async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      return cams;
    } catch {
      return [];
    }
  };

  // Try multiple constraint fallbacks; prefer deviceId when we know one.
  const getStream = async (opts = {}) => {
    const attempts = [];

    // 1) exact deviceId if provided
    if (opts.deviceId) {
      attempts.push({ video: { deviceId: { exact: opts.deviceId } }, audio: false });
    }

    // 2) exact facingMode (mobile usually supports)
    if (opts.facingMode) {
      attempts.push({ video: { facingMode: { exact: opts.facingMode } }, audio: false });
      attempts.push({ video: { facingMode: opts.facingMode }, audio: false });
    }

    // 3) generic video
    attempts.push({ video: true, audio: false });

    let lastErr;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };

  const pickDeviceIdForFacing = (cams, want) => {
    if (!cams?.length) return null;
    // Heuristics: try to match label
    const label = (s) => (s || "").toLowerCase();
    const backMatch = cams.find((c) =>
      /back|rear|environment/i.test(c.label)
    );
    const frontMatch = cams.find((c) =>
      /front|user|face/i.test(c.label)
    );
    if (want === "environment" && backMatch) return backMatch.deviceId;
    if (want === "user" && frontMatch) return frontMatch.deviceId;

    // Fallback: on devices with 2 cams, assume index 0 = front, 1 = back (varies by device)
    if (cams.length > 1) {
      return want === "environment" ? cams[cams.length - 1].deviceId : cams[0].deviceId;
    }
    return cams[0].deviceId;
  };

  const startCamera = React.useCallback(
    async (mode) => {
      try {
        setError("");
        stopStream();

        // If we don't have permission yet, request a simple stream once (unlocks labels on iOS).
        if (!devices.length) {
          try {
            const warmup = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            warmup.getTracks().forEach((t) => t.stop());
          } catch (e) {
            // ignore; we'll surface the real error below
          }
        }

        const cams = (await listCameras()) || [];
        const preferredId = cams.length ? pickDeviceIdForFacing(cams, mode) : null;

        const s = await getStream({ deviceId: preferredId, facingMode: mode });
        setStream(s);

        // Keep device index in sync if we matched a deviceId
        if (preferredId) {
          const idx = cams.findIndex((c) => c.deviceId === preferredId);
          if (idx >= 0) setDeviceIndex(idx);
        }

        await attachStreamToVideo(s);
      } catch (e) {
        const name = e?.name || "Error";
        const msg = e?.message || String(e);
        setError(`${name}: ${msg}`);
      }
    },
    [devices.length, stopStream]
  );

  // Open/close lifecycle
  React.useEffect(() => {
    if (open) startCamera(facing);
    return () => stopStream();
  }, [open, facing, startCamera, stopStream]);

  // Flip between front/back. If we have multiple cameras, switch device explicitly.
  const flip = async () => {
    const cams = devices;
    if (cams.length > 1) {
      const next = (deviceIndex + 1) % cams.length;
      setDeviceIndex(next);
      try {
        setError("");
        stopStream();
        const s = await getStream({ deviceId: cams[next].deviceId });
        setStream(s);
        await attachStreamToVideo(s);
      } catch (e) {
        const name = e?.name || "Error";
        const msg = e?.message || String(e);
        setError(`${name}: ${msg}`);
      }
    } else {
      const nextFacing = facing === "environment" ? "user" : "environment";
      setFacing(nextFacing);
    }
  };

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    if (facing === "user" && devices.length <= 1) {
      // Only mirror if we're using facingMode rather than an explicit back camera device
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, w, h);

    const dataUrl = c.toDataURL("image/jpeg", 0.85);
    setShots((prev) => [...prev, { dataUrl, w, h }]);
  };

  const removeShot = (idx) => setShots((s) => s.filter((_, i) => i !== idx));
  const clearShots = () => setShots([]);

  const createPdfAndUpload = async () => {
    if (!shots.length) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    shots.forEach((s, idx) => {
      if (idx) pdf.addPage();
      const imgRatio = s.w / s.h;
      const pageRatio = pageW / pageH;
      let w, h;
      if (imgRatio > pageRatio) {
        w = pageW;
        h = w / imgRatio;
      } else {
        h = pageH;
        w = h * imgRatio;
      }
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      pdf.addImage(s.dataUrl, "JPEG", x, y, w, h);
    });

    const blob = pdf.output("blob");
    const filename = `Radiology_Capture_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
    const file = new File([blob], filename, { type: "application/pdf" });
    await onUpload(file);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl p-5 relative">
        <button onClick={onClose} className="absolute right-3 top-3 p-2 rounded-lg hover:bg-black/5">
          <X size={28} />
        </button>

        <h3 className="text-2xl font-semibold mb-1">Capture Document</h3>
        <p className="text-sm text-gray-600 mb-3">
          {devices.length
            ? `Cameras detected: ${devices.length} • Using: ${devices[deviceIndex]?.label || "Unknown"}`
            : "Detecting cameras…"}
        </p>

        {error ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 mb-4">
            {error}
            <div className="text-xs text-red-600 mt-1">
              Tip: Close any page using the camera, ensure site has permission, and try HTTPS/localhost.
            </div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[320px] object-contain bg-black"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={capture}
                    className="px-6 py-3 rounded-lg bg-[#6F3CDB] text-white font-semibold"
                    disabled={uploading}
                  >
                    Capture
                  </button>
                  <button
                    onClick={flip}
                    className="px-6 py-3 rounded-lg border font-semibold"
                    disabled={uploading}
                  >
                    {devices.length > 1 ? "Switch Camera" : "Flip Camera"}
                  </button>
                  <button
                    onClick={clearShots}
                    className="px-6 py-3 rounded-lg border font-semibold"
                    disabled={uploading || !shots.length}
                  >
                    Clear Shots
                  </button>
                </div>
              </div>

              <div className="md:col-span-1">
                <p className="font-semibold mb-2">Pages ({shots.length})</p>
                <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                  {shots.map((s, i) => (
                    <div key={i} className="relative border rounded-lg overflow-hidden">
                      <img src={s.dataUrl} alt={`Shot ${i + 1}`} className="w-full h-28 object-cover" />
                      <button
                        onClick={() => removeShot(i)}
                        className="absolute right-2 top-2 bg-black/60 text-white rounded-full p-1"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {!shots.length && (
                    <div className="text-sm text-gray-500">Captured images will appear here.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-5 py-3 rounded-lg border font-semibold" disabled={uploading}>
                Cancel
              </button>
              <button
                onClick={createPdfAndUpload}
                className="px-6 py-3 rounded-lg bg-[#6F3CDB] text-white font-semibold disabled:opacity-50"
                disabled={uploading || !shots.length}
              >
                {uploading ? "Uploading…" : "Create PDF & Upload"}
              </button>
            </div>

            {uploading && (
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded">
                  <div className="h-2 bg-[#6F3CDB] rounded" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-gray-600 mt-1 text-right">{progress}%</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ----------------------- Edit Modal (Replace PDF) ----------------------- */
const EditModal = ({
  open,
  onClose,
  record,
  editFile,
  setEditFile,
  onSubmit,
  updating,
  updateProgress,
}) => {
  const fileInputRef = useRef(null);
  if (!open || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center px-4">
      <div className="relative w-[70%] rounded-2xl bg-[#FDFDFD] border border-[#D8D8D8] p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 hover:bg-black/5"
        >
          <X size={40} />
        </button>

        <h3 className="text-[28px] font-semibold mb-4">Edit Radiology Report</h3>

        <div className="mb-4">
          <p className="text-[20px] text-gray-600">Current file</p>
          <p className="text-[18px] font-medium">{record?.name || "—"}</p>
          <p className="text-[16px] text-gray-500">
            Uploaded:{" "}
            {record?.uploadedAt
              ? new Date(record.uploadedAt).toLocaleString()
              : "—"}
          </p>
        </div>

        <label className="block text-[18px] font-medium mb-1">
          Replace PDF 
        </label>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-10 w-fit h-[70px] rounded-lg bg-[#6F3CDB] text-white text-[22px]"
            disabled={updating}
          >
            Choose PDF
          </button>
          <span className="text-[18px] text-gray-700">
            {editFile ? editFile.name : "No file chosen"}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setEditFile(e.target.files?.[0] || null)}
        />

        {updating && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-[#6F3CDB] rounded"
                style={{ width: `${updateProgress}%` }}
              />
            </div>
            <p className="text-[14px] text-gray-600 mt-1">
              Updating… {updateProgress}%
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[20px] rounded-lg border">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={updating}
            className="px-4 py-2 rounded-lg bg-[#6F3CDB] text-[20px] text-white flex items-center gap-2"
          >
            {updating && <Loader2 className="animate-spin" size={16} />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- Context Menu ----------------------------- */
const ContextMenu = ({ open, x, y, onClose, actions = [] }) => {
  if (!open) return null;
  return (
    <div
      className="fixed z-50"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-56 rounded-xl bg-black/60 backdrop-blur-lg  p-2 space-y-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              a.onClick?.();
              onClose();
            }}
            className="w-full text-left px-3 py-2 rounded-lg font-semibold text-[24px] text-[#FDFDFD]"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ------------------------ Upload (Create) Modal ------------------------ */
const UploadModal = ({
  open,
  onClose,
  files,
  setFiles,
  onUpload,
  submitting,
  uploadProgress,
  onTakePhoto 
}) => {
  const inputRef = useRef(null);
  if (!open) return null;

  const pick = () => inputRef.current?.click();
  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked);
  };

  return (
   <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#2c2c2c98] z-50 backdrop-blur-xs flex flex-col justify-center items-center">
      <X
        size={30}
        color="#FDFDFD"
        onClick={onClose}
        className="absolute right-5 top-5 cursor-pointer"
      />
      <p className="font-bold text-[44px] text-[#FDFDFD]">Upload Documents</p>

      <div className="flex gap-x-10 mt-10">
        {/* Take a Photo (left tile – left as-is for now) */}
       <div
       role="button"
       onClick={onTakePhoto}
       className="w-[295px] h-[295px] rounded-[16px] bg-[#8F8F8F33] border border-[#7D7D7D] flex flex-col gap-y-5 justify-center items-center cursor-pointer active:scale-[0.99] transition"
     >
         
          <img src="/assets/takePhoto.svg" alt="Take a Photo" />
          <p className="font-semibold text-[24px] text-[#FDFDFD]">Take a Photo</p>
        </div>

        {/* Upload from Gallery (right tile triggers file picker) */}
        <div
          role="button"
          onClick={pick}
          className="w-[295px] h-[295px] rounded-[16px] bg-[#8F8F8F33] border border-[#7D7D7D] flex flex-col gap-y-3 justify-center items-center cursor-pointer"
        >
          <img src="/assets/pdf.svg" alt="Upload from Gallery" />
          <p className="font-semibold text-[24px] text-[#FDFDFD]">
            Upload from Gallery
          </p>

          {/* Show selected file name inside the tile (optional) */}
          {files?.length ? (
            <p className="text-xs text-white/90 px-4 text-center break-all">
              {files[0].name}
            </p>
          ) : (
            <p className="text-xs text-white/60">PDF only • Max 25 MB</p>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onPick}
      />

      {/* Action buttons + progress */}
      <div className="flex items-center gap-4 mt-8">
        {/* <button
          onClick={pick}
          disabled={submitting}
          className="px-6 py-3 rounded-[14px] bg-[#6F3CDB] font-semibold text-[16px] text-[#FDFDFD]"
        >
          {files?.length ? "Choose Different PDF" : "Choose PDF"}
        </button> */}

        <button
          onClick={onUpload}
          disabled={submitting || !files?.length}
          className="px-10 w-fit h-[70px] rounded-[14px] bg-white text-[#6F3CDB] text-[24px] font-semibold"
        >
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </div>

      {submitting && (
        <div className="w-72 mt-4">
          <div className="h-2 bg-gray-300 rounded">
            <div
              className="h-2 bg-[#6F3CDB] rounded"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-white mt-1 text-center">
            {uploadProgress}%
          </p>
        </div>
      )}
      </div>
  );
};

/* ============================== Main View ============================== */
const RadiologyReports = () => {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [docs, setDocs] = useState(false);

  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const user = JSON.parse(localStorage.getItem("auth"));
  const token = user?.token;

  const [searchTerm, setSearchTerm] = useState("");
  const [radiologyReports, setRadiologyReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState([]);

  // context menu
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, clipId: null });
  const menuRecord = radiologyReports?.find(
    (r) => (r._id || r.id) === menu.clipId
  );

  // long-press handling
  const longPressMs = 550;
  const timers = useRef({});
  const onPressStart = (e, clip) => {
    e.preventDefault();
    const id = clip._id;
    const rect = e.currentTarget.getBoundingClientRect();
    timers.current[id] = setTimeout(() => {
      setMenu({
        open: true,
        x: rect.left,
        y: rect.bottom + 8,
        clipId: id,
      });
    }, longPressMs);
  };
  const clearTimer = (id) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  };
  const onPressEnd = (e, clip) => {
    // tap = open context menu already? if so, ignore
    if (menu.open && menu.clipId === clip._id) return;
    clearTimer(clip._id);
    // for PDFs we could open the URL if present; here we’ll no-op
  };
  const onContextMenu = (e, clip) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ open: true, x: rect.left, y: rect.bottom + 8, clipId: clip._id });
  };

  // alerts auto-dismiss
  useEffect(() => {
    if (!alert.type) return;
    const t = setTimeout(() => setAlert({ type: "", message: "" }), 5000);
    return () => clearTimeout(t);
  }, [alert]);

  // fetch patient
  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);

  const patientId = patientData?._id || patientData?.patientId;
  const admissionId = selectedPatient?.admissionId;

  // fetch reports
  useEffect(() => {
    if (!patientId || !admissionId) return;
    fetchRecordings(patientId, admissionId);
  }, [patientId, admissionId]);

  const fetchRecordings = async (pid, aid) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/files-recordings/${pid}/${aid}/radiologyReports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRadiologyReports(data.data.radiologyReports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = () => {
    // small helper so older calls continue to work
    if (patientId && admissionId) fetchRecordings(patientId, admissionId);
  };

  /* ------------------------------ Upload PDF ------------------------------ */
  const handleUpload = async () => {
    if (!patientId || !admissionId) {
      setAlert({ type: "error", message: "Missing patientId/admissionId." });
      return;
    }
    if (!files.length) {
      setAlert({ type: "error", message: "Please choose a PDF." });
      return;
    }

    const f = files[0];
    if (f.type !== "application/pdf") {
      setAlert({ type: "error", message: "Only PDF files are allowed." });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setAlert({
        type: "error",
        message: `"${f.name}" exceeds 25MB limit.`,
      });
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      const fd = new FormData();
      fd.append("patientId", String(patientId));
      fd.append("admissionId", String(admissionId));
      // backend expects this field name (array-compatible). We only send one PDF.
      fd.append("radiologyReports", f);

      const res = await axios.post(
        `${VITE_APP_SERVER}/api/v1/files-recordings/upload`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (e) => {
            const pct = Math.round(((e.loaded || 0) * 100) / (e.total || 1));
            setUploadProgress(pct);
          },
        }
      );

      setAlert({
        type: "success",
        message: res?.data?.message || "PDF uploaded successfully.",
      });
      setFiles([]);
      setUploadOpen(false);
      fetchReports();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Upload failed.";
      setAlert({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  /* --------------------------- Edit (Replace PDF) -------------------------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const openEdit = (record) => {
    setEditingRecord(record);
    setEditFile(null);
    setUpdateProgress(0);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editingRecord) return;
    if (!patientId || !admissionId) {
      setAlert({ type: "error", message: "Missing patient/admission ID." });
      return;
    }
    const fileId = editingRecord?._id || editingRecord?.id;
    try {
      setUpdating(true);
      setUpdateProgress(0);

      if (editFile) {
        if (editFile.type !== "application/pdf") {
          setAlert({ type: "error", message: "Only PDF files are allowed." });
          setUpdating(false);
          return;
        }
        if (editFile.size > MAX_FILE_BYTES) {
          setAlert({
            type: "error",
            message: `"${editFile.name}" exceeds 25MB limit.`,
          });
          setUpdating(false);
          return;
        }

        const fd = new FormData();
        fd.append("patientId", String(patientId));
        fd.append("admissionId", String(admissionId));
        fd.append("fileId", String(fileId));
        fd.append("fieldType", "radiologyReports");
        // use the same field name the backend reads for this collection:
        fd.append("radiologyReports", editFile);

        await axios.put(
          `${VITE_APP_SERVER}/api/v1/files-recordings/update`,
          fd,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
            onUploadProgress: (e) => {
              const pct = Math.round(
                ((e.loaded || 0) * 100) / (e.total || 1)
              );
              setUpdateProgress(pct);
            },
          }
        );
      } else {
        // metadata-only update (e.g., rename in the future)
        await axios.put(
          `${VITE_APP_SERVER}/api/v1/files-recordings/update`,
          {
            patientId,
            admissionId,
            fileId,
            fieldType: "radiologyReports",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUpdateProgress(100);
      }

      setAlert({ type: "success", message: "Updated successfully." });
      setEditOpen(false);
      setEditingRecord(null);
      setEditFile(null);
      fetchRecordings(patientId, admissionId);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed.";
      setAlert({ type: "error", message: msg });
    } finally {
      setUpdating(false);
      setUpdateProgress(0);
    }
  };

  /* --------------------------------- Delete -------------------------------- */
  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;

    try {
      setLoading(true);
      const res = await axios.delete(
        `${VITE_APP_SERVER}/api/v1/files-recordings/delete`,
        {
          data: {
            patientId,
            admissionId,
            fileId,
            fieldType: "radiologyReports",
          },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAlert({
        type: "success",
        message: res?.data?.message || "Deleted successfully.",
      });
      fetchReports();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete failed.";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };


  // inside RadiologyReports component:
const [cameraOpen, setCameraOpen] = useState(false);
const [cameraUploading, setCameraUploading] = useState(false);
const [cameraProgress, setCameraProgress] = useState(0);

const uploadFromCamera = async (pdfFile) => {
  if (!patientId || !admissionId) {
    setAlert({ type: "error", message: "Missing patientId/admissionId." });
    return;
  }
  // enforce size limit (25MB)
  if (pdfFile.size > MAX_FILE_BYTES) {
    setAlert({ type: "error", message: `"${pdfFile.name}" exceeds 25MB limit.` });
    return;
  }

  try {
    setCameraUploading(true);
    setCameraProgress(0);
    const fd = new FormData();
    fd.append("patientId", String(patientId));
    fd.append("admissionId", String(admissionId));
    fd.append("radiologyReports", pdfFile); // same field name as existing upload

    const res = await axios.post(
      `${VITE_APP_SERVER}/api/v1/files-recordings/upload`,
      fd,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded || 0) * 100) / (e.total || 1));
          setCameraProgress(pct);
        },
      }
    );

    setAlert({ type: "success", message: res?.data?.message || "Uploaded photo(s) as PDF." });
    setCameraOpen(false);
    setCameraProgress(0);
    fetchReports();
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Upload failed.";
    setAlert({ type: "error", message: msg });
  } finally {
    setCameraUploading(false);
  }
};


  /* --------------------------------- Filter -------------------------------- */
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return radiologyReports;
    return radiologyReports.filter((l) =>
      `${l.name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [radiologyReports, searchTerm]);

  // rename
const [renameOpen, setRenameOpen] = useState(false);
const [renameRecord, setRenameRecord] = useState(null);
const [renaming, setRenaming] = useState(false);

const openRename = (record) => {
  setRenameRecord(record);
  setRenameOpen(true);
};

const submitRename = async (newName) => {
  if (!renameRecord) return;
  const fileId = renameRecord._id || renameRecord.id;
  if (!patientId || !admissionId || !fileId) {
    setAlert({ type: "error", message: "Missing identifiers to rename." });
    return;
  }

  try {
    setRenaming(true);
    await axios.put(
      `${VITE_APP_SERVER}/api/v1/files-recordings/update`,
      {
        patientId,
        admissionId,
        fileId,
        fieldType: "radiologyReports",
        fileName: newName,            // <— key part for rename
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAlert({ type: "success", message: "File renamed successfully." });
    setRenameOpen(false);
    setRenameRecord(null);
    fetchReports(); // refresh list
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Rename failed.";
    setAlert({ type: "error", message: msg });
  } finally {
    setRenaming(false);
  }
};


  return (
    <div
      className={`w-full relative h-full overflow-y-scroll ${radiologyReports && radiologyReports.length > 0 ? "bg-[#F4F6FA]" : "bg-white"} font-inter py-10`}
    >
      {alert.type && (
        <div
          className={`mx-5 mb-4 rounded-lg px-4 py-3 ${
            alert.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="flex justify-between items-center gap-x-5 pr-5">
        <div onClick={() => navigate(-1)} className="w-[5%] cursor-pointer">
          <ChevronLeft size={60} />
        </div>

        <div className="w-[75%] h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4">
          <img src="/assets/patients2.svg" className="w-[24px] h-[30px]" />
          <p className="text-[#6F3CDB] font-semibold text-[20px]">
            {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
            {patientData?.identityDetails?.patientName ?? "Loading..."}
          </p>
        </div>

        <div className="w-[20%] h-[70px] rounded-[10px] bg-[#FDFDFD] border-[2px] border-[#D8D8D8] flex justify-center items-center gap-x-4">
          <p className="font-semibold text-[22px] text-[#282D30]">Filters</p>
          <SlidersHorizontal color="#282D30" size={20} />
        </div>
      </div>

      {filteredReports && filteredReports.length > 0 ? (
        <div className="w-full portrait:h-[90%] landscape:h-[85%] overflow-y-scroll px-5 py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[24px] text-black">Radiology Reports</p>
              <p className="font-semibold text-[18px] text-[#6F3CDB]">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
            
               <button
                onClick={() => setUploadOpen(true)}             
                className="w-[240px] h-[70px] bg-[#6F3CDB] rounded-[10px] flex justify-center items-center gap-x-3 text-[#FDFDFD] font-semibold text-[20px] disabled:opacity-60"
              >            
                Upload PDF
              </button>
              
            </div>
          </div>

          <div className="w-full flex flex-row flex-wrap gap-5 mt-10">
            {filteredReports.map((report, index) => (
              <div
                key={report._id || report.id || index}
                onMouseDown={(e) => onPressStart(e, report)}
                onMouseUp={(e) => onPressEnd(e, report)}
                onMouseLeave={() => clearTimer(report._id)}
                onTouchStart={(e) => onPressStart(e, report)}
                onTouchEnd={(e) => onPressEnd(e, report)}
                onContextMenu={(e) => onContextMenu(e, report)}
                className="w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD] flex flex-col justify-center items-center"
              >
                <div className="relative">
                  <div className="w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center">
                    <p className="font-medium text-[18px] text-white">{index + 1}</p>
                  </div>
                  <img src="/assets/pdf.svg" className="w-[111px] h-[100px]" />
                </div>

                <div className="flex flex-col items-center mt-10 px-3 text-center">
                  <p className="text-[#282D30] text-[18px] font-semibold line-clamp-2">
                    {report.name}
                  </p>
                  <p className="text-[#A1A3B2] text-[14px] font-medium mt-1">
                    {report.uploadedAt
                      ? new Date(report.uploadedAt).toLocaleString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col justify-center items-center">
          <img src="/assets/empty.svg" className="portrait:w-[75%] mt-14" />
          <button
            onClick={() => setUploadOpen(true)}
            className="w-[367px] h-[70px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[22px] text-[#FDFDFD] mt-14"
          >
            Upload PDF
          </button>
        </div>
      )}

      {/* Upload/Create */}
      <UploadModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setFiles([]);
          setUploadProgress(0);
        }}
        files={files}
        setFiles={setFiles}
        onUpload={handleUpload}
        submitting={submitting}
        uploadProgress={uploadProgress} onTakePhoto={() => setCameraOpen(true)}
      />

      {/* Context menu */}
      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ open: false, x: 0, y: 0, clipId: null })}
        actions={[
          {
            label: "Edit (Replace PDF)",
            onClick: () => openEdit(menuRecord),
          },
          {
            label: "Delete",
            onClick: () => handleDelete(menuRecord?._id || menuRecord?.id),
          },
          { label: "Rename File", onClick: () => openRename(menuRecord)  },
          { label: "Move File into Folder", onClick: () => console.log("create folder") },
        ]}
      />

      {/* Edit/Replace PDF */}
      <EditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        record={editingRecord}
        editFile={editFile}
        setEditFile={setEditFile}
        onSubmit={submitEdit}
        updating={updating}
        updateProgress={updateProgress}
      />

      {/* Camera capture → PDF → Upload */}
<CameraCaptureModal
  open={cameraOpen}
  onClose={() => setCameraOpen(false)}
  onUpload={uploadFromCamera}
  uploading={cameraUploading}
  progress={cameraProgress}
/>

<RenameModal
  open={renameOpen}
  onClose={() => setRenameOpen(false)}
  record={renameRecord}
  renaming={renaming}
  onSubmit={submitRename}
/>


    </div>
  );
};

export default RadiologyReports;
