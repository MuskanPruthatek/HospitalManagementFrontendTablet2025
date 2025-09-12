import axios from "axios";
import { ChevronDown, ChevronLeft, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
// import CustomDropdown from "../CustomDropdown/CustomDropdown";
import CustomDropdown2 from "../CustomDropdown/CustomDropdown2";
import { usePatient } from "../../context/PatientContext";
import { fetchWithCache } from "../../offline/fetchWithCache";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const MRDChecklist = () => {
    // const initialPatientId = selectedPatient?.patientId ?? null;

    const { selectedPatient, setSelectedPatient } = usePatient();

   const COLOR_PRESETS = [
  "#FFDEDF", "#FFDEFC", '#DEE0FF', '#DEF3FF', '#BCFFD4', '#D2EBD0', '#FEEDB0', '#F6EEFC'
];

    const [colorOpen, setColorOpen] = useState(false)
      const [selectedColor, setSelectedColor] = useState(null); // hex string or null for "All"

    const [patients, setPatients] = useState([]);
    const [patientData, setPatientData] = useState(null);
    const [currentPatientId, setCurrentPatientId] = useState(null);

    const [pdfs, setPdfs] = useState([])

    useEffect(() => {
        const fetchPDFS = (forceOnline = false) =>
            fetchWithCache({
                collection: "pdfs",
                url: `${VITE_APP_SERVER}/api/v1/document-pdf`,
                setItems: setPdfs,
                forceOnline,
            });
        fetchPDFS();
    }, []);

    // 1) Fetch list of patients once
    useEffect(() => {
        const fetchPatients = (forceOnline = false) =>
            fetchWithCache({
                collection: "patients",
                url: `${VITE_APP_SERVER}/api/v1/patient`,
                setItems: setPatients,
                forceOnline,
            });
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

    useEffect(() => {
        if (!currentPatientId) return;
        const fetchPatientsWithId = (forceOnline = false) =>
            fetchWithCache({
                collection: `patientData-${currentPatientId}`, // unique per patient
                url: `${VITE_APP_SERVER}/api/v1/patient/${currentPatientId}`,
                setItems: setPatientData,
                forceOnline,
            });

        fetchPatientsWithId();
    }, [currentPatientId]);

    // Build dropdown options as {label, value}
    const options = useMemo(() => {
        return patients.map((p) => ({
            label: p?.identityDetails?.patientName || "Unnamed",
            value: p?._id,
        }));
    }, [patients]);

    // Normalize hex like "#ffdefc" -> "#FFDEFC"
const normalizeHex = (c) =>
  (typeof c === "string" ? c.trim().toUpperCase() : "").replace(/^#?/, "#");

const filteredPdfs = useMemo(() => {
  if (!selectedColor) return pdfs; // no filter → show all
  const sel = normalizeHex(selectedColor);
  return (pdfs || []).filter((p) => normalizeHex(p?.color) === sel);
}, [pdfs, selectedColor]);

    return (
        <div className="w-full h-full bg-white font-inter ">
            <div className="w-full h-fit py-10 px-5 bg-white ">
                <div className="flex justify-between items-center ">
                    <Link to="/main/patients">
                        <ChevronLeft size={60} />
                    </Link>

                    <div className=" w-[85%] ">
                        <CustomDropdown2
                            label="Select patient"
                            options={options} // [{ label, value }]
                            selected={currentPatientId} // value (id)
                            onChange={(value, option) => {
                                // value=id, option={label,value}
                                setCurrentPatientId(value);
                                const picked = patients.find((p) => p._id === value);
                                setSelectedPatient?.({
                                    patientId: value,
                                    admissionId: selectedPatient?.admissionId ?? null,
                                    identityDetails: {
                                        patientName: picked?.identityDetails?.patientName,
                                    },
                                });
                            }}
                        />
                    </div>
                </div>

                <div className="w-full h-[70px] rounded-[10px] bg-[#F6EEFC] mt-5 flex px-5 items-center gap-x-4 ">
                    <img src="/assets/patients2.svg" className="w-[24px] h-[30px] " />
                    <p className="text-[#6F3CDB] font-semibold text-[20px]  ">
                        {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
                        {patientData?.identityDetails?.patientName ?? "Loading..."}
                    </p>
                </div>



                <div className="flex justify-start items-center mt-7 gap-x-14">


                      <div className="w-[200px] relative h-fit py-3 border bg-white rounded-[10px]">
                     <div onClick={() => setColorOpen(!colorOpen)} className="flex gap-x-2 px-3 cursor-pointer">
                       <p className="text-black font-medium text-[18px]">Color Codes</p>
                       <ChevronDown size={28} className="-mt-0.5" />
                     </div>
                   
                     {colorOpen && (
                       <div className="flex gap-2 absolute z-20 mt-2 p-3 border rounded-[10px] border-t-transparent bg-white flex-row flex-wrap w-full">
                         {/* Clear filter */}
                         <button
                           className={`px-3 h-[50px] rounded-[4px] border text-sm font-medium ${
                             !selectedColor ? "border-[#6F3CDB]" : "border-gray-300"
                           }`}
                           onClick={() => setSelectedColor(null)}
                           title="Show all colors"
                         >
                           Clear
                         </button>
                   
                         {COLOR_PRESETS.map((color) => {
                           const active = selectedColor === color;
                           return (
                             <button
                               key={color}
                               type="button"
                               onClick={() => setSelectedColor(color)}
                               className="relative w-[50px] h-[50px] rounded-[4px] border"
                               style={{
                                 backgroundColor: color,
                                 borderColor: active ? "#6F3CDB" : "rgba(0,0,0,0.1)",
                                 boxShadow: active ? "0 0 0 3px rgba(111,60,219,0.3)" : "none",
                               }}
                               title={color}
                             />
                           );
                         })}
                       </div>
                     )}
                   </div>

                </div>
            </div>

            <div className="w-full px-5 bg-white md:portrait:h-[50vh] md:landscape:h-[5vh] lg:portrait:h-[55vh] lg:landscape:h-[45vh] overflow-y-scroll scrolll">
                <div className="w-full grid grid-cols-2 content-start gap-x-6 gap-y-4 ">
                    
                    
                    {filteredPdfs.map((pdf, index) => {
                        return (

                            <div className="flex flex-col gap-y-2">
                                <div key={pdf._id || index}

                                    style={{ backgroundColor: pdf.color }}
                                    className={`w-full h-[48px]   flex items-center px-5 `}>
                                    <p className="text-black font-semibold text-[16px] ">
                                        {index + 1}. {pdf.pdfName}
                                    </p>
                                </div>

                                {pdf.files.map((file, index) => {
                                    const urlQP = file.pdfUrl ? `?file=${encodeURIComponent(file.pdfUrl)}&name=${encodeURIComponent(file.name)}` : "";
                                    return (
                                        <Link key={file._id || index}
                                            to={`/main/patients/pdf${urlQP}`}
                                            state={{
                                                file: file.fileBlob || file.pdfUrl || null, // Blob/File or URL
                                                name: file.name || "Document",
                                            }} style={{ backgroundColor: pdf.color }} className="w-[95%] h-[40px] self-end flex items-center px-5 opacity-80 ">
                                            <p className="text-black font-semibold text-[14px] "><b className="font-semibold uppercase ">{file.language}</b>-{file.name}</p>
                                        </Link>
                                    )
                                })}

                            </div>

                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default MRDChecklist;
