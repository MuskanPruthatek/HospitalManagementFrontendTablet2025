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

const PatientDetails = () => {
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


  const groupedByColor = useMemo(() => {
  // Initialize a map with all preset colors
  const map = new Map(COLOR_PRESETS.map((c) => [c, []]));
  // Place each pdf into the right color bucket; fallback to #000000 if unknown
  (pdfs || []).forEach((pdf) => {
    const c = COLOR_PRESETS.includes(pdf?.color) ? pdf.color : "#000000";
    if (!map.has(c)) map.set(c, []); // safety
    map.get(c).push(pdf);
  });
  return map;
}, [pdfs]);


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

        <div className="flex justify-center items-center mt-5 gap-x-5">
          <button className="w-[50%] h-[70px] rounded-[14px] bg-[#6F3CDB] text-[#FDFDFD] font-semibold text-[22px] ">
            Offline Bin
          </button>

          <button className="w-[50%] h-[70px] rounded-[14px] bg-[#36D7A0] text-[#FDFDFD] font-semibold text-[22px] ">
            Discard Bin
          </button>

          <button className="w-[50%] h-[70px] rounded-[14px] bg-[#ED1F22] text-[#FDFDFD] font-semibold text-[22px] ">
            Recycle Bin
          </button>
        </div>

        <div className="flex justify-start items-center mt-7 gap-x-14">
          <Link className="underline text-[#FB8C5C] font-semibold text-[24px] ">
            Admission Form
          </Link>
          <Link to="/main/patients/mrd-checklist" className="underline text-[#FB8C5C] font-semibold text-[24px] ">
            MRD Checklist
          </Link>

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
       <div className="w-full grid grid-cols-2 content-start gap-x-6 gap-y-4">
  {(selectedColor ? [selectedColor] : COLOR_PRESETS).map((colorKey) => {
    const bucket = groupedByColor.get(colorKey) || [];
    if (!bucket.length) return null;

    return (
      <React.Fragment key={colorKey}>
        

        {bucket.map((pdf, idx) => (
          <div key={pdf._id || `${colorKey}-${idx}`} className="flex flex-col gap-y-2">
            <div
              style={{ backgroundColor: pdf.color }}
              className="w-full h-[48px] flex items-center px-5"
            >
              <p className="text-black font-semibold text-[16px]">
                {pdf.pdfName}
              </p>
            </div>

            {Array.isArray(pdf.files) &&
              pdf.files.map((file, fIdx) => {
                const urlQP = file.pdfUrl
                  ? `?file=${encodeURIComponent(file.pdfUrl)}&name=${encodeURIComponent(file.name)}`
                  : "";
                return (
                  <Link
                    key={file._id || `${pdf._id || idx}-f-${fIdx}`}
                    to={`/main/patients/pdf${urlQP}`}
                    state={{
                      file: file.fileBlob || file.pdfUrl || null,
                      name: file.name || "Document",
                    }}
                    style={{ backgroundColor: pdf.color }}
                    className="w-[95%] h-[40px] self-end flex items-center px-5 opacity-80"
                  >
                    <p className="text-black font-semibold text-[14px]">
                      <b className="font-semibold uppercase">{file.language}</b>-{file.name}
                    </p>
                  </Link>
                );
              })}
          </div>
        ))}
      </React.Fragment>
    );
  })}
</div>


        <div className="w-full flex gap-6 mt-5">
          <div className="w-[50%] lg:h-[140px] md:h-[170px] rounded-[14px] px-5 border-[2px] border-[#50B7FF] bg-[#FDFDFD] flex justify-center items-center gap-x-4 ">
            <img src="/assets/upload.svg" className=" " />

            <div className="flex flex-col gap-y-3 ">
              <p className="font-semibold text-[24px] text-black ">
                Gallery Documents
              </p>

              <div className="flex flex-row flex-wrap gap-y-3 gap-x-5">
                <p className="font-semibold text-[18px] text-[#6F3CDB] ">
                  Lab Reports(78)
                </p>
                <p className="font-semibold text-[18px] text-[#FB8C5C] ">
                  Other Docs(78)
                </p>
                <p className="font-semibold text-[18px] text-[#6F3CDB] ">
                  Bills(1)
                </p>
                <p className="font-semibold text-[18px] text-[#F95484] ">
                  Audio(78)
                </p>
                <p className="font-semibold text-[18px] text-[#36D7A0] ">
                  Video(8)
                </p>
              </div>
            </div>
          </div>

          <div className="w-[50%] flex gap-x-6 ">
            <Link
              to="/main/patients/other-documents"
              className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#6F3CDB] flex lg:flex-row md:flex-col justify-center items-center "
            >
              <img
                src="/assets/otherDoc.svg"
                className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
              />
              <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
                Other <br></br>Documents
              </p>
            </Link>

            <Link
              to="/main/patients/lab-reports" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#FB8C5C] flex lg:flex-row md:flex-col justify-center items-center ">
              <img
                src="/assets/labReports.svg"
                className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
              />
              <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
                Laboratory <br></br>Report
              </p>
            </Link>
          </div>
        </div>

        <div className="w-full flex gap-x-6 mt-6">
          <Link
            to="/main/patients/radiology-reports" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#36D7A0] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/radiologyReports.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Radiology <br></br>Reports
            </p>
          </Link>

          <Link
            to="/main/patients/video-reports" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#F95484] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/vidRecords.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Video <br></br>Records
            </p>
          </Link>

          <Link
            to="/main/patients/audio-reports" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#50B7FF] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/audioReports.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Audio <br></br>Reports
            </p>
          </Link>

          <div className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#6F3CDB] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/billReports.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Bill <br></br>Reports
            </p>
          </div>
        </div>

        <div className="w-full flex gap-x-6 mt-6">
          <div className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#FB8C5C] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/otherDoc.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Clinical <br></br>Scale Type
            </p>
          </div>

          <Link
            to="/main/patients/operative-notes" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#6F3CDB] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/opNotes.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Operative <br></br>Notes
            </p>
          </Link>

          <Link to="/main/patients/discharge-summary" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#F95484] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/otherDoc.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Discharge <br></br>Summary
            </p>
          </Link>

          <Link to="/main/patients/digital-notes" className="w-[50%] lg:h-[140px] md:h-[170px] gap-x-5 gap-y-3 rounded-[14px] bg-[#50B7FF] flex lg:flex-row md:flex-col justify-center items-center ">
            <img
              src="/assets/digitalNotes.svg"
              className="lg:w-[55px] lg:h-[55px] md:w-[40px] md:h-[40px] "
            />
            <p className="font-semibold text-[24px] text-[#FDFDFD] md:text-center lg:text-start ">
              Digital <br></br>Notes
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
