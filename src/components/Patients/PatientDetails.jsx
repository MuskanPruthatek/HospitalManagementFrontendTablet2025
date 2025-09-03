import axios from "axios";
import { ChevronLeft, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
// import CustomDropdown from "../CustomDropdown/CustomDropdown";
import CustomDropdown2 from "../CustomDropdown/CustomDropdown2";
import { usePatient } from "../../context/PatientContext";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const PatientDetails = () => {
  // const initialPatientId = selectedPatient?.patientId ?? null;

  const { selectedPatient, setSelectedPatient } = usePatient();

  const [patients, setPatients] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);

  

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
          <Link className="underline text-[#FB8C5C] font-semibold text-[24px] ">
            MRD Checklist
          </Link>
        </div>
      </div>

      <div className="w-full px-5 bg-white md:portrait:h-[50vh] md:landscape:h-[5vh] lg:portrait:h-[55vh] lg:landscape:h-[45vh] overflow-y-scroll">
        <div className="w-full grid grid-cols-2 content-start gap-x-6 gap-y-4 ">
          <div className="w-full h-[48px] bg-[#FFF7F2] flex items-center px-5 ">
            <p className="text-black font-semibold text-[20px] ">
              0.First floor Semi-special room{" "}
            </p>
          </div>

          <div className="w-full h-[48px] bg-[#F6EEFC] flex items-center px-5 ">
            <p className="text-black font-semibold text-[20px] ">
              0.First floor Semi-special room{" "}
            </p>
          </div>

          <div className="w-full h-[48px] bg-[#EEFCFC] flex items-center px-5 ">
            <p className="text-black font-semibold text-[20px] ">
              0.First floor Semi-special room{" "}
            </p>
          </div>

          <div className="w-full h-[48px] bg-[#FFF7F2] flex items-center px-5 ">
            <p className="text-black font-semibold text-[20px] ">
              0.First floor Semi-special room{" "}
            </p>
          </div>
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
