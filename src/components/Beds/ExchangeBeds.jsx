// src/components/Bed/BedExchangeModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import { loadCache, saveCache } from "../../offline/cache";
import { drainOutbox, isOnline, queueRequest } from "../../offline/helpers";
import { v4 as uuid } from "uuid";
import { senders } from "../../offline/senders";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const ExchangeBeds = ({ open, onClose, selectedBed, beds, refreshBeds }) => {
  const [submitting, setSubmitting] = useState(false);

  // Patients (fetched here, local to modal)
  const [patientOpts, setPatientOpts] = useState([]);
  const [patientL2I, setPatientL2I] = useState({});
  const [patientI2L, setPatientI2L] = useState({});

  // Form
  const [form, setForm] = useState({
    patientAId: "",
    admissionAId: "",
    patientBId: "",
    admissionBId: "",
    exchangeDate: "",
    exchangeTime: "",
  });

  // Helpers
  const pickLatestAdmissionIdFromList = (admissions = []) => {
    if (!admissions || admissions.length === 0) return "";
    if (admissions.length === 1) return admissions[0].admissionId;
    return [...admissions].sort(
      (a, b) => new Date(b.admissionDate) - new Date(a.admissionDate)
    )[0].admissionId;
  };

  const getLatestAdmissionIdForPatient = (pid, bedsArr = []) => {
    if (!pid) return "";
    const allAdmissions = [];
    for (const b of bedsArr) {
      if (
        b?.occupiedBy?.patientId === pid &&
        Array.isArray(b?.occupiedBy?.admissions)
      ) {
        allAdmissions.push(...b.occupiedBy.admissions);
      }
    }
    return pickLatestAdmissionIdFromList(allAdmissions);
  };

  // When internet returns, flush the outbox and alert if a bed exchange was sent
useEffect(() => {
  const onBackOnline = async () => {
    const res = await drainOutbox(senders);
    if (res.byCollection?.bedExchange) {
      alert('Bed exchanged successfully');
      await refreshBeds?.();
    }
  };
  window.addEventListener('online', onBackOnline);
  return () => window.removeEventListener('online', onBackOnline);
}, [refreshBeds]);


  // Fetch all patients for the dropdown
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


  // Initialize form with Patient A (from selectedBed)
  useEffect(() => {
    if (!open || !selectedBed) return;

    const patientAId = selectedBed?.occupiedBy?.patientId || "";
    let admissionAId = "";

    const admissions = selectedBed?.occupiedBy?.admissions || [];
    if (admissions.length === 1) {
      admissionAId = admissions[0].admissionId;
    } else if (admissions.length > 1) {
      admissionAId = pickLatestAdmissionIdFromList(admissions);
    }

    setForm((s) => ({
      ...s,
      patientAId,
      admissionAId,
      // keep other fields as-is (user might have begun typing)
    }));
  }, [open, selectedBed]);

  const onSelectPatientB = (label) => {
    const pid = patientL2I[label];
    if (!pid) {
      setForm((s) => ({ ...s, patientBId: "", admissionBId: "" }));
      return;
    }
    const admissionBId = getLatestAdmissionIdForPatient(pid, beds);
    setForm((s) => ({ ...s, patientBId: pid, admissionBId }));
  };

const submitExchange = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  const payload = {
    patientAId: form.patientAId,
    admissionAId: form.admissionAId,
    patientBId: form.patientBId,
    admissionBId: form.admissionBId,
    exchangeDate: form.exchangeDate,
    exchangeTime: form.exchangeTime,
  };
  const endpoint = `${VITE_APP_SERVER}/api/v1/patient/exchange-patients`;

  try {
    if (isOnline()) {
      // send now
      await axios.post(endpoint, payload);
      // also flush any backlog
      const res = await drainOutbox(senders);
      alert('Bed exchanged successfully');
      if (res.byCollection?.bedExchange) {
        // if any queued ones also got processed, you’ve already alerted; no extra action needed
      }
    } else {
      // queue for later using generic JSON sender
      await queueRequest({
        id: uuid(),
        collection: 'bedExchange',   // namespace for this module
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
      patientAId: '',
      admissionAId: '',
      patientBId: '',
      admissionBId: '',
      exchangeDate: '',
      exchangeTime: '',
    });
    await refreshBeds?.();

  } catch (err) {
    // Network error without HTTP response? queue it like offline
    if (!err?.response) {
      await queueRequest({
        id: uuid(),
        collection: 'bedExchange',
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
      alert(err?.response?.data?.message || 'Exchange failed. Please try again.');
    }
  } finally {
    setSubmitting(false);
  }
};


  if (!open) return null;

  const patientAName =
    selectedBed?.occupiedBy?.name ||
    (form.patientAId ? patientI2L[form.patientAId] : "") ||
    form.patientAId;

  return (
    <div className="w-full h-full fixed bg-black/60 top-0 left-0 right-0 bottom-0 flex justify-center items-center font-inter z-50">
      <div className="w-[50%] max-w-[720px] h-fit pb-10 px-5 bg-[#FDFDFD] drop-shadow-lg drop-shadow-[#88888840] rounded-[20px]">
        <div className="w-full flex justify-between items-center mt-4">
          <p className="font-semibold text-[20px] text-[#282D30]">Exchange Bed</p>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
            <X color="#A1A3B2" />
          </button>
        </div>

        <form className="w-full" onSubmit={submitExchange}>
          {/* Occupied By (A) */}
          <div className="w-full mt-6">
            <p className="font-semibold text-[16px] text-[#282D30]">Occupied by (From)</p>
            <div className=" mt-2">
              <div>
                {/* <label className="text-sm text-[#6b7280]">Patient A</label> */}
                <input className="input2 mt-1" disabled value={patientAName || ""} placeholder="Patient A" />
              </div>
              {/* <div>
                <label className="text-sm text-[#6b7280]">Admission A ID</label>
                <input className="input2 mt-1" disabled value={form.admissionAId} placeholder="Admission A" />
              </div> */}
            </div>
          </div>

          {/* Exchange With (B) */}
          <div className="w-full mt-5">
            <p className="font-semibold text-[16px] text-[#282D30]">Exchange with (To)</p>
            <div className=" mt-2">
              <div>
                {/* <label className="text-sm text-[#6b7280]">Patient B</label> */}
                <CustomDropdown label="Select Patient"
                  options={patientOpts}
                  selected={patientI2L[form.patientBId] || ""}
                  onChange={onSelectPatientB}
                />
              </div>
              {/* <div>
                <label className="text-sm text-[#6b7280]">Admission B ID</label>
                <input className="input2 mt-1" value={form.admissionBId} disabled placeholder="Auto-selected admission" />
              </div> */}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div>
                <label className="font-semibold text-[16px] text-[#282D30]">Exchange Date</label>
                <input
                  type="date"
                  className="input2"
                  value={form.exchangeDate}
                  onChange={(e) => setForm((s) => ({ ...s, exchangeDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-semibold text-[16px] text-[#282D30]">Exchange Time</label>
                <input
                  type="time"
                  className="input2"
                  value={form.exchangeTime}
                  onChange={(e) => setForm((s) => ({ ...s, exchangeTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Hidden inputs */}
            <input type="hidden" value={form.patientAId} readOnly />
            <input type="hidden" value={form.admissionAId} readOnly />
            <input type="hidden" value={form.patientBId} readOnly />
            <input type="hidden" value={form.admissionBId} readOnly />
          </div>

          <button
            disabled={
              submitting ||
              !form.patientAId ||
              !form.admissionAId ||
              !form.patientBId ||
              !form.admissionBId
            }
            className="w-full h-[48px] bg-[#6F3CDB] rounded-[10px] text-white font-bold text-[18px] mt-8 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Exchanging..." : "Exchange"}
          </button>
        </form>

        {/* Contextual details */}
        {selectedBed && (
          <div className="mt-6 text-sm text-[#4b5563]">
            <div>
              Bed: <b>{selectedBed.bedName}</b> · Floor: {selectedBed.floorId?.floorName}
            </div>
            {selectedBed.wardId?.wardName && <div>Ward: {selectedBed.wardId.wardName}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeBeds;
