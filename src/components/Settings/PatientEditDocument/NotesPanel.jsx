import { Mic, MicOff, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { usePatient } from "../../../context/PatientContext";
import axios from "axios";
import useSpeechRecorder from "../../../hooks/useSpeechRecorder";
import { applyTextCase } from "../../../utils/applyTextCase";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const NotesPanel = ({ selectedMaster, masters, setSelectedMaster }) => {
  const { selectedPatient } = usePatient();

  const config = useMemo(() => masters.find(m => m.id === selectedMaster) || {}, [masters, selectedMaster]);
  const displayName = config?.name || "Notes";
  const apiField = config?.apiField || "notes"; 

  const [patientData, setPatientData] = useState(null);
  const [textCase, setTextCase] = useState("Capital"); // "Capital" | "Camel"
  const [textSize, setTextSize] = useState(18);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const pid = selectedPatient?.patientId;
  const aid = selectedPatient?.admissionId;

  // auth (same pattern you use elsewhere)
  const user = JSON.parse(localStorage.getItem("auth"));
  const token = user?.token;

  // 🔁 Reusable audio+STT hook
  const {
    isRecording,
    start,
    stop,
    transcript,
    setTranscript,
    lang,
    setLang,
    canvasRef,
  } = useSpeechRecorder({ lang: "en-IN", autoRestart: true });

  // fetch patient
  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);

  // keep textarea showing applied case
  const displayText = applyTextCase(transcript, textCase);

    useEffect(() => {
      if (!pid || !aid) return;
      fetchRecordings(pid, aid);
    }, [pid, aid]);

  const fetchRecordings = async (patientId, admissionId) => {
    try {
      // setLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/notes/${patientId}/${admissionId}`
      );
      // setAudioRecordings(data.data.audioRecordings);
    } catch (err) {
      console.error(err);
    } 
  };

  
const [lastSavedAt, setLastSavedAt] = useState(null);

// helper: trim and normalize whitespace a bit
const cleanNote = (s) => s.replace(/\s+\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();


const buildNotePayload = (noteText) => ({
  patientId: pid,
  admissionId: aid,
  [apiField]: noteText,
});

const handleSave = async () => {
  try {
    setSaveErr("");
    setSaving(true);

    if (!pid || !aid) {
      throw new Error("Missing patient/admission. Please select a patient first.");
    }

    const noteText = cleanNote(displayText || "");
    if (!noteText) {
      throw new Error(`${displayName} is empty.`);
    }

    const payload = buildNotePayload(noteText);

    await axios.post(
      `${VITE_APP_SERVER}/api/v1/notes/add`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // success UX
    setTranscript("");        // clear textarea
    setLastSavedAt(new Date());
    fetchRecordings(pid, aid)
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      `Failed to save ${displayName.toLowerCase()}.`;
    setSaveErr(msg);
  } finally {
    setSaving(false);
  }
};


  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#2c2c2c98] z-50 backdrop-blur-xs flex flex-col justify-center items-center ">
      <div className="w-[90%] portrait:max-h-[70vh] md:landscape:max-h-[70vh] lg:landscape:max-h-[70vh] overflow-y-scroll scrolll bg-[#FDFDFD] rounded-[20px] p-4 ">
        <div className="w-full flex justify-between items-center ">
          <div className="w-[95%] h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4 ">
            <img src="/assets/patients2.svg" className="w-[24px] h-[30px] " />
            <p className="text-[#6F3CDB] font-semibold text-[20px]  ">
              {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
              {patientData?.identityDetails?.patientName ?? "Loading..."}
            </p>
          </div>

          <X
            size={40}
            color="#282D30"
            onClick={() => {
              if (isRecording) stop();
              setSelectedMaster("");
            }}
            className="cursor-pointer"
          />
        </div>

        <div className="w-full h-[70px] rounded-[10px] bg-[#FFF7F2] flex px-5 items-center gap-x-4 mt-3 ">
          <img src="/assets/consultant.svg" className="w-[19px] h-[23px] " />
          <p className="text-[#FB8C5C] font-semibold text-[20px]  ">
            Consultant:
          </p>
        </div>

        <p className="text-center text-black font-semibold text-[30px] my-5 ">
         {displayName}
        </p>

        <div className="w-full flex flex-row flex-wrap gap-3 justify-between items-center ">
          {/* Text size */}
          <div className=" flex gap-x-3 items-center ">
            <p className="font-bold text-[20px] text-black whitespace-nowrap ">
              Text size:
            </p>

            <div className="w-[120px] ">
              <input
                type="number"
                min={12}
                max={32}
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value || 18))}
                className="input2 w-full h-[40px] px-3 border rounded"
              />
            </div>
          </div>

          {/* Mic tile */}
          <div
            className={`w-[500px] h-[65px] rounded-[10px] ${
              isRecording ? "bg-[#34a853]" : "bg-[#6F3CDB]"
            } flex justify-between items-center pl-3 pr-5 cursor-pointer`}
            onClick={() => (isRecording ? stop() : start())}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            <div className="flex items-center gap-3">
              <p className="font-semibold text-[18px] text-white px-4 border-r border-r-white">
                {lang}
              </p>

              <div className="waves flex items-center">
                <canvas
                  ref={canvasRef}
                  width={220}
                  height={40}
                  style={{
                    display: isRecording ? "block" : "none",
                    background: "transparent",
                  }}
                />
                {!isRecording && (
                  <span className="text-white/80 text-sm">
                    Tap to dictate...
                  </span>
                )}
              </div>
            </div>

            {isRecording ? (
              <Mic size={26} color="white" />
            ) : (
              <MicOff size={26} color="white" />
            )}
          </div>

          {/* Language switch */}
          <div className="flex items-center gap-2">
            <p className="font-bold text-[16px] underline text-[#50B7FF] whitespace-nowrap cursor-default">
              Translate to English
            </p>
          </div>
        </div>

        {/* Text Case Toggle & Notes */}
        <div className="w-full h-[500px] relative ">
          <div className="w-[148px] h-[56px] rounded-[10px] p-1 bg-[#EAEAEA] flex items-center justify-center absolute right-4 top-8 ">
            <div
              onClick={() => setTextCase("Capital")}
              className={`w-[50%] h-full flex justify-center items-center text-[20px]
                     font-semibold text-black ${
                       textCase === "Capital" ? "bg-[#FDFDFD]" : "bg-transparent"
                     } cursor-pointer`}
            >
              AG
            </div>

            <div
              onClick={() => setTextCase("Camel")}
              className={`w-[50%] h-full flex justify-center items-center text-[20px]
                     font-semibold text-black ${
                       textCase === "Camel" ? "bg-[#FDFDFD]" : "bg-transparent"
                     } cursor-pointer`}
            >
              Ag
            </div>
          </div>

          <textarea
            className="w-full h-full border border-[#A1A3B2] bg-[#F7F7F7] rounded-[15px] my-4 p-4 outline-none"
            style={{ fontSize: `${textSize}px`, lineHeight: "1.5" }}
            value={displayText}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`Start speaking or type your ${displayName} here...`}
          />
        </div>

        {saveErr ? (
          <p className="text-red-600 text-center mt-2">{saveErr}</p>
        ) : null}

        <div className="w-full flex justify-center ">
          <button
            onClick={handleSave}
            disabled={saving || !pid || !aid}
            className={`w-[60%] h-[70px] rounded-[14px] text-[22px] font-semibold mt-10 
              ${saving ? "bg-[#bfbfbf] cursor-not-allowed" : "bg-[#FB8C5C] text-[#FDFDFD]"}`}
          >
            {saving ? "Saving..." : `Save ${displayName}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;
