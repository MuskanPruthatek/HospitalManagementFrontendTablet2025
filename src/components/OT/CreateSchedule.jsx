import axios from "axios";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import CustomDropdown from "../CustomDropdown/CustomDropdown"
import { format } from "date-fns";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const CreateSchedule = ({
  setOpenForm,
  selectedOT,
  fetchSchedules,
  selectedEvent,
  setSelectedEvent,
}) => {
  const [form, setForm] = useState({
    otId: selectedOT._id,
    startDateTime: "",
    endDateTime: "",
    surgeryName: "",
    patientId: "",
    admissionId: "",
    doctorId: "",
  });

  const [doctorOpts, setDoctorOpts] = useState([]);
  const [doctorL2I, setDoctorL2I] = useState({});
  const [doctorI2L, setDoctorI2L] = useState({});

  const [patientOpts, setPatientOpts] = useState([]);
  const [patientL2I, setPatientL2I] = useState({});
  const [patientI2L, setPatientI2L] = useState({});

  const [patientsRaw, setPatientsRaw] = useState([]);      // ⭐ NEW
  const [visitOpts, setVisitOpts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${VITE_APP_SERVER}/api/v1/doctor-master`
        );
        setDoctorOpts(data.data.map((d) => d.doctorName));
        setDoctorL2I(
          Object.fromEntries(data.data.map((d) => [d.doctorName, d._id]))
        );
        setDoctorI2L(
          Object.fromEntries(data.data.map((d) => [d._id, d.doctorName]))
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${VITE_APP_SERVER}/api/v1/patient`);
        setPatientsRaw(data.data);                              
        setPatientOpts(data.data.map(p => p.identityDetails.patientName));
        setPatientL2I(
          Object.fromEntries(
            data.data.map((p) => [p.identityDetails.patientName, p._id])
          )
        );
        setPatientI2L(
          Object.fromEntries(
            data.data.map((p) => [p._id, p.identityDetails.patientName])
          )
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setForm({
        otId: selectedOT._id,
        startDateTime: format(selectedEvent.start, "yyyy-MM-dd'T'HH:mm"),
        endDateTime: format(selectedEvent.end, "yyyy-MM-dd'T'HH:mm"),
        surgeryName: selectedEvent.title,
        admissionId: selectedEvent.admissionId || "",
        patientId: patientL2I[selectedEvent.patientName] || "",
        doctorId: doctorL2I[selectedEvent.doctorName] || "",
      });
    }
  }, [selectedEvent, selectedOT._id, patientL2I, doctorL2I]);

  useEffect(() => {
  if (!form.patientId) { setVisitOpts([]); return; }

  const patient = patientsRaw.find(p => p._id === form.patientId);
  if (!patient) return;

  const admissions = patient.admissionDetails || [];

  if (admissions.length === 1) {
    // one visit → autoselect
    if (form.admissionId !== admissions[0]._id) {
      setForm(s => ({ ...s, admissionId: admissions[0]._id }));
    }
    setVisitOpts([]);
    return;
  }

  // many visits → make labels
  const opts = admissions.map(a =>
    `${a.registrationType} | ${a.ipdNo || a._id.slice(-4)}`
  );
  setVisitOpts(opts);

  // ✅ keep prefilled admissionId if it belongs to this patient
  const hasPrefilled = admissions.some(a => a._id === form.admissionId);
  if (!hasPrefilled) {
    setForm(s => ({ ...s, admissionId: "" }));  // force user to pick
  }
}, [form.patientId, form.admissionId, patientsRaw]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        // Update existing schedule
        await axios.put(
          `${VITE_APP_SERVER}/api/v1/schedules/${selectedEvent.id}`,
          form
        );
        alert("Schedule updated successfully!");
      } else {
        // Create new schedule
        await axios.post(`${VITE_APP_SERVER}/api/v1/schedules`, form);
        alert("Schedule created successfully!");
      }
      setOpenForm(false);
      setSelectedEvent(null);
      fetchSchedules();
    } catch (err) {
      console.error(err);
      alert(
        selectedEvent
          ? "Failed to update schedule"
          : "Failed to create schedule"
      );
    }
  };

  const title = selectedEvent ? "Edit" : "Create";

  return (
    <div className="fixed z-20 w-full h-full bg-black/50 top-0 left-0 flex justify-center pt-10">
      <div className="w-[600px] h-fit bg-[#FDFDFD] rounded-[8px] border-[1.5px] border-[#C4C8D2]">
        {/* Header */}
        <div className="w-full border-b border-b-[#C4C8D2] flex justify-between p-5">
          <p className="font-bold text-[18px] text-[#282D30]">
            {title} Schedule
          </p>
          <X
            onClick={() => setOpenForm(false)}
            color="#A1A3B2"
            className="cursor-pointer"
          />
        </div>

        {/* Form */}
        <form
          className="w-full flex flex-col gap-y-4 my-5"
          onSubmit={handleSubmit}
        >
          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">
              Start Date & Time:
            </p>
            <input
              type="datetime-local"
              className="input"
              required
              value={form.startDateTime}
              onChange={(e) =>
                setForm((s) => ({ ...s, startDateTime: e.target.value }))
              }
            />
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">
              End Date & Time:
            </p>
            <input
              type="datetime-local"
              className="input"
              required
              value={form.endDateTime}
              onChange={(e) =>
                setForm((s) => ({ ...s, endDateTime: e.target.value }))
              }
            />
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">
              Appointment Name:
            </p>
            <input
              type="text"
              className="input"
              required
              value={form.surgeryName}
              onChange={(e) =>
                setForm((s) => ({ ...s, surgeryName: e.target.value }))
              }
            />
          </div>

          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">
              Patient Name:
            </p>
            <div className="w-[60%]">
              <CustomDropdown
                label="Select Patient"
                options={patientOpts}
                selected={patientI2L[form.patientId] || ""}
                onChange={(label) =>
                  setForm((s) => ({ ...s, patientId: patientL2I[label] }))
                }
              />
            </div>
          </div>

          {visitOpts.length > 0 && (
  <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
    <p className="font-normal text-[16px] text-[#282D30]">Select Visit:</p>
    <div className="w-[60%]">
      <CustomDropdown
      label="Select Visit"
        options={visitOpts}
        selected={
          visitOpts.find(lab => {
            const idx = visitOpts.indexOf(lab);
            const patient = patientsRaw.find(p => p._id === form.patientId);
            return (
              patient?.admissionDetails[idx]?._id === form.admissionId
            );
          }) || ""
        }
        onChange={label => {
          const patient = patientsRaw.find(p => p._id === form.patientId);
          const idx = visitOpts.indexOf(label);
          const admissionId = patient?.admissionDetails[idx]._id;
          setForm(s => ({ ...s, admissionId }));
        }}
      />
    </div>
  </div>
)}
          <div className="w-[80%] justify-end flex gap-x-3 items-center self-center">
            <p className="font-normal text-[16px] text-[#282D30]">Dr. Name:</p>
            <div className="w-[60%]">
              <CustomDropdown
              label="Select Doctor"
                options={doctorOpts}
                selected={doctorI2L[form.doctorId] || ""}
                onChange={(label) =>
                  setForm((s) => ({ ...s, doctorId: doctorL2I[label] }))
                }
              />
            </div>
          </div>

          {/* Error */}
          {/* {error && (
                <p className="text-center text-red-600 text-sm font-medium mt-2">
                  {error}
                </p>
              )} */}

          {/* Submit */}
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
