import React, { useEffect, useRef, useState } from "react";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { X, Play, SkipBack, SkipForward, Pause, FastForward } from "lucide-react";


const PlayerModal = ({ open, onClose, clip, hasPrev, hasNext, onPrev, onNext }) => {

    const fmtDMY = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }); // 26-07-2025

const fmtClock = (sec) => {
  const n = Number(sec);
  if (!Number.isFinite(n) || n < 0) return "--:--";
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

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

export default PlayerModal;