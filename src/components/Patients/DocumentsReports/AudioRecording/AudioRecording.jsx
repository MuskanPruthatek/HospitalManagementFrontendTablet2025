import React, { useEffect, useRef, useState } from "react";
import { usePatient } from "../../../../context/PatientContext";
import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { ChevronLeft, Mic, SlidersHorizontal, X, Square, Play, SkipBack, SkipForward, Pause, Pencil, Trash2, Loader2, ChevronRight, FastForward } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

/* ---------- Utils ---------- */
const formatTime = (s) => {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
};

const fmtDMY = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }); // 26-07-2025

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

const PlayerModal = ({ open, onClose, clip, hasPrev, hasNext, onPrev, onNext }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);

  const autoPlayOnChangeRef = useRef(false);

  // analyser refs ...
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const audCtxRef = useRef(null);
  const srcRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);


useEffect(() => {
  // Create graph ONCE
  const a = audioRef.current;
  if (!a) return;

  a.crossOrigin = "anonymous";

  if (!audCtxRef.current) {
    audCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 128;
  }
  if (!srcRef.current) {
    srcRef.current = audCtxRef.current.createMediaElementSource(a);
    srcRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audCtxRef.current.destination);
  }
}, []);

useEffect(() => {
  if (!open || !clip) return;
  const a = audioRef.current;

  const url = clip.secure_url || clip.url || clip.path;
  if (url) {
    a.src = url;   // crossOrigin was already set above
    a.load();
  }

  const cloudDur = Number(clip?.duration);
  setDur(Number.isFinite(cloudDur) && cloudDur > 0 ? cloudDur : 0);
  setT(0);

  const setFiniteDuration = () => {
    const d = Number(a.duration);
    if (Number.isFinite(d) && d > 0) setDur(d);
  };

  const onLoaded = () => setFiniteDuration();
  const onDuration = () => setFiniteDuration();
  const onTime = () => setT(Number(a.currentTime) || 0);
  const onEnded = () => setPlaying(false);
  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);

  a.addEventListener("loadedmetadata", onLoaded);
  a.addEventListener("durationchange", onDuration);
  a.addEventListener("timeupdate", onTime);
  a.addEventListener("ended", onEnded);
  a.addEventListener("play", onPlay);
  a.addEventListener("pause", onPause);

  return () => {
    a.removeEventListener("loadedmetadata", onLoaded);
    a.removeEventListener("durationchange", onDuration);
    a.removeEventListener("timeupdate", onTime);
    a.removeEventListener("ended", onEnded);
    a.removeEventListener("play", onPlay);
    a.removeEventListener("pause", onPause);
  };
}, [open, clip]);

// 3) Draw loop + power saving
useEffect(() => {
  if (!open) return;

  const draw = () => {
    const cvs = canvasRef.current;
    const an = analyserRef.current;
    if (!cvs || !an) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = (ctxRef.current ||= cvs.getContext("2d"));
    const W = cvs.width, H = cvs.height;

    ctx.clearRect(0, 0, W, H);
    // base line
    ctx.fillStyle = "#B9C1C9";
    ctx.fillRect(0, H / 2 - 2, W, 4);

    if (playing) {
      const len = an.fftSize;
      const data = new Uint8Array(len);
      an.getByteTimeDomainData(data);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#6F3CDB";
      ctx.beginPath();
      const dx = W / len;
      let x = 0;
      for (let i = 0; i < len; i++) {
        const v = data[i] / 128; // 0..2
        const y = (v * H) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += dx;
      }
      ctx.lineTo(W, H / 2);
      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(draw);
  };

  rafRef.current = requestAnimationFrame(draw);
  return () => rafRef.current && cancelAnimationFrame(rafRef.current);
}, [open, playing]);

  if (!open || !clip) return null

  const handlePrev = () => {
    if (!hasPrev) return;
    autoPlayOnChangeRef.current = true;
    onPrev?.();
  };

  const handleNext = () => {
    if (!hasNext) return;
    autoPlayOnChangeRef.current = true;
    onNext?.();
  };

  const toggle = async () => {
  const a = audioRef.current;
  if (!a) return;
  if (a.paused) {
    try {
      await audCtxRef.current?.resume(); // ensure analyser actually runs
    } catch {}
    try {
      await a.play();
    } catch {
      // autoplay blocked or other issue
    }
  } else {
    a.pause();
  }
};

  const seek = (sec) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((dur || a.duration || 0), a.currentTime + sec));
  };

  // const onScrub = (e) => {
  //   const pct = Number(e.target.value);
  //   const a = audioRef.current;
  //   if (!a) return;
  //   a.currentTime = ((dur || a?.duration || 0) * pct) / 100;
  // };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#8F8F8F33] border border-[#7D7D7D] p-6">
        <button onClick={() => {
          onClose(); try { audioRef.current?.pause(); } catch { }
        }} className="absolute right-3 top-3 rounded-full p-2 hover:bg-white/10 text-white">
          <X size={18} />
        </button>

        {/* Title like mock: `Mr. xyz audio 26-07-2025` */}
        <div className="text-white text-center font-semibold text-xl mb-4">
          {clip?.name?.replace(/\.\w+$/, "")}{" "}
          <span className="font-normal">{fmtDMY(clip?.uploadedAt)}</span>
        </div>

        {/* Wave area */}
        <div className="rounded-xl bg-white/10 p-4">
          <canvas ref={canvasRef} className="w-full h-24" width={560} height={96} />


          {/* range input value */}

          <div className="mt-3">

            <input
              type="range"
              min={0}
              max={100}
              value={Number.isFinite(dur) && dur > 0 ? (t / dur) * 100 : 0}
              onChange={(e) => {
                const pct = Number(e.target.value);
                const a = audioRef.current;
                if (!a) return;
                // use the *actual* element duration if it's now finite; otherwise use our state dur
                const total = Number.isFinite(a.duration) && a.duration > 0
                  ? a.duration
                  : (Number.isFinite(dur) && dur > 0 ? dur : 0);

                if (total > 0) {
                  a.currentTime = (total * pct) / 100;
                }
              }}
              className="mt-3 w-full accent-[#6F3CDB]"
            />
            <div className="mt-2 flex justify-between text-white/80 text-sm">
              <span>{fmtClock(t)}</span> <span>{fmtClock(dur)}</span>
            </div>

          </div>


          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`${hasPrev ? "text-white" : "text-white opacity-50 "} `}
              title="Previous recording"
            >
              <SkipBack fill="white"/>
            </button>
            <button
              onClick={() => seek(-10)}
              className=""
            >
                <FastForward fill="white" color="white" className="rotate-180  "/> 
            </button>

            {/* Play/Pause in circle like mock */}
            <button
              onClick={toggle}
              className="w-14 h-14 rounded-full bg-white hover:bg-white/90 text-[#6F3CDB] flex items-center justify-center"
            >
              {playing ? <Pause size={26} /> : <Play size={26} />}
            </button>

            <button
              onClick={() => seek(10)}
              className=""
            >
              <FastForward fill="white" color="white"/> 
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={` ${hasNext ? "text-white" : "text-white opacity-50 "} `}
              title="Next recording"
            >
               <SkipForward fill="white"/>
            </button>
          </div>
        </div>

        <audio ref={audioRef} src={clip?.path} crossOrigin="anonymous" preload="metadata" className="hidden" />

      </div>
    </div>
  );
};

const ContextMenu = ({ open, x, y, onClose, actions = [] }) => {
  if (!open) return null;
  return (
    <div
      className="fixed z-50"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-56 rounded-xl bg-[#8F8F8F33]  border border-[#7D7D7D] p-2 space-y-1">
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

/* ---------- Popup Recorder ---------- */
const RecorderModal = ({ open, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const rafRef = useRef(null);

  // WebAudio nodes for waveform
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const canvasRef = useRef(null);
  const startTimeRef = useRef(null);

  const tickTimerRef = useRef(null);

  const reset = () => {
    setIsRecording(false);
    setElapsed(0);
    startTimeRef.current = null;
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const drawWave = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // bg
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // bar
    ctx.fillStyle = "#E6E6E6";
    ctx.fillRect(0, HEIGHT / 2 - 3, WIDTH, 6);

    // waveform
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6F3CDB";
    ctx.beginPath();

    const sliceWidth = WIDTH / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0; // 0..2
      const y = (v * HEIGHT) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(WIDTH, HEIGHT / 2);
    ctx.stroke();

    rafRef.current = requestAnimationFrame(drawWave);
  };

  const startRecording = async () => {
    setError("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // WebAudio graph for waveform
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      drawWave();

      const mime = MediaRecorder.isTypeSupported("audio/mpeg")
        ? "audio/mpeg"
        : MediaRecorder.isTypeSupported("audio/wav")
          ? "audio/wav"
          : "audio/webm;codecs=opus";

      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start(250); // collect in chunks

      setIsRecording(true);
      startTimeRef.current = Date.now();
      setElapsed(0);
      tickTimerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 250);
    } catch (e) {
      setError("Microphone permission denied or unavailable.");
      reset();
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current.mimeType || "audio/webm;codecs=opus";
      const blob = new Blob(audioChunksRef.current, { type: mime });

      // pick extension that matches the mime
      const ext =
        mime.includes("mpeg") ? "mp3" :
          mime.includes("wav") ? "wav" :
            mime.includes("mp4") ? "m4a" :
              "webm";

      const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: mime });
      const url = URL.createObjectURL(blob);

      onSave({ file, url, duration: Math.round(elapsed) });
      reset();
      onClose();
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // stop & cleanup if modal closes or unmounts
  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#2c2c2c98] z-50 backdrop-blur-xs flex items-center justify-center px-3">
      <div className="relative w-[50%] rounded-2xl bg-[#8F8F8F33] border border-[#7D7D7D] text-white p-6 ">
        <button
          className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          onClick={() => {
            reset();
            onClose();
          }}
        >
          <X size={20} />
        </button>

        {/* Timer */}
        <div className="text-center text-[54px] text-white font-bold mb-4">{formatTime(elapsed)}</div>

        {/* Waveform box */}
        <div className="rounded-xl  p-4 mb-6">
          <canvas
            ref={canvasRef}
            className="w-full h-28"
            width={560}
            height={112}
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center justify-center w-20 h-20 rounded-full border-[6px] border-white bg-gray-500"
            >
              <div className="w-12 h-12 rounded-full bg-red-600"></div>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-20 h-20 rounded-full border-[6px] border-white bg-gray-500"
            >
              <div className="w-10 h-10 bg-red-600 rounded-sm"></div>
            </button>
          )}
        </div>


        {/* Hint */}
        <div className="mt-4 text-center text-white/60 text-sm">
          {isRecording ? "Recording… speak into your mic." : "Click Start to begin a new recording."}
        </div>
      </div>
    </div>
  );
};

// Edit modal
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

        <h3 className="text-xl font-semibold mb-4">Edit Recording</h3>

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
          accept="audio/*"
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

/* ---------- Main Page ---------- */
const AudioRecording = () => {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate()
  console.log(selectedPatient?.admissionId)

  const [audioRecordings, setAudioRecordings] = useState([]);
  const [loading, setLoading] = useState(false)

  const pid = selectedPatient?.patientId;
  const aid = selectedPatient?.admissionId;

  const [patientData, setPatientData] = useState(null);
  const [audioFiles, setAudioFiles] = useState(true);
  const [recordOpen, setRecordOpen] = useState(false);
  const [clips, setClips] = useState([]); // locally captured clips
  const [uploadingById, setUploadingById] = useState({}); // { [clipId]: { pct, status, err? } }
  const [currentIndex, setCurrentIndex] = useState(null);


  const [playerOpen, setPlayerOpen] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
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
  const menuRecord = audioRecordings?.find(r => (r._id || r.id) === menu.clipId);

  useEffect(() => {
    if (!pid || !aid) return;
    fetchRecordings(pid, aid);
  }, [pid, aid]);

  const fetchRecordings = async (patientId, admissionId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/files-recordings/${patientId}/${admissionId}/audioRecordings`
      );
      setAudioRecordings(data.data.audioRecordings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const longPressMs = 550;
  const timers = useRef({});

  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);

  const handleSaveClip = async ({ file, url, duration }) => {
    const pid = selectedPatient?.patientId;
    const aid = selectedPatient?.admissionId;

    const fd = new FormData();
    fd.append("patientId", pid || "");
    fd.append("admissionId", aid || "");
    fd.append("audioLabel", "Recording");
    fd.append("audioRecordings", file, file.name); // matches multer.fields

    try {
      setLoading(true);
      await axios.post(`${VITE_APP_SERVER}/api/v1/files-recordings/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      await fetchRecordings(pid, aid);               // ← refresh from backend
    } catch (err) {
      console.error(err);
      // show a toast / error UI
    } finally {
      setLoading(false);
    }
  };

  const onPressStart = (e, clip) => {
    e.preventDefault();
    const id = clip._id;
    const rect = e.currentTarget.getBoundingClientRect();
    timers.current[id] = setTimeout(() => {
      setMenu({
        open: true,
        x: rect.left,
        y: rect.bottom + 8, // show below card
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
    // if menu already opened, do nothing
    if (menu.open && menu.clipId === clip._id) return;
    clearTimer(clip._id);
    // treat as click: open player
    setActiveClip(clip);
    const idx = audioRecordings.findIndex(r => (r._id || r.id) === clip._id);
    setCurrentIndex(idx >= 0 ? idx : null);
    setActiveClip(clip);
    setPlayerOpen(true);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      if (prev == null) return prev;
      const ni = prev - 1;
      if (ni >= 0) {
        setActiveClip(audioRecordings[ni]);
        return ni;
      }
      return prev;
    });
  };

  const goNext = () => {
    setCurrentIndex((prev) => {
      if (prev == null) return prev;
      const ni = prev + 1;
      if (ni < audioRecordings.length) {
        setActiveClip(audioRecordings[ni]);
        return ni;
      }
      return prev;
    });
  };


  // Right-click also opens menu
  const onContextMenu = (e, clip) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ open: true, x: rect.left, y: rect.bottom + 8, clipId: clip._id });
  };

  /* ---- Alert banner ---- */
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
    setLabel(record?.audioLabel || record?.label || record?.name || "");
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
        fd.append("fieldType", "audioRecordings");
        fd.append("audioRecordings", editFile);
        if (label) fd.append("audioLabel", label);

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
          fieldType: "audioRecordings",
          audioLabel: label,
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

  /* ---- Delete ---- */
  const handleDelete = async (record) => {
    if (!record) return;
    const fileId = record?._id || record?.id;
    if (!window.confirm("Delete this recording? This cannot be undone.")) return;

    try {
      setDeletingId(fileId);
      await axios.delete(`${VITE_APP_SERVER}/api/v1/files-recordings/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { patientId: pid, admissionId: aid, fileId, fieldType: "audioRecordings" }
      });
      setAlert({ type: "success", message: "Deleted successfully." });
      if (editingRecord && (editingRecord._id === fileId || editingRecord.id === fileId)) {
        setEditOpen(false);
        setEditingRecord(null);
      }
      await fetchRecordings(pid, aid);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete failed.";
      setAlert({ type: "error", message: msg });
    } finally {
      setDeletingId(null);
    }
  };

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
        fieldType: "audioRecordings",
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
    <div className={`w-full relative h-full overflow-y-scroll ${audioRecordings && audioRecordings.length > 0 ? "bg-[#F4F6FA]" : "bg-white"} font-inter py-10`}
      onClick={() => menu.open && setMenu({ open: false, x: 0, y: 0, clipId: null })}>

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
      {audioRecordings && audioRecordings.length > 0 ? (
        <div className="w-full portrait:h-[90%] landscape:h-[85%] overflow-y-scroll px-5 py-10">
          <div className="w-full justify-between flex">
            <div>
              <p className="font-semibold text-[24px] text-black">Patient's Recorded audios</p>
              <p className="font-semibold text-[18px] text-[#6F3CDB]">
                {todayStr}
              </p>

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
             
            </div>
          </div>

          {/* Recorded clips grid */}
          <div className="w-full flex flex-row flex-wrap gap-5 mt-10">
            {fetching && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="animate-spin" /> Loading recordings…
              </div>
            )}
            {
              audioRecordings?.map((a, index) => (
                <div key={a._id} className="w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD] flex flex-col justify-center items-center"
                  onMouseDown={(e) => onPressStart(e, a)}
                  onMouseUp={(e) => onPressEnd(e, a)}
                  onMouseLeave={() => clearTimer(a._id)}
                  onTouchStart={(e) => onPressStart(e, a)}
                  onTouchEnd={(e) => onPressEnd(e, a)}
                  onContextMenu={(e) => onContextMenu(e, a)}>
                  {deletingId === a._id && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-[10px] flex items-center justify-center z-10">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Loader2 className="animate-spin" /> Deleting…
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <div className="w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center">
                      <p className="font-medium text-[16px] text-white">{index + 1}</p>
                    </div>
                    <img src="/assets/audioFile.svg" className="w-[111px] h-[100px]" />
                  </div>

                  <div className="flex flex-col items-center mt-10">
                    <p className="text-[#282D30] text-[18px] font-semibold truncate w-56 text-center">{a.name}</p>
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
                    {/* <audio controls src={c.url} className="mt-3 w-56" /> */}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col justify-center items-center">
          <img src="/assets/empty.svg" className="portrait:w-[75%] mt-14" />
          <button
            onClick={() => setRecordOpen(true)}
            className="w-[367px] h-[70px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[22px] text-[#FDFDFD] mt-14"
          >
            {uploading ? "Uploading…" : "Upload Files"}
          </button>
        </div>
      )}

      {/* Popup */}
      <RecorderModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSave={handleSaveClip}
      />

      <PlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        clip={activeClip}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex != null && currentIndex < audioRecordings.length - 1}
        onPrev={goPrev}
        onNext={goNext}
      />

      {/* Context menu (press & hold) */}

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ open: false, x: 0, y: 0, clipId: null })}
        actions={[
          {
            label: "Edit File",
           
            onClick: () => openEdit(menuRecord),
          },
          {
            label: "Delete File",
           
            onClick: () => handleDelete(menuRecord),
          },
          { label: "Rename File", onClick: () => openRename(menuRecord)  },
          { label: "Create Folder", onClick: () => console.log("create folder") },
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

export default AudioRecording;


