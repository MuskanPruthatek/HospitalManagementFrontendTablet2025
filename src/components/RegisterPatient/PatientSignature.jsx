import React from "react";
import SignatureField from "./Helpers/SignatureField";


/**
 * props
 * ─────────────────────────────────────────
 * value     → the whole signatureDetails object
 * onChange  → (partialObj) ⇒ void
 */
const PatientSignature = ({ value, onChange }) => {
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
      ].map(([key, label]) => (
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

    {/* <button
      className="px-10 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-md
                 hover:brightness-105 active:scale-95 transition-all duration-150"
      onClick={(e) => e.preventDefault()}
    >
      Save Patient Signatures
    </button> */}
    </div>
  );
};

export default PatientSignature;

