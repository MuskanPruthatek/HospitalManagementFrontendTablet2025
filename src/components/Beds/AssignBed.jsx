import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import CustomDropdown from "../CustomDropDown/CustomDropdown";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
const endpoint = `${VITE_APP_SERVER}/api/v1/patient/assign-bed`; 

import { loadCache, saveCache } from "../../offline/cache";
import { drainOutbox, isOnline, queueRequest } from "../../offline/helpers";
import { v4 as uuid } from "uuid";
import { senders } from "../../offline/senders";

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
        if (isOnline()) {
          // server
          const { data } = await axios.get(`${VITE_APP_SERVER}/api/v1/patient`);
          const rows = data?.data ?? [];

          // we only need lightweight fields for this modal cache
          const lite = rows.map(p => ({
            _id: p._id,
            name: p?.identityDetails?.patientName || "",
          }));

          // update UI
          const labels = lite.map(p => p.name);
          const L2I = Object.fromEntries(lite.map(p => [p.name, p._id]));
          const I2L = Object.fromEntries(lite.map(p => [p._id, p.name]));
          setPatientOpts(labels);
          setPatientL2I(L2I);
          setPatientI2L(I2L);

          // cache for offline reuse
          await saveCache("patientsLite", lite);
        } else {
          // offline → cached list
          const { items } = await loadCache("patientsLite");
          const labels = (items || []).map(p => p.name);
          const L2I = Object.fromEntries((items || []).map(p => [p.name, p._id]));
          const I2L = Object.fromEntries((items || []).map(p => [p._id, p.name]));
          setPatientOpts(labels);
          setPatientL2I(L2I);
          setPatientI2L(I2L);
        }
      } catch (err) {
        // server failed → cached list
        const { items } = await loadCache("patientsLite");
        const labels = (items || []).map(p => p.name);
        const L2I = Object.fromEntries((items || []).map(p => [p.name, p._id]));
        const I2L = Object.fromEntries((items || []).map(p => [p._id, p.name]));
        setPatientOpts(labels);
        setPatientL2I(L2I);
        setPatientI2L(I2L);
        console.warn("Patients (modal): using cached due to error", err);
      }
    })();
  }, [open, VITE_APP_SERVER]);

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

  useEffect(() => {
    const onBackOnline = async () => {
      const res = await drainOutbox(senders);
      if (res.byCollection?.bedAssign) {
        alert('Bed assigned successfully');
        await refreshBeds?.();
      }
    };
    window.addEventListener('online', onBackOnline);
    return () => window.removeEventListener('online', onBackOnline);
  }, [refreshBeds]);

  const submitAssign = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  const payload = {
    patientId: form.patientId,
    admissionId: form.admissionId,
    bedId: form.bedId
    
  };

  try {
    if (isOnline()) {
      // send now
      await axios.post(endpoint, payload);
      // also flush any backlog
      const res = await drainOutbox(senders);
      alert('Bed assigned successfully');
      if (res.byCollection?.bedAssign) {
        // if any queued ones also got processed, you’ve already alerted; no extra action needed
      }
    } else {
      // queue for later using generic JSON sender
      await queueRequest({
        id: uuid(),
        collection: 'bedAssign',   // namespace for this module
        endpoint,
        method: 'POST',
        dto: payload,      // keep DTO consistent
        meta: { sender: 'genericJSON' },
      });
      alert('You are offline. The request will process as soon as you connect to the internet.');
    }

    // UX after success/queue
    onClose?.();
    setForm({
         patientId: "",
    admissionId: "",
    bedId: "",
    });
    await refreshBeds?.();

  } catch (err) {
    // Network error without HTTP response? queue it like offline
    if (!err?.response) {
      await queueRequest({
        id: uuid(),
        collection: 'bedAssign',
        endpoint,
        method: 'POST',
        dto: { data: payload },
        meta: { sender: 'genericJSON' },
      });
      alert('You are offline. The request will process as soon as you connect to the internet.');
      onClose?.();
      await refreshBeds?.();
    } else {
      console.error(err);
      alert(err?.response?.data?.message || 'Assignment failed. Please try again.');
    }
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
