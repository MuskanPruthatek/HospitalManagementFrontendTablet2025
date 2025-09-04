import React, { useEffect, useState } from "react";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const ChangeConsultantForm = ({ value, patientId, admissionId, onTransfer }) => {
  const [doctorOpts, setDoctorOpts] = useState([]);
  const [doctorL2I, setDoctorL2I]   = useState({});
  const [doctorI2L, setDoctorI2L]   = useState({});

  // 2) Form state
  const [selectedLabel, setSelectedLabel] = useState("");
  const [changeDate, setChangeDate]       = useState("");
  const [changeTime, setChangeTime]       = useState("");

  // 3) Fetch all doctors once
  useEffect(() => {
    async function loadDoctors() {
      try {
        const { data } = await axios.get(
          `${VITE_APP_SERVER}/api/v1/doctor-master`
        );
        const labels = data.data.map(d => d.doctorName);
        const l2i    = Object.fromEntries(data.data.map(d => [d.doctorName, d._id]));
        const i2l    = Object.fromEntries(data.data.map(d => [d._id, d.doctorName]));
        setDoctorOpts(labels);
        setDoctorL2I(l2i);
        setDoctorI2L(i2l);
      } catch (err) {
        console.error("Failed to load doctors", err);
      }
    }
    loadDoctors();
  }, []);

  // 4) Once we know the parent’s current consultingDoctor, pick the right label
  useEffect(() => {
    if (value.consultingDoctorId && doctorI2L[value.consultingDoctorId]) {
      setSelectedLabel(doctorI2L[value.consultingDoctorId]);
    }
  }, [value.consultingDoctorId, doctorI2L]);

  // 5) Submit handler
  const handleSubmit = async e => {
    e.preventDefault();
    const newId = doctorL2I[selectedLabel];
    try {
      await axios.post(
        `${VITE_APP_SERVER}/api/v1/patient/change_consultant/${patientId}`,
        {
          admissionId: admissionId,
          consultingDoctor: newId,
          changeDate,
          changeTime,
        }
      );
      // Tell the parent “admissionDetails” to update its consultingDoctor
      onTransfer({ consultingDoctorId: newId });
      alert("Consultant changed successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to change consultant");
    }
  };

  useEffect(() => {
  const now = new Date();
  setChangeDate(now.toISOString().split("T")[0]);
  setChangeTime(now.toTimeString().slice(0, 5));
}, []);

  return (
    <div className="w-[90%] mt-20 mx-auto h-fit bg-[#FDFDFD] shadow-[0_2px_6px_rgba(0,0,0,0.06)] rounded-[4px] ">
      <div className="w-full border-b border-b-[#C4C8D2] flex justify-center py-4 ">
        <p className="font-bold text-[20px] text-[#36D7A0] ">
          Change Consultant
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-[100%] flex flex-col gap-y-4 my-5 pb-8 ">
       <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label whitespace-nowrap">Consulting Doctor*:</p>
          <CustomDropdown
              options={doctorOpts}
              selected={selectedLabel}
              onChange={setSelectedLabel}
            />
        </div>

        <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">Change Date:</p>
          <input
            type="date"
            className="input2 "
            value={changeDate}
            onChange={(e) => setChangeDate(e.target.value)}
          />
        </div>

        <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">Change Time:</p>
          <input
            type="time"
            className="input2 "
            value={changeTime}
            onChange={(e) => setChangeTime(e.target.value)}
          />
        </div>

        <button className="w-[90%] h-[50px] rounded-[10px] mt-3 bg-[#36D7A0] text-white font-medium text-[16px] self-center ">
          Transfer Patient
        </button>
      </form>
    </div>
  );
};

export default ChangeConsultantForm;
