import axios from "axios";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import { format } from "date-fns";
import {fetchWithCache} from "../../offline/fetchWithCache"
import { queueRequest, drainOutbox } from "../../offline/helpers";
import { useOnline } from "../../offline/useOnline";
import { v4 as uuid } from "uuid";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const CreateSchedule = ({
  setOpenForm,
  selectedOT,
  fetchSchedules,
  selectedEvent,
  setSelectedEvent,
}) => {
  const online = useOnline();

  const [form, setForm] = useState({
    otId: selectedOT._id,
    startDateTime: "",
    endDateTime: "",
    surgeryName: "",
    patientId: "",
    admissionId: "",
    doctorId: "",
  });

const [patients, setPatients] = useState([]);
const [doctors, setDoctors] = useState([]);
const [patientsUpdatedAt, setPatientsUpdatedAt] = useState(null);
const [loading, setLoading] = useState(false);

const [doctorOpts, setDoctorOpts] = useState([]);
const [doctorL2I, setDoctorL2I] = useState({});
const [doctorI2L, setDoctorI2L] = useState({});

const [patientOpts, setPatientOpts] = useState([]);
const [patientL2I, setPatientL2I] = useState({});
const [patientI2L, setPatientI2L] = useState({});
const [patientsRaw, setPatientsRaw] = useState([]);

const fetchDoctors = (forceOnline = false) =>
  fetchWithCache({
    collection: "doctors",
    url: `${VITE_APP_SERVER}/api/v1/doctor-master`,
    setItems: setDoctors,
    forceOnline,
  });

    const fetchPatients = (forceOnline = false) =>
    fetchWithCache({
      collection: "patients",
      url: `${VITE_APP_SERVER}/api/v1/patient`,
      setItems: setPatients,
      setUpdatedAt: setPatientsUpdatedAt,
      forceOnline,
      setLoading,              
    });

useEffect(() => {
  fetchDoctors();
  fetchPatients();
}, []);

useEffect(() => {
  // when doctors fetched → build maps
  const opts = doctors.map(d => d.doctorName);
  setDoctorOpts(opts);
  setDoctorL2I(Object.fromEntries(doctors.map(d => [d.doctorName, d._id])));
  setDoctorI2L(Object.fromEntries(doctors.map(d => [d._id, d.doctorName])));
}, [doctors]);

useEffect(() => {
  // when patients fetched → build maps
  setPatientsRaw(patients);
  const opts = patients.map(p => p.identityDetails?.patientName || "—");
  setPatientOpts(opts);
  setPatientL2I(Object.fromEntries(patients.map(p => [p.identityDetails?.patientName || "—", p._id])));
  setPatientI2L(Object.fromEntries(patients.map(p => [p._id, p.identityDetails?.patientName || "—"])));
}, [patients]);

  const pickLatestAdmissionId = (admissions = []) => {
  if (!admissions?.length) return "";
  // Sort by admissionDate or createdAt (fallback), newest first
  const sorted = [...admissions].sort((a, b) => {
    const da = new Date(a.admissionDate || a.createdAt || 0).getTime();
    const db = new Date(b.admissionDate || b.createdAt || 0).getTime();
    return db - da;
  });
  return sorted[0]?._id || "";
};
  

  // Pre-fill in Edit mode (wait until label↔id maps exist)
  useEffect(() => {
    if (!selectedEvent) return;
    setForm((prev) => ({
      ...prev,
      otId: selectedOT._id,
      startDateTime: format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm"),
      endDateTime: format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm"),
      surgeryName: selectedEvent.title || "",
      admissionId: selectedEvent.admissionId || "",
      patientId: patientL2I[selectedEvent.patientName] || "",
      doctorId: doctorL2I[selectedEvent.doctorName] || "",
    }));
  }, [selectedEvent, selectedOT._id, patientL2I, doctorL2I]);

  // ------- Submit (online or queue offline) -------
const handleSubmit = async (e) => {
  e.preventDefault();

  // basic guards
  if (!form.startDateTime || !form.endDateTime) {
    alert("Please select start and end time");
    return;
  }
  if (!form.patientId || !form.doctorId) {
    alert("Please select patient and doctor");
    return;
  }
  if (!form.admissionId) {
    alert("Please select a visit/admission");
    return;
  }

  const isEdit = Boolean(selectedEvent);
  const endpoint = isEdit
    ? `${VITE_APP_SERVER}/api/v1/schedules/${selectedEvent.id}`
    : `${VITE_APP_SERVER}/api/v1/schedules`;

  const payload = { ...form };

  try {
    if (online) {
      // send now
      if (isEdit) {
        await axios.put(endpoint, payload);
      } else {
        await axios.post(endpoint, payload);
      }

      // also flush any backlog (pass your senders map if you have one)
      await drainOutbox?.(/* senders */);

      alert(isEdit ? "Schedule updated successfully" : "Schedule created successfully");
    } else {
      // queue for later using the same shape as your working bed assigner
      await queueRequest({
        id: uuid(),
        collection: "schedules",                 // namespace for this module
        endpoint,
        method: isEdit ? "put" : "post",
        dto: payload,                            // keep DTO consistent
        meta: { sender: "genericJSON" },
      });

      alert("You are offline. The request will process as soon as you connect to the internet.");
    }

    // UX after success/queue
    setSelectedEvent?.(null);
    setOpenForm(false);
    fetchSchedules?.();
  } catch (err) {
    // Network error without HTTP response? queue it like offline (same pattern as your example)
    if (!err?.response) {
      try {
        await queueRequest({
          id: uuid(),
          collection: "schedules",
          endpoint,
          method: isEdit ? "PUT" : "POST",
          dto: payload,                          // (your example wrapped as {data: payload}; if your sender expects that, swap here)
          meta: { sender: "genericJSON" },
        });
        alert("You are offline. The request will process as soon as you connect to the internet.");
        setSelectedEvent?.(null);
        setOpenForm(false);
        fetchSchedules?.();
      } catch (qErr) {
        console.error("Failed to queue schedule request", qErr);
        alert("Could not queue the request. Please try again.");
      }
    } else {
      console.error(err);
      alert(err?.response?.data?.message || (isEdit ? "Failed to update schedule. Please try again." : "Failed to create schedule. Please try again."));
    }
  }
};

  const title = selectedEvent ? "Edit" : "Create";

  return (
    <div className="fixed z-20 w-full h-full bg-black/50 top-0 left-0 flex justify-center pt-10">
      <div className="w-[600px] h-fit bg-[#FDFDFD] rounded-[8px] border-[1.5px] border-[#C4C8D2]">
        {/* Header */}
        <div className="w-full border-b border-b-[#C4C8D2] flex justify-between p-5">
          <p className="font-bold text-[18px] text-[#282D30]">
            {title} Schedule {online ? "" : <span className="text-orange-500">(Offline)</span>}
          </p>
          <X onClick={() => setOpenForm(false)} color="#A1A3B2" className="cursor-pointer" />
        </div>

        {/* Form */}
        <form className="w-full flex flex-col gap-y-4 my-5" onSubmit={handleSubmit}>
          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">Start Date & Time:</p>
            <input
              type="datetime-local"
              className="input"
              required
              value={form.startDateTime}
              onChange={(e) => setForm((s) => ({ ...s, startDateTime: e.target.value }))}
            />
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">End Date & Time:</p>
            <input
              type="datetime-local"
              className="input"
              required
              value={form.endDateTime}
              onChange={(e) => setForm((s) => ({ ...s, endDateTime: e.target.value }))}
            />
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">Appointment Name:</p>
            <input
              type="text"
              className="input"
              required
              value={form.surgeryName}
              onChange={(e) => setForm((s) => ({ ...s, surgeryName: e.target.value }))}
            />
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">Patient Name:</p>
            <div className="w-[60%]">
         <CustomDropdown
  options={patientOpts}
  selected={patientI2L[form.patientId] || ""}
  onChange={(label) => {
    const pid = patientL2I[label];
    const patient = patientsRaw.find((p) => p._id === pid);
    const latestAdmissionId = pickLatestAdmissionId(patient?.admissionDetails || []);
    setForm((s) => ({ ...s, patientId: pid, admissionId: latestAdmissionId }));
  }}
/>
            </div>
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">Dr. Name:</p>
            <div className="w-[60%]">
              <CustomDropdown
                label="Select Doctor"
                options={doctorOpts}
                selected={doctorI2L[form.doctorId] || ""}
                onChange={(label) => setForm((s) => ({ ...s, doctorId: doctorL2I[label] }))}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-fit px-4 h-[50px] rounded-[10px] bg-[#36D7A0] text-white font-medium text-[16px] self-center"
          >
            {title}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSchedule;
