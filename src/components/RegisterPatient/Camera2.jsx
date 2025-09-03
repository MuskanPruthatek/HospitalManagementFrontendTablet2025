import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function Camera2({ initialPhotoUrl, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null); // Blob
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const stopCamera = () => {
    stream?.getTracks()?.forEach((t) => t.stop());
    setStream(null);
  };

   const previewSrc = photo
    ? URL.createObjectURL(photo)
    : initialPhotoUrl;


  const pickConstraints = (rear = false) => ({
    video: rear
      ? { facingMode: { ideal: "environment" } } // try rear camera
      : true, // fallback to any camera
    audio: false,
  });

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.playsInline = true; // for iOS
      videoRef.current.muted = true; // to satisfy autoplay policies
      videoRef.current
        .play()
        .catch((err) => console.error("Video play failed:", err));
    }
  }, [stream]);

  const startCamera = async () => {
    setError("");
    if (!window.isSecureContext) {
      setError("Camera requires HTTPS (or localhost).");
      return;
    }

    stopCamera();

    try {
      let media;
      try {
        media = await navigator.mediaDevices.getUserMedia(
          pickConstraints(true)
        );
      } catch {
        media = await navigator.mediaDevices.getUserMedia(
          pickConstraints(false)
        );
      }
      setStream(media);
    } catch (e) {
      console.error("getUserMedia error:", e);
      let msg = "Unable to start camera.";
      if (e.name === "NotAllowedError")
        msg = "Permission denied. Please allow camera access.";
      else if (e.name === "NotFoundError")
        msg = "No camera found on this device.";
      else if (e.name === "NotReadableError")
        msg = "Camera is in use by another app.";
      else if (e.name === "OverconstrainedError")
        msg = `No camera matches constraints: ${e.constraint || ""}`;
      else if (e.name === "SecurityError")
        msg = "Blocked by browser security policy (use HTTPS).";
      setError(msg);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhoto(blob);
          onCapture && onCapture(blob);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  useEffect(() => {
    return () => {
      // only on unmount
      stream?.getTracks()?.forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4 w-full">
      {/* --- Camera Box (matches your screenshot) --- */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-4">
        <div className="relative w-full">
          {/* Placeholder & video share same box */}
          <div className="w-full h-[130px] rounded-2xl border border-gray-300 bg-white overflow-hidden">
            {/* Show video when stream is on and no photo captured */}
            {stream && !photo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Camera preview
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Start / Stop / Capture row */}
      {!stream && !photo && (
        <div className="w-full flex gap-2 ">
          <label className="bg-gray-400 w-[50%] h-[40px] text-white flex justify-center items-center rounded-[6px] cursor-pointer text-[14px]">
            Choose file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPhoto(f);
                  onCapture && onCapture(f);  
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={startCamera}
            className="bg-gray-800 w-[50%] h-[40px] flex justify-center items-center text-white rounded-[6px] cursor-pointer text-[14px] "
          >
            Start Camera
          </button>
        </div>
      )}

      {stream && !photo && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={capture}
            className="flex-1 h-12 rounded-xl bg-[#6736EB] text-white font-medium"
          >
            Capture
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="h-12 px-5 rounded-xl border border-gray-300 text-gray-700"
          >
            Stop
          </button>
        </div>
      )}

      {/* Preview under the box */}
      {photo && (
        <div className="space-y-3">
          <img
            src={URL.createObjectURL(photo)}
            alt="Captured preview"
            className="w-full max-w-md rounded-xl border border-gray-200"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={retake}
              className="h-12 px-5 rounded-xl border border-gray-300 text-gray-700"
            >
              Retake
            </button>
          </div>
        </div>
      )}

     {previewSrc &&  <div>
          <img
            src={previewSrc}
            alt="Preview"
            className="w-32 h-32 object-cover"
          />
          <button onClick={() => {
            setPhoto(null);
            stopCamera();
            onCapture?.(null);
          }}>
            Change Photo
          </button>
        </div> }
    </div>
  );
}
