import React, { useEffect, useState } from 'react'
import { usePatient } from '../../../../context/PatientContext';
import axios from 'axios';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ClinicalNotesData from './NotesData';
import NotesData from './NotesData';

const DigitalNotes = () => {
    const { selectedPatient } = usePatient();
     const navigate = useNavigate();

    const [patientData, setPatientData] = useState(null)

      useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);

  const [selectedMaster, setSelectedMaster] = useState("");

const masters = [
  { id: "medicineMaster", name: "Medicine Master", type: "module" },
  { id: "investigationMaster", name: "Investigation Master", type: "module" },
  { id: "diagnosisMaster", name: "Diagnosis Master", type: "module" },

  // Notes-type masters (all share the same NotesPanel)
  { id: "clinicalNotes", name: "Clinical Notes", apiField: "clinicalNotes", type: "notes" },
  { id: "nursingNotes", name: "Nursing Notes", apiField: "nursingNotes", type: "notes" },
  { id: "surgicalNotes", name: "Surgical Notes", apiField: "surgicalNotes", type: "notes" },
  { id: "symptoms", name: "Symptoms", apiField: "symptoms", type: "notes" },
  { id: "pastHistory", name: "Past History", apiField: "pastHistory", type: "notes" },
  { id: "vitalData", name: "Vitals Data", apiField: "vitalData", type: "notes" },
  { id: "otherData", name: "Other Data", apiField: "otherData", type: "notes" },
];

  return (
    <div className={`w-full relative h-full overflow-y-scroll bg-[#F4F6FA] font-inter py-10`}>

        <div className="flex justify-between items-center gap-x-5  pr-5">
          <div onClick={() => navigate(-1)}  className='w-[5%] '>
            <ChevronLeft size={60} />
          </div>

          <div className="w-[75%] h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4 ">
          <img src="/assets/patients2.svg" className="w-[24px] h-[30px] " />
          <p className="text-[#6F3CDB] font-semibold text-[20px]  ">
            {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
            {patientData?.identityDetails?.patientName ?? "Loading..."}
          </p>
        </div>

        <div className='w-[20%] h-[70px] rounded-[10px] bg-[#FDFDFD] border-[2px] border-[#D8D8D8] flex justify-center items-center gap-x-4 '>

            <p className='font-semibold text-[22px] text-[#282D30] '>Filters</p>
            <SlidersHorizontal color='#282D30' size={20} />

        </div>

        </div>

        <div className="w-full mt-5 pl-5 h-[70px] overflow-x-scroll scrolll flex items-center gap-3">
  {masters.map((master) => (
    <div
      key={master.name} onClick={()=>setSelectedMaster(master.id)}
      className={`inline-flex items-center whitespace-nowrap h-full px-5 rounded-[10px] 
       ${selectedMaster === master.id ? "text-[#FDFDFD] bg-[#6F3CDB] " : "text-[#282D30] bg-[#FDFDFD] border-[2px] border-[#D8D8D8]"}   font-semibold text-[22px] `}
    >
      {master.name}
    </div>
  ))}
</div>
        
     
     {[
  "clinicalNotes",
  "nursingNotes",
  "surgicalNotes",
  "symptoms",
  "pastHistory",
  "vitalData",
  "otherData",
].includes(selectedMaster) && (
  <NotesData
    selectedMaster={selectedMaster}
    masters={masters}
    setSelectedMaster={setSelectedMaster}
  />
)}
    </div>
  )
}

export default DigitalNotes
