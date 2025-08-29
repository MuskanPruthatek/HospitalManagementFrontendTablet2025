import React, { useEffect, useMemo, useState } from "react";
import { usePatient } from "../../../context/PatientContext";
import axios from "axios";
import { X } from "lucide-react";
import CustomDropdown4 from "../../CustomDropdown/CustomDropdown4";
import MedicineMaster from "./MedicineMaster";
import InvestigationMaster from "./InvestigationMaster";
import DiagnosisMaster from "./DiagnosisMaster";
import CustomDropdown2 from "../../CustomDropdown/CustomDropdown2";
import NotesPanel from "./NotesPanel";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const PatientEditDocument = () => {
  const { selectedPatient, setSelectedPatient } = usePatient();

  const [patients, setPatients] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);

  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // 1) Fetch list of patients once
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${VITE_APP_SERVER}/api/v1/patient`);
        setPatients(res.data.data || []);
      } catch (err) {
        console.error("Error fetching patients", err);
      }
    };
    fetchPatients();
  }, []);

  // 2) Keep local currentPatientId in sync if parent changes selectedPatient
  useEffect(() => {
    if (
      selectedPatient?.patientId &&
      selectedPatient.patientId !== currentPatientId
    ) {
      setCurrentPatientId(selectedPatient.patientId);
    }
  }, [selectedPatient?.patientId, currentPatientId]); // eslint-disable-line

  // 3) Fetch patient details when currentPatientId changes
  useEffect(() => {
    if (!currentPatientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${currentPatientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [currentPatientId]);

  // Build dropdown options as {label, value}
  const options = useMemo(() => {
    return patients.map((p) => ({
      label: p?.identityDetails?.patientName || "Unnamed",
      value: p?._id,
    }));
  }, [patients]);
  const [tab, setTab] = useState("Investigation");

  const [selectedMaster, setSelectedMaster] = useState("");

const masters = [
  { id: "medicineMaster", name: "Medicine Master", color: "#6F3CDB", icon: "/assets/medicine.svg", type: "module" },
  { id: "investigationMaster", name: "Investigation Master", color: "#36D7A0", icon: "/assets/investigation.svg", type: "module" },
  { id: "diagnosisMaster", name: "Diagnosis Master", color: "#FB8C5C", icon: "/assets/diagnosis.svg", type: "module" },

  // Notes-type masters (all share the same NotesPanel)
  { id: "clinicalNotes", name: "Clinical Notes", apiField: "clinicalNotes", color: "#FB8C5C", icon: "/assets/clinical.svg", type: "notes" },
  { id: "nursingNotes", name: "Nursing Notes", apiField: "nursingNotes", color: "#50B7FF", icon: "/assets/nursing.svg", type: "notes" },
  { id: "surgicalNotes", name: "Surgical Notes", apiField: "surgicalNotes", color: "#F95484", icon: "/assets/surgical.svg", type: "notes" },
  { id: "symptoms", name: "Symptoms", apiField: "symptoms", color: "#693FC5", icon: "/assets/symptoms.svg", type: "notes" },
  { id: "pastHistory", name: "Past History", apiField: "pastHistory", color: "#36D7A0", icon: "/assets/history.svg", type: "notes" },
  { id: "vitalData", name: "Vitals Data", apiField: "vitalData", color: "#50B7FF", icon: "/assets/vitals.svg", type: "notes" },
  { id: "otherData", name: "Other Data", apiField: "otherData", color: "#F95484", icon: "/assets/otherData.svg", type: "notes" },
];

  return (
    <div className="w-full h-full relative font-inter bg-white ">
      <div className="w-full h-[490px] bg-white drop-shadow-lg drop-shadow-[#61616140] p-7 ">
       
         {showPatientSelector && (
          <div className="patientSelector w-full mb-4">
            <CustomDropdown2
              label="Select patient"
              options={options}
              selected={currentPatientId}
              onChange={(value, option) => {
                setCurrentPatientId(value);
                const picked = patients.find((p) => p._id === value);
                setSelectedPatient?.({
                  patientId: value,
                  admissionId: selectedPatient?.admissionId ?? null,
                  identityDetails: {
                    patientName: picked?.identityDetails?.patientName,
                  },
                });
                setShowPatientSelector(false); // 👈 hide after selection
              }}
            />
          </div>
        )}

        <div onClick={() => setShowPatientSelector(!showPatientSelector)} className="patientTab w-full h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4 ">
          <img src="/assets/patients2.svg" className="w-[24px] h-[30px] " />
          <p className="text-[#6F3CDB] font-semibold text-[20px]  ">
            {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
            {patientData?.identityDetails?.patientName ?? "Loading..."}
          </p>
        </div>

        <div className="w-full h-[70px] rounded-[10px] bg-[#FFF7F2] flex px-5 items-center gap-x-4 mt-3 ">
          <img src="/assets/consultant.svg" className="w-[19px] h-[23px] " />
          <p className="text-[#FB8C5C] font-semibold text-[20px]  ">
            Consultant:
          </p>
        </div>

        <div className="w-full flex gap-x-3 items-center mt-6 ">
          <p className="font-bold text-[20px] text-black">Text size: </p>

          <div className="w-[98px] ">
            <input className="input2 " />
          </div>

          <p className="font-bold text-[20px] underline text-[#50B7FF] ">
            Get From Form text
          </p>
        </div>

        <div className="w-full h-[65px] rounded-[10px] bg-[#F4F4F4] mt-3 flex items-center p-1.5 ">
          <div
            onClick={() => setTab("Investigation")}
            className={`w-[50%] h-full flex justify-center items-center ${
              tab === "Investigation"
                ? "bg-[#FDFDFD]  drop-shadow-lg drop-shadow-[#D4D3D340] rounded-[5px]"
                : "bg-transparent "
            }  `}
          >
            <p className="font-medium text-[20px] text-[#282D30] ">
              Investigation
            </p>
          </div>

          <div
            onClick={() => setTab("Inspection")}
            className={`w-[50%] h-full flex justify-center items-center ${
              tab === "Inspection"
                ? "bg-[#FDFDFD]  drop-shadow-lg drop-shadow-[#D4D3D340] rounded-[5px]"
                : "bg-transparent "
            }  `}
          >
            <p className="font-medium text-[20px] text-[#282D30] ">
              Inspection
            </p>
          </div>
        </div>

      {tab === "Investigation" &&  <div className="w-full h-[70px] mt-3 flex items-center gap-x-5">
          <button className="w-[50%] h-full bg-[#6F3CDB] rounded-[14px] text-[22px] font-semibold text-[#fdfdfd] ">
            Save Investigation
          </button>

          <button className="w-[50%] h-full bg-[#FB8C5C] rounded-[14px] text-[22px] font-semibold text-[#fdfdfd] ">
            Add New Investigation
          </button>
        </div> }

        {tab === "Inspection" &&  <div className="w-full h-[70px] mt-3 flex items-center gap-x-5">
          <button className="w-[50%] h-full bg-[#6F3CDB] rounded-[14px] text-[22px] font-semibold text-[#fdfdfd] ">
            Save Inspection
          </button>

          <button className="w-[50%] h-full bg-[#FB8C5C] rounded-[14px] text-[22px] font-semibold text-[#fdfdfd] ">
            Add New Inspection
          </button>
        </div> }
      </div>

      <div className="w-full relative bg-blue-200 portrait:h-[60%] md:landscape:h-[40%] lg:landscape:h-[50%] overflow-y-scroll scrolll">
        <div
          className="w-[90%] h-[150px] absolute overflow-x-scroll scrolll  bottom-5 left-1/2 -translate-x-1/2 px-8 flex items-center justify-between gap-x-9
                bg-[#FDFDFD] border border-[#D8D8D8] border-r-[22px] rounded-[20px] drop-shadow-lg drop-shadow-[#69696940] "
        >
          {masters.map((master, index) => {
            return (
              <div
                key={index} 
                onClick={() => setSelectedMaster(master.id)}
                className={`flex flex-col items-center gap-y-4 ${
                  master.name === "Symptoms" ? "-mt-4" : "-mt-0"
                } `}
              >
                <div style={{ backgroundColor: master.color }}
                  className={`w-[62px] h-[62px] rounded-full bg-[${master.color}] flex justify-center items-center `}
                >
                  <img src={master.icon} />
                </div>

                <p className="font-semibold text-[14px] text-[#282D30] text-center leading-4 ">
                  {master.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {selectedMaster === "medicineMaster" && <MedicineMaster setSelectedMaster={setSelectedMaster} />}
{selectedMaster === "investigationMaster" && <InvestigationMaster setSelectedMaster={setSelectedMaster} />}
{selectedMaster === "diagnosisMaster" && <DiagnosisMaster setSelectedMaster={setSelectedMaster} />}

{[
  "clinicalNotes",
  "nursingNotes",
  "surgicalNotes",
  "symptoms",
  "pastHistory",
  "vitalData",
  "otherData",
].includes(selectedMaster) && (
  <NotesPanel
    selectedMaster={selectedMaster}
    masters={masters}
    setSelectedMaster={setSelectedMaster}
  />
)}
    </div>
  );
};

export default PatientEditDocument;
