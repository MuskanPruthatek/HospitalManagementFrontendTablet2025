import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSpeechRecorder
 * - getUserMedia + WebAudio analyser (waveform)
 * - Web Speech API recognition (continuous, interim)
 * - Canvas-based wave visualizer (optional: attach canvasRef)
 *
 * Options:
 *  - lang: BCP-47 language tag (e.g., 'en-IN', 'hi-IN')
 *  - autoRestart: auto-restart recognition if it ends while recording
 *
 * Returns:
 *  - isRecording, start, stop
 *  - transcript, setTranscript
 *  - lang, setLang
 *  - canvasRef (attach to a <canvas/> to render waves)
 */
export default function useSpeechRecorder({
  lang: initialLang = "en-IN",
  autoRestart = true,
} = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState(initialLang);

  // audio refs
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);

  // speech recognition refs
  const recognitionRef = useRef(null);
  const interimRef = useRef("");

  // ---- Wave drawing ----
  const drawWaves = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  const start = useCallback(async () => {
    try {
      // 1) Mic stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2) AudioContext + Analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      // 3) Visualizer (if canvas attached)
      if (canvasRef.current) drawWaves();

      // 4) Speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert(
          "Speech Recognition API not supported. Use Chrome/Edge on desktop."
        );
      } else {
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (e) => {
          let finalText = "";
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t + " ";
            else interim += t + " ";
          }
          interimRef.current = interim;
          if (finalText) {
            // append only finalized text; keep interim in ref
            setTranscript((prev) => (prev + " " + finalText).trim());
          }
        };

        recognition.onerror = (e) => {
          console.error("Recognition error:", e.error);
        };

        recognition.onend = () => {
          if (autoRestart && isRecording) {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied or unavailable.");
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawWaves, lang, autoRestart]);

  const stop = useCallback(() => {
    setIsRecording(false);

    // stop recognition
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onend = null;
        rec.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    // flush interim into transcript if any
    if (interimRef.current) {
      setTranscript((prev) => (prev + " " + interimRef.current).trim());
      interimRef.current = "";
    }

    // stop visualizer
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // close audio
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (_) {}
      audioCtxRef.current = null;
    }

    // stop mic
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // cleanup on unmount
  useEffect(() => stop, [stop]);

  return {
    isRecording,
    start,
    stop,
    transcript,
    setTranscript,
    lang,
    setLang,
    canvasRef, // attach this to your <canvas/>
  };
}
