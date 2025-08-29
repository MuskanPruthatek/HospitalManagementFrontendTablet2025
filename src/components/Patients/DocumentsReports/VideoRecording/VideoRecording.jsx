import React, { useEffect, useRef, useState } from "react";
import { usePatient } from "../../../../context/PatientContext";
import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import {
  ChevronLeft,
  Mic,
  SlidersHorizontal,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  FastForward,
  Pencil,
  Trash2,
  RefreshCw,
  Camera
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------- Utils ---------- */
const formatTime = (s) => {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
};

const fmtDMY = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtClock = (sec) => {
  const n = Number(sec);
  if (!Number.isFinite(n) || n < 0) return "--:--";
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};


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

/* ======================= VIDEO PLAYER MODAL ======================= */
const PlayerModal = ({ open, onClose, clip, hasPrev, hasNext, onPrev, onNext }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    if (!open || !clip) return;
    const v = videoRef.current;
    if (!v) return;

    const url = clip.secure_url || clip.url || clip.path;
    if (url) {
      v.src = url;
      v.crossOrigin = "anonymous";
      v.playsInline = true;
      v.load();
    }

    setT(0);
    setDur(0);

    const onLoaded = () => {
      const d = Number(v.duration);
      if (Number.isFinite(d) && d > 0) setDur(d);
    };
    const onDuration = () => {
      const d = Number(v.duration);
      if (Number.isFinite(d) && d > 0) setDur(d);
    };
    const onTime = () => setT(Number(v.currentTime) || 0);
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("durationchange", onDuration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("durationchange", onDuration);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [open, clip]);

  if (!open || !clip) return null;

  const handlePrev = () => hasPrev && onPrev?.();
  const handleNext = () => hasNext && onNext?.();

  const toggle = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      try { await v.play(); } catch {}
    } else {
      v.pause();
    }
  };

  const seek = (sec) => {
    const v = videoRef.current;
    if (!v) return;
    const total = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : dur || 0;
    v.currentTime = Math.max(0, Math.min(total, v.currentTime + sec));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#8F8F8F33] border border-[#7D7D7D] p-6">
        <button
          onClick={() => { onClose(); try { videoRef.current?.pause(); } catch {} }}
          className="absolute right-3 top-3 rounded-full p-2 hover:bg-white/10 text-white"
        >
          <X size={18} />
        </button>

        <div className="text-white text-center font-semibold text-xl mb-4">
          {clip?.name?.replace(/\.\w+$/, "")}{" "}
          <span className="font-normal">{fmtDMY(clip?.uploadedAt)}</span>
        </div>

        {/* Video area */}
        <div className="rounded-xl bg-black/50 p-2">
          <video
            ref={videoRef}
            className="w-full rounded-lg"
            controls={false}
            playsInline
            preload="metadata"
          />
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={100}
              value={Number.isFinite(dur) && dur > 0 ? (t / dur) * 100 : 0}
              onChange={(e) => {
                const pct = Number(e.target.value);
                const v = videoRef.current;
                if (!v) return;
                const total = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : (Number.isFinite(dur) && dur > 0 ? dur : 0);
                if (total > 0) v.currentTime = (total * pct) / 100;
              }}
              className="mt-3 w-full accent-[#6F3CDB]"
            />
            <div className="mt-2 flex justify-between text-white/80 text-sm">
              <span>{fmtClock(t)}</span> <span>{fmtClock(dur)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-6 text-white">
            <button onClick={handlePrev} disabled={!hasPrev} className={`${hasPrev ? "" : "opacity-50"}`} title="Previous">
              <SkipBack fill="white" />
            </button>
            <button onClick={() => seek(-10)}><FastForward className="rotate-180" fill="white" color="white" /></button>
            <button
              onClick={toggle}
              className="w-14 h-14 rounded-full bg-white hover:bg-white/90 text-[#6F3CDB] flex items-center justify-center"
            >
              {playing ? <Pause size={26} /> : <Play size={26} />}
            </button>
            <button onClick={() => seek(10)}><FastForward fill="white" color="white" /></button>
            <button onClick={handleNext} disabled={!hasNext} className={`${hasNext ? "" : "opacity-50"}`} title="Next">
              <SkipForward fill="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ======================= CONTEXT MENU ======================= */
const ContextMenu = ({ open, x, y, onClose, actions = [] }) => {
  if (!open) return null;
  return (
    <div className="fixed z-50" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      <div className="w-56 rounded-xl bg-black/60 backdrop-blur-lg p-2 space-y-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => { a.onClick?.(); onClose(); }}
            className="w-full text-left px-3 py-2 rounded-lg font-semibold text-[24px] text-[#FDFDFD]"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ======================= VIDEO RECORDER MODAL ======================= */
const RecorderModal = ({ open, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [facing, setFacing] = useState("user"); // "user" (front) | "environment" (back)

  const previewRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const tickRef = useRef(null);

  const reset = async () => {
    setIsRecording(false);
    setElapsed(0);
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    const v = previewRef.current;
    if (v) {
      v.srcObject = null;
      try { await v.pause(); } catch {}
    }
  };

  const pickMime = () => {
    // Prefer MP4 on iPad Safari; fallback to WebM for Chrome/Android tablets
    if (window.MediaRecorder?.isTypeSupported?.("video/mp4")) return "video/mp4";
    if (window.MediaRecorder?.isTypeSupported?.("video/webm;codecs=vp9")) return "video/webm;codecs=vp9";
    if (window.MediaRecorder?.isTypeSupported?.("video/webm;codecs=vp8")) return "video/webm;codecs=vp8";
    if (window.MediaRecorder?.isTypeSupported?.("video/webm")) return "video/webm";
    return ""; // let browser decide
  };

  const startStream = async (desiredFacing) => {
    // Stop previous
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    const constraints = {
      audio: true,
      video: {
        facingMode: desiredFacing, // "user" | "environment"
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      const v = previewRef.current;
      if (v) {
        v.srcObject = stream;
        v.muted = true;       // avoid feedback
        v.playsInline = true; // iOS inline
        await v.play().catch(() => {});
      }
      setError("");
    } catch (e) {
      setError("Camera or microphone unavailable. Please allow permissions.");
    }
  };

  const flipCamera = async () => {
    if (isRecording) return; // safer to prevent flip while recording
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    await startStream(next);
  };

  const startRecording = async () => {
    setError("");
    chunksRef.current = [];
    // ensure we have a stream
    if (!mediaStreamRef.current) await startStream(facing);
    if (!mediaStreamRef.current) { setError("Cannot access camera/mic."); return; }

    // build recorder
    const mime = pickMime();
    let mr;
    try {
      mr = new MediaRecorder(mediaStreamRef.current, mime ? { mimeType: mime } : undefined);
    } catch {
      setError("Recording not supported on this browser.");
      return;
    }
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.start(250);

    setIsRecording(true);
    const startedAt = Date.now();
    setElapsed(0);
    tickRef.current = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 250);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current.mimeType || "video/mp4";
      const blob = new Blob(chunksRef.current, { type: mime });

      const ext =
        mime.includes("mp4") ? "mp4" :
        mime.includes("webm") ? "webm" : "mp4";

      const file = new File([blob], `video-${Date.now()}.${ext}`, { type: mime });
      const url = URL.createObjectURL(blob);

      onSave({ file, url, duration: Math.round(elapsed) });
      reset();
      onClose();
    };
    try { mediaRecorderRef.current.stop(); } catch {}
    setIsRecording(false);
  };

  useEffect(() => {
    if (open) startStream(facing);
    return () => { reset(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#2c2c2c98] z-50 backdrop-blur-xs flex items-center justify-center px-3">
      <div className="relative w-[90%] max-w-3xl rounded-2xl bg-[#8F8F8F33] border border-[#7D7D7D] text-white p-4">
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          onClick={() => { reset(); onClose(); }}
        >
          <X size={20} />
        </button>

        {/* Timer + controls row */}
        <div className="flex items-center justify-between mt-12 mb-3">
          <div className="text-[28px] font-bold">{formatTime(elapsed)}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={flipCamera}
              disabled={isRecording}
              className={`px-3 py-2 rounded-lg bg-white/10 ${isRecording ? "opacity-50" : "hover:bg-white/20"}`}
              title="Flip Camera"
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={18} /> <span>Flip</span>
              </div>
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl overflow-hidden bg-black">
          <video ref={previewRef} className="w-full h-[52vh] object-contain" playsInline muted />
        </div>

        {error && <p className="text-red-300 text-sm mt-3">{error}</p>}

        {/* Record controls */}
        <div className="mt-4 flex items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center justify-center w-20 h-20 rounded-full border-[6px] border-white bg-gray-500"
            >
              <div className="w-12 h-12 rounded-sm bg-red-600" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-20 h-20 rounded-full border-[6px] border-white bg-gray-500"
            >
              <div className="w-10 h-10 bg-red-600 rounded" />
            </button>
          )}
        </div>

        <div className="mt-2 text-center text-white/60 text-sm">
          {isRecording ? "Recording… tap the square to stop." : "Tap the red square to start video recording."}
        </div>
      </div>
    </div>
  );
};

/* ======================= EDIT MODAL ======================= */
const EditModal = ({
  open,
  onClose,
  record,
  label,
  setLabel,
  editFile,
  setEditFile,
  onSubmit,
  updating,
  updateProgress
}) => {
  const fileInputRef = useRef(null);
  if (!open || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FDFDFD] border border-[#D8D8D8] p-6">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 hover:bg-black/5">
          <X size={18} />
        </button>

        <h3 className="text-xl font-semibold mb-4">Edit Video</h3>

        <label className="block text-sm font-medium mb-1">Label / Name</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-[#6F3CDB]"
          placeholder="Enter label"
        />

        <label className="block text-sm font-medium mb-1">Replace File (optional)</label>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-[#6F3CDB] text-white text-sm"
            disabled={updating}
          >
            Choose file
          </button>
          <span className="text-sm text-gray-700">{editFile ? editFile.name : "No file chosen"}</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => setEditFile(e.target.files?.[0] || null)}
        />

        {updating && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-[#6F3CDB] rounded" style={{ width: `${updateProgress}%` }} />
            </div>
            <p className="text-xs text-gray-600 mt-1">Updating… {updateProgress}%</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button
            onClick={onSubmit}
            disabled={updating}
            className="px-4 py-2 rounded-lg bg-[#6F3CDB] text-white flex items-center gap-2"
          >
            {updating && <Loader2 className="animate-spin" size={16} />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ======================= MAIN PAGE ======================= */
const VideoRecording = () => {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate();

  const [videoRecordings, setVideoRecordings] = useState([]);
  const [loading, setLoading] = useState(false);

  const pid = selectedPatient?.patientId;
  const aid = selectedPatient?.admissionId;

  const [patientData, setPatientData] = useState(null);
  const [recordOpen, setRecordOpen] = useState(false);

  const [playerOpen, setPlayerOpen] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, clipId: null });

  const [editOpen, setEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [label, setLabel] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const user = JSON.parse(localStorage.getItem("auth"));
  const token = user?.token;

  const todayStr = new Date().toLocaleDateString();
  const menuRecord = videoRecordings?.find(r => (r._id || r.id) === menu.clipId);

  useEffect(() => {
    if (!pid || !aid) return;
    fetchRecordings(pid, aid);
  }, [pid, aid]);

  const fetchRecordings = async (patientId, admissionId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/files-recordings/${patientId}/${admissionId}/videoRecordings`
      );
      setVideoRecordings(data.data.videoRecordings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);

  const handleSaveClip = async ({ file, url, duration }) => {
    if (!pid || !aid) return;
    const fd = new FormData();
    fd.append("patientId", pid || "");
    fd.append("admissionId", aid || "");
    fd.append("videoLabel", "Recording");
    fd.append("videoRecordings", file, file.name);

    try {
      setUploading(true);
      setUploadProgress(0);
      await axios.post(`${VITE_APP_SERVER}/api/v1/files-recordings/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded || 0) * 100) / (e.total || 1));
          setUploadProgress(pct);
        }
      });
      await fetchRecordings(pid, aid);
      setAlert({ type: "success", message: "Video uploaded successfully." });
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: err?.response?.data?.message || "Upload failed." });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

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
    if (menu.open && menu.clipId === clip._id) return;
    clearTimer(clip._id);
    setActiveClip(clip);
    const idx = videoRecordings.findIndex(r => (r._id || r.id) === clip._id);
    setCurrentIndex(idx >= 0 ? idx : null);
    setPlayerOpen(true);
  };

  const onContextMenu = (e, clip) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ open: true, x: rect.left, y: rect.bottom + 8, clipId: clip._id });
  };

  const Banner = () => (
    alert?.message ? (
      <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow ${alert.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
        {alert.message}
        <button className="ml-3 underline" onClick={() => setAlert({ type: "", message: "" })}>dismiss</button>
      </div>
    ) : null
  );

  const openEdit = (record) => {
    setEditingRecord(record);
    setLabel(record?.videoLabel || record?.label || record?.name || "");
    setEditFile(null);
    setUpdateProgress(0);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editingRecord) return;
    if (!pid || !aid) {
      setAlert({ type: "error", message: "Missing patient or admission ID." });
      return;
    }
    const fileId = editingRecord?._id || editingRecord?.id;
    try {
      setUpdating(true);
      setUpdateProgress(0);

      if (editFile) {
        const fd = new FormData();
        fd.append("patientId", String(pid));
        fd.append("admissionId", String(aid));
        fd.append("fileId", String(fileId));
        fd.append("fieldType", "videoRecordings");
        fd.append("videoRecordings", editFile);
        if (label) fd.append("videoLabel", label);

        await axios.put(`${VITE_APP_SERVER}/api/v1/files-recordings/update`, fd, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (e) => {
            const pct = Math.round(((e.loaded || 0) * 100) / (e.total || 1));
            setUpdateProgress(pct);
          }
        });
      } else {
        await axios.put(`${VITE_APP_SERVER}/api/v1/files-recordings/update`, {
          patientId: pid,
          admissionId: aid,
          fileId,
          fieldType: "videoRecordings",
          videoLabel: label,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUpdateProgress(100);
      }

      setAlert({ type: "success", message: "Updated successfully." });
      setEditOpen(false);
      setEditingRecord(null);
      setLabel("");
      setEditFile(null);
      await fetchRecordings(pid, aid);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Update failed.";
      setAlert({ type: "error", message: msg });
    } finally {
      setUpdating(false);
      setUpdateProgress(0);
    }
  };

  const handleDelete = async (record) => {
    if (!record) return;
    const fileId = record?._id || record?.id;
    if (!window.confirm("Delete this video? This cannot be undone.")) return;

    try {
      setDeletingId(fileId);
      await axios.delete(`${VITE_APP_SERVER}/api/v1/files-recordings/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { patientId: pid, admissionId: aid, fileId, fieldType: "videoRecordings" }
      });
      setAlert({ type: "success", message: "Deleted successfully." });
      if (editingRecord && (editingRecord._id === fileId || editingRecord.id === fileId)) {
        setEditOpen(false);
        setEditingRecord(null);
      }
      await fetchRecordings(pid, aid);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Delete failed.";
      setAlert({ type: "error", message: msg });
    } finally {
      setDeletingId(null);
    }
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      if (prev == null) return prev;
      const ni = prev - 1;
      if (ni >= 0) {
        setActiveClip(videoRecordings[ni]);
        return ni;
      }
      return prev;
    });
  };

  const goNext = () => {
    setCurrentIndex((prev) => {
      if (prev == null) return prev;
      const ni = prev + 1;
      if (ni < videoRecordings.length) {
        setActiveClip(videoRecordings[ni]);
        return ni;
      }
      return prev;
    });
  };

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
    if (!pid || !aid || !fileId) {
      setAlert({ type: "error", message: "Missing identifiers to rename." });
      return;
    }
  
    try {
      setRenaming(true);
      await axios.put(
        `${VITE_APP_SERVER}/api/v1/files-recordings/update`,
        {
          patientId: pid, 
          admissionId: aid,
          fileId,
          fieldType: "videoRecordings",
          fileName: newName,            // <— key part for rename
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlert({ type: "success", message: "File renamed successfully." });
      setRenameOpen(false);
      setRenameRecord(null);
      fetchRecordings(pid, aid)
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
      className={`w-full relative h-full overflow-y-scroll ${videoRecordings && videoRecordings.length > 0 ? "bg-[#F4F6FA]" : "bg-white"} font-inter py-10`}
      onClick={() => menu.open && setMenu({ open: false, x: 0, y: 0, clipId: null })}
    >
      <Banner />

      {/* Top Bar */}
      <div className="flex justify-between items-center gap-x-5 pr-5">
        <div onClick={() => navigate(-1)} className="w-[5%]">
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

      {/* Content */}
      {videoRecordings && videoRecordings.length > 0 ? (
        <div className="w-full portrait:h-[90%] landscape:h-[85%] overflow-y-scroll px-5 py-10">
          <div className="w-full justify-between flex">
            <div>
              <p className="font-semibold text-[24px] text-black">Patient's Recorded videos</p>
              <p className="font-semibold text-[18px] text-[#6F3CDB]">{todayStr}</p>
            </div>

            <div className="flex items-center gap-3">
              {uploading && (
                <div className="w-48">
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-[#6F3CDB] rounded" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Uploading… {uploadProgress}%</p>
                </div>
              )}
              <button
                onClick={() => setRecordOpen(true)}
                disabled={uploading}
                className="w-[240px] h-[70px] bg-[#6F3CDB] rounded-[10px] flex justify-center items-center gap-x-3 text-[#FDFDFD] font-semibold text-[20px] disabled:opacity-60"
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
                {uploading ? "Uploading…" : "Record Video"}
              </button>

              <button className="w-[240px] h-[70px] bg-[#36D7A0] rounded-[10px] flex justify-center items-center gap-x-3 text-[#FDFDFD] font-semibold text-[20px] disabled:opacity-60">Create folder</button>
            </div>
          </div>

          {/* Video cards */}
          <div className="w-full flex flex-row flex-wrap gap-5 mt-10">
            {fetching && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="animate-spin" /> Loading videos…
              </div>
            )}
            {videoRecordings?.map((a, index) => (
              <div
                key={a._id}
                className="relative w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD] flex flex-col items-center justify-center"
                onMouseDown={(e) => onPressStart(e, a)}
                onMouseUp={(e) => onPressEnd(e, a)}
                onMouseLeave={() => clearTimer(a._id)}
                onTouchStart={(e) => onPressStart(e, a)}
                onTouchEnd={(e) => onPressEnd(e, a)}
                onContextMenu={(e) => onContextMenu(e, a)}
              >
                {deletingId === a._id && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-[10px] flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Loader2 className="animate-spin" /> Deleting…
                    </div>
                  </div>
                )}

                <div className="relative mt-4">
                  <div className="w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center">
                    <p className="font-medium text-[16px] text-white">{index + 1}</p>
                  </div>
                  {/* Thumbnail placeholder (swap with your own asset or generate poster frames later) */}
                  <img src="/assets/videoFile.svg" onError={(e) => (e.currentTarget.src = "/assets/videoFile.svg")} className="w-[111px] h-[100px]" />
                </div>

                <div className="flex flex-col items-center mt-10 px-3">
                  <p className="text-[#282D30] text-[18px] font-semibold truncate w-56 text-center">{a.name || a.videoLabel || `Video ${index + 1}`}</p>
                  <p className="text-[#A1A3B2] text-[14px] font-medium">
                    {new Date(a.uploadedAt).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })}
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
            onClick={() => setRecordOpen(true)}
            className="w-[367px] h-[70px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[22px] text-[#FDFDFD] mt-14"
          >
            Record Video
          </button>
        </div>
      )}

      {/* Modals */}
      <RecorderModal open={recordOpen} onClose={() => setRecordOpen(false)} onSave={handleSaveClip} />

      <PlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        clip={activeClip}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex != null && currentIndex < videoRecordings.length - 1}
        onPrev={goPrev}
        onNext={goNext}
      />

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ open: false, x: 0, y: 0, clipId: null })}
        actions={[
          { label: "Edit File", onClick: () => openEdit(menuRecord) },
          { label: "Delete File", onClick: () => handleDelete(menuRecord) },
          { label: "Rename File", onClick: () => openRename(menuRecord)  },
          { label: "Move File into Folder", onClick: () => console.log("create folder") },
        ]}
      />

      <EditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        record={editingRecord}
        label={label}
        setLabel={setLabel}
        editFile={editFile}
        setEditFile={setEditFile}
        onSubmit={submitEdit}
        updating={updating}
        updateProgress={updateProgress}
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

export default VideoRecording;
