import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import CustomDropdown from "../CustomDropDown/CustomDropdown";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
const ASSIGN_ENDPOINT = `${VITE_APP_SERVER}/api/v1/patient/assign-bed`; 

function resolveLatestAdmissionId(admissionDetails = []) {
  if (!Array.isArray(admissionDetails) || admissionDetails.length === 0) return "";
  const active = admissionDetails.find(
    (a) => (a.status || "").toLowerCase() === "admitted"
  );
  if (active?._id) return active._id;

  const byNewest = [...admissionDetails].sort((a, b) => {
    const getTime = (x) =>
      new Date(
        x.admissionDate ||
          x.createdAt ||
          x.updatedAt ||
          x.dischargeDate ||
          0
      ).getTime();
    return getTime(b) - getTime(a);
  });
  return byNewest[0]?._id || "";
}

const AssignBed = ({ open, onClose, selectedBed2, beds, refreshBeds }) => {
  const [submitting, setSubmitting] = useState(false);

  // Patients for dropdown
  const [patientOpts, setPatientOpts] = useState([]); // labels
  const [patientL2I, setPatientL2I] = useState({});   // label -> id
  const [patientI2L, setPatientI2L] = useState({});   // id -> label

  // Form state
  const [form, setForm] = useState({
    patientId: "",
    admissionId: "",
    bedId: "",
  });

  // Preselect bedId from the clicked bed
  useEffect(() => {
    if (!open) return;
    setForm((f) => ({
      ...f,
      bedId: selectedBed2?._id || selectedBed2?.bedId || "",
    }));
  }, [open, selectedBed2]);

  // Load patients when modal opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await axios.get(`${VITE_APP_SERVER}/api/v1/patient`);
        const patients = Array.isArray(data?.data) ? data.data : [];

        const labels = patients.map((p) => p.identityDetails?.patientName || "Unnamed");
        const L2I = Object.fromEntries(
          patients.map((p) => [p.identityDetails?.patientName || "Unnamed", p._id])
        );
        const I2L = Object.fromEntries(
          patients.map((p) => [p._id, p.identityDetails?.patientName || "Unnamed"])
        );

        setPatientOpts(labels);
        setPatientL2I(L2I);
        setPatientI2L(I2L);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      }
    })();
  }, [open]);

  // When a patient is chosen (by label), resolve patientId and fetch their latest admission
  const handlePatientChange = async (label) => {
    const pid = patientL2I[label] || "";
    if (!pid) {
      setForm((f) => ({ ...f, patientId: "", admissionId: "" }));
      return;
    }

    try {
      // Get full patient doc to determine latest admissionId robustly
      const { data } = await axios.get(`${VITE_APP_SERVER}/api/v1/patient/${pid}`);
      const patient = data?.data || {};
      const admissionId = resolveLatestAdmissionId(patient.admissionDetails || []);

      setForm((f) => ({
        ...f,
        patientId: pid,
        admissionId,
      }));
    } catch (err) {
      console.error("Failed to fetch patient details:", err);
      setForm((f) => ({ ...f, patientId: pid, admissionId: "" }));
    }
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.admissionId || !form.bedId) return;

    try {
      setSubmitting(true);
      await axios.post(ASSIGN_ENDPOINT, {
        patientId: form.patientId,
        admissionId: form.admissionId,
        bedId: form.bedId,
      });

      // Refresh grids & patient lists outside
      await refreshBeds?.();
      // await fetchPatients?.();

      onClose?.();
    } catch (err) {
      console.error("Assign bed failed:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign bed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !submitting && form.patientId && form.admissionId && form.bedId;

  if (!open) return null;

  return (
    <div className="w-full h-full fixed bg-black/60 top-0 left-0 right-0 bottom-0 flex justify-center items-center font-inter z-50">
      <div className="w-[50%] max-w-[720px] h-fit pb-10 px-5 bg-[#FDFDFD] drop-shadow-lg drop-shadow-[#88888840] rounded-[20px]">
        <div className="w-full flex justify-between items-center mt-4">
          <p className="font-semibold text-[20px] text-[#282D30]">Assign Bed</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
            <X color="#A1A3B2" />
          </button>
        </div>

        <form className="w-full" onSubmit={submitAssign}>
          <div className="w-full mt-5">
            <p className="font-semibold text-[16px] text-[#282D30]">Assign To</p>
            <div className="mt-2">
              <CustomDropdown label="Select Patient"
                options={patientOpts}
                selected={patientI2L[form.patientId] || ""}
                onChange={handlePatientChange}
              />
              {/* Small helper text */}
              <div className="text-xs text-[#6b7280] mt-1">
                {form.admissionId
                  ? "Latest admission selected automatically."
                  : form.patientId
                  ? "No active admission found. Please ensure the patient has an admission."
                  : "Pick a patient to auto-select their latest admission."}
              </div>
            </div>
          </div>

          {/* Hidden but kept for clarity/debug – you can show these if useful */}
          <input type="hidden" value={form.admissionId} readOnly />
          <input type="hidden" value={form.bedId} readOnly />

          <button
            disabled={!canSubmit}
            className="w-full h-[48px] bg-[#6F3CDB] rounded-[10px] text-white font-bold text-[18px] mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Assigning..." : "Assign"}
          </button>
        </form>

        {/* Contextual details */}
        {selectedBed2 && (
          <div className="mt-6 text-sm text-[#4b5563]">
            <div>
              Bed: <b>{selectedBed2.bedName}</b> · Floor: {selectedBed2.floorId?.floorName}
            </div>
            {selectedBed2.wardId?.wardName && (
              <div>Ward: {selectedBed2.wardId.wardName}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignBed;
