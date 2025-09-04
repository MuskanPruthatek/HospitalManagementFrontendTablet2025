import React, { useEffect, useState } from "react";
import SignatureField from "../RegisterPatient/Helpers/SignatureField";


import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

// Map UI keys → backend "signatureTitle" strings
const SIGNATURE_BINDINGS = {
  patientGuardianSign: "Patient / Guardian's",
  interpreterNurseSign: "Interpreter / Nurse",
  receptionSign: "Reception",
  relativeWitnessSign: "Relative / Witness",

  dischargeInterpreterNurseSign: "Discharge Interpreter / Nurse",
  dischargePatientGuardianSign: "Discharge Patient / Guardian's",
  dischargeRelativeWitnessSign: "Discharge Relative / Witness",
};

// Build a showSig() helper from the fetched signature list
function useSignatureFlags(signatureList = []) {
  const lookup = React.useMemo(() => {
    const m = new Map();
    for (const s of signatureList) {
      m.set((s.signatureTitle || "").trim().toLowerCase(), !!s.status);
    }
    return m;
  }, [signatureList]);

  const showByTitle = (title, fallback = true) => {
    const key = (title || "").trim().toLowerCase();
    return lookup.has(key) ? lookup.get(key) : fallback; // default visible if not configured
  };

  const showSig = (uiKey, fallback = true) => {
    const bound = SIGNATURE_BINDINGS[uiKey] ?? uiKey;
    return showByTitle(bound, fallback);
  };

  return { showSig };
}


const PatientSignature = ({ value, onChange }) => {

  const [list, setList] = useState([])
const { showSig } = useSignatureFlags(list);

    useEffect(() => {
    (async () => {
      try {
       
        const response = await axios.get(
          `${VITE_APP_SERVER}/api/v1/document-master/signature-master`
        );

        setList(response.data.data);
        console.log(response.data.data);
      } catch (err) {
        console.error(err);
        console.log(err.response?.data?.message || err.message);
      } 
    })();
  }, []);

  // 1) After SIGNATURE_BINDINGS / useSignatureFlags:
const hasSigData = (key) => {
  const v = value?.[key];
  if (v == null) return false;

  if (typeof v === "string") return v.trim() !== "";              // data URL / image URL
  if (typeof File !== "undefined" && v instanceof File) return v.size > 0;
  if (typeof Blob !== "undefined" && v instanceof Blob) return v.size > 0;

  if (typeof v === "object") {
    // in case your signature is stored as { url, blob, ... }
    return Object.values(v).some((x) => {
      if (typeof x === "string") return x.trim() !== "";
      if (typeof File !== "undefined" && x instanceof File) return x.size > 0;
      if (typeof Blob !== "undefined" && x instanceof Blob) return x.size > 0;
      return Boolean(x);
    });
  }
  return Boolean(v);
};

const shouldShowSig = (key) => showSig(key) || hasSigData(key);

  return (
    <div className="w-full relative mt-5 p-6 flex flex-col items-start gap-y-8">
    <div className="flex flex-row flex-wrap gap-5">
      {[
        ["patientGuardianSign", "Patient / Guardian"],
        ["interpreterNurseSign", "Interpreter / Nurse"],
        ["receptionSign", "Reception"],
        ["relativeWitnessSign", "Relative Witness"],
        ["dischargeInterpreterNurseSign", "Discharge – Interpreter/Nurse"],
        ["dischargePatientGuardianSign", "Discharge – Patient/Guardian"],
        ["dischargeRelativeWitnessSign", "Discharge – Relative Witness"],
      ].filter(([key]) => shouldShowSig(key))   // ← only render enabled signatures
  .map(([key, label]) => (
        <div
          key={key}
          className="flex flex-col items-center gap-2 rounded-xl border border-gray-300 bg-white p-4 shadow-sm w-[260px] min-h-[240px] "
        >
          <p className="text-sm font-medium text-gray-700 text-center">{label}</p>
          <SignatureField
            existing={value[key]}
            onCapture={(blob) => onChange({ [key]: blob })}
            style={{ width: 220 }}
          />
        </div>
      ))}
    </div>

    </div>
  );
};

export default PatientSignature;

