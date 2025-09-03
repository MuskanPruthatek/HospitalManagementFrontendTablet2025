import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, RefreshCcw, Search, X } from "lucide-react";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import axios from "axios"
import { filterPatients } from "./Helpers/patientFilters";
import { getLatestAdmission } from "./Helpers/getLatestAdmission"
import { Link } from "react-router-dom";
import { usePatient } from "../../context/PatientContext";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import { loadCache, saveCache } from "../../offline/cache";
import { isOnline } from "../../offline/helpers";
import { fetchWithCache } from "../../offline/fetchWithCache";

const Patients = () => {

  const { setSelectedPatient } = usePatient();

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [patients, setPatients] = useState([]);
  const [patientsUpdatedAt, setPatientsUpdatedAt] = useState(0);

  const [admissionReasons, setAdmissionReasons] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [filterForm, setFilterForm] = useState({ 
    selectedPaymentMode: "",  
    selectedConsultant: "",
    selectedAdmissionReason: "",
    admissionDate: "",
  });

useEffect(() => {
    // Try online → cache; if it fails or offline → show cached
    fetchPatients();
    fetchAdmissionReasons();
    fetchDoctors();

    // Optional: when internet comes back, refresh lists automatically
    const onBackOnline = () => {
      fetchPatients(true);
      fetchAdmissionReasons(true);
      fetchDoctors(true);
    };
    window.addEventListener('online', onBackOnline);
    return () => window.removeEventListener('online', onBackOnline);
  }, []);

  const fetchPatients = (forceOnline = false) =>
  fetchWithCache({
    collection: "patients",
    url: `${VITE_APP_SERVER}/api/v1/patient`,
    setItems: setPatients,
    setUpdatedAt: setPatientsUpdatedAt,
    forceOnline,
    setLoading,              
  });

const fetchAdmissionReasons = (forceOnline = false) =>
  fetchWithCache({
    collection: "admissionReasons",
    url: `${VITE_APP_SERVER}/api/v1/admission-reason`,
    setItems: setAdmissionReasons,
    forceOnline,
  });

const fetchDoctors = (forceOnline = false) =>
  fetchWithCache({
    collection: "doctors",
    url: `${VITE_APP_SERVER}/api/v1/doctor-master`,
    setItems: setDoctors,
    forceOnline,
  });


  // put this above your return
  const handleChange = (payload) => {
    // case 1 – native input event --------------------------
    if (payload?.target) {
      const { name, type, value, checked } = payload.target;
      setFilterForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      return;
    }

    // case 2 – object literal from a CustomDropdown --------
    if (payload && typeof payload === "object") {
      setFilterForm((prev) => ({ ...prev, ...payload }));
    }
  };

  // turn the raw API objects into arrays of plain strings
  const admissionReasonOptions = useMemo(
    () => admissionReasons.map((r) => r.admissionReason),
    [admissionReasons]
  );

  const doctorOptions = useMemo(
    () => doctors.map((d) => d.doctorName),
    [doctors]
  );

  const setFilter = (key, value) =>
    setFilterForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setFilterForm({
      selectedPaymentMode: "",
      selectedConsultant: "",     
      selectedAdmissionReason: "",
      admissionDate: "",
    });
  };

  const patientsWithLatest = useMemo(
  () => patients.map(p => ({ ...p, latestAdmission: getLatestAdmission(p.admissionDetails) })),
  [patients]
);

// Then pass this into your filter instead of raw `patients`
const filtered = filterPatients(patientsWithLatest, filterForm, searchTerm);
const fullCount = filtered.length;  

  const deletePatient = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this patient?");
    if (!ok) return;

    try {
      const res = await axios.delete(`${VITE_APP_SERVER}/api/v1/patient/${id}`);
      alert(res.data.message);
      await fetchPatients();
    } catch (err) {
      console.error("Delete failed", err);
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateWrapRef = useRef(null);

  // close when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!dateWrapRef.current) return;
      if (!dateWrapRef.current.contains(e.target)) setShowDatePicker(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // optional: ensure we always store YYYY-MM-DD
  const onDateChange = (e) => {
    const val = e.target.value; // already "YYYY-MM-DD" from <input type="date">
    setFilter("admissionDate", val);
  };

  const refreshPage = () => {
     window.location.reload()
  }

  return (
    <div className="w-full h-full bg-[#F4F6FA] font-inter ">
      <div className="w-full h-fit py-10 px-5 bg-[#FDFDFD] flex justify-between items-center ">
        <div className="flex flex-col gap-y-4 font-semibold text-[24px]  ">
          <p className="text-[#6F3CDB] ">Uploaded: 4</p>
          <p className="text-[#FB8C5C]">Un-uploaded: 5</p>
        </div>

        <div className="flex flex-col gap-y-1 items-center  ">
          <p className="font-semibold text-[36px] text-[#282D30] ">Patients</p>
          <p className={` ${navigator.onLine ? "text-[#0CB001]" : "text-[#ED1F22]"}  font-semibold lg:text-[26px] md:text-[24px] `}>{navigator.onLine ? "Online" : "Offline"}</p> 
        </div>

        <div className="flex flex-col gap-y-2 items-end  ">
          <button onClick={refreshPage} className="w-fit flex justify-center items-center px-3 h-[50px] gap-x-2 rounded-[10px] bg-[#6F3CDB] text-[#FDFDFD] font-semibold text-[18px] cursor-pointer ">
            <RefreshCcw />
            <p>Refresh</p>
          </button>

          <p className={`font-semibold text-[22px] text-end ${navigator.onLine ? "text-[#0CB001]" : "text-[#ED1F22]"} `}>
            {navigator.onLine ? "Online Mode" : "Offline Mode"} <br></br>
            <b className="text-[#282D30] font-semibold ">Patient Count:</b>{fullCount}
          </p>
        </div>
      </div>

      <div className="w-full px-5 mt-5  ">
        <div className="w-full grid grid-cols-4 gap-4  ">
         
          <CustomDropdown
          label="All Consultants" 
                options={doctorOptions}
                selected={filterForm.selectedConsultant}
                onChange={(label) => setFilter("selectedConsultant", label)}
              />
          <CustomDropdown label="Other Consultants" />
         <CustomDropdown
                label="Admission Type"
                options={admissionReasonOptions}
                selected={filterForm.selectedAdmissionReason}
                onChange={(label) =>
                  setFilter("selectedAdmissionReason", label)
                }
              />
        
          <CustomDropdown label="Payment Type"
                  options={[
                    "All",
                    "Cash",
                    "TPA",
                    "Insurance",
                    "Scheme",
                    "Corporate",
                    "Reimbursement",
                  ]}
                  selected={filterForm.selectedPaymentMode}
                  onChange={(label) =>
                    handleChange({ selectedPaymentMode: label })
                  }
                />
        </div>

        <div className="w-full mt-3 flex items-center gap-x-4">

          <div className="relative w-[85%] h-[50px]">
            {/* Search icon on left */}
            <Search
              color="#A3A8B5"
              size={20}
              className="absolute top-3.5 left-3"
            />

            {/* Input field */}
            <input
              placeholder="Search here..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#FDFDFD] w-full h-full pl-10 pr-8 placeholder:text-[#A3A8B5] rounded-[10px] border-[2px] border-[#C4C8D2] 
              focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-300"
            />

            {/* Clear (X) icon on right, only shown when input has text */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute top-3 right-5 w-[24px] h-[24px] rounded-[5px] flex justify-center items-center 
                border-[1.5px] border-[#C4C8D2] text-[#C4C8D2] hover:text-[#6F3CDB] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div ref={dateWrapRef} className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker((s) => !s)}
              className="w-[50px] h-[50px] bg-[#6F3CDB] rounded-[14px] flex justify-center items-center text-[#FDFDFD] focus:outline-none focus:ring-2 focus:ring-purple-300"
              aria-haspopup="dialog"
              aria-expanded={showDatePicker}
              aria-label="Filter by date"
            >
              <CalendarDays size={24} />
            </button>

            {showDatePicker && (
              <div className="absolute z-50 mt-2 right-0 w-[240px] rounded-xl border border-[#E5E7EB] bg-white shadow-lg p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission date
                </label>

                <input
                  type="date"
                  value={filterForm.admissionDate || ""}
                  onChange={onDateChange}
                  className="w-full h-10 rounded-md border border-[#C4C8D2] px-3 outline-none focus:ring-2 focus:ring-purple-300"
                />

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setFilter("admissionDate", "")}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear date
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 h-9 rounded-md bg-[#6F3CDB] text-white text-sm font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div onClick={reset} className="w-[50px] h-[50px] bg-[#FB8C5C] rounded-[14px] flex justify-center items-center text-[#FDFDFD] ">
            <RefreshCcw size={24} />
          </div>

        </div>
      </div>

      <div className="w-full px-5 mt-10 flex flex-col gap-y-20 md:portrait:h-[50vh] md:landscape:h-[5vh] lg:portrait:h-[55vh] lg:landscape:h-[45vh]   overflow-y-scroll">

        {filtered.map((patient, index)=>{
          const latest = patient.latestAdmission || patient.admissionDetails?.[0];
          return(       

        
        <Link to={`/main/patients/patient-details`} 
        onClick={() => setSelectedPatient({ patientId: patient._id, admissionId: latest?._id ?? null })} key={index} 
        className="w-full h-fit relative rounded-[20px] py-3 pl-10 pr-3 bg-[#FDFDFD] border border-transparent flex items-center gap-x-6 ">

           <div className="lg:w-[190px] lg:h-[190px] md:w-[150px] md:h-[150px] rounded-full bg-blue-300 shrink-0 ">
              <img src={latest?.patientPhoto} className="w-full h-full rounded-full object-cover "/>
           </div>

           <div className="w-full">

            <div className="flex w-full justify-between items-center ">
              <p className="font-semibold lg:text-[20px] md:text-[18px] text-[#6F3CDB] ">IPD no: {latest?.ipdNo || "-"}</p>
              <p className="font-semibold lg:text-[20px] md:text-[18px] text-[#6F3CDB] ">UHID no: {patient.identityDetails?.uhidNo || "-"}</p>

              <div className="w-fit h-[48px] rounded-[24px] bg-[#F95484] px-5 flex justify-center items-center ">
               <p className="font-semibold lg:text-[20px] md:text-[18px] text-white ">{latest?.mlcType === true ? "MLC" : "Normal" || "-"}</p>  
              </div>

            </div>

            <div className="flex w-full justify-between items-center ">

              <div className="w-[50%] ">
              <p className="font-bold lg:text-[26px] md:text-[24px] text-[#282D30] ">{patient.identityDetails?.salutation} {patient.identityDetails?.patientName || "-"}</p>
              <div className="w-full flex flex-row flex-wrap gap-x-3 ">
              <p className="font-bold text-[#50B7FF] lg:text-[20px] md:text-[18px] ">Dr. {latest?.consultingDoctorId.doctorName || "-"} </p>
              <p className="font-medium lg:text-[20px] md:text-[18px] text-[#A1A3B2] ">Medical Management</p>
              </div> 

              <p className="font-semibold text-[21px] text-[#FB8C5C] ">{latest?.floorId?.floorName || "-"} [{latest?.bedId?.bedName || "-"}]</p>

              <div className="w-full flex flex-row flex-wrap gap-3 mt-2 items-center ">
                <div className="w-fit px-5 h-[50px] rounded-[10px] bg-[#F6EEFC] flex justify-center items-center ">
                     <p className="font-extrabold lg:text-[26px] md:text-[24px] text-[#6F3CDB] ">{latest?.bedId?.bedName || "-"}</p>
                </div>

                <p className="font-semibold lg:text-[20px] md:text-[18px] text-[#ED1F22] ">3 Days 11 hrs 21 min</p>
              </div>


              </div>

              <div className="w-[50%] flex flex-row flex-wrap gap-4 justify-end ">

                <div  onClick={(e) => {
        e.stopPropagation(); // prevent parent Link click
        e.preventDefault();  // stop redirect to details
        setSelectedPatient({ patientId: patient._id, admissionId: latest?._id ?? null });
        // redirect to edit page
        window.location.href = `/main/patients/edit-patient`;
      }} className="lg:w-[100px] lg:h-[100px] md:w-[70px] md:h-[70px] rounded-full bg-[#6F3CDB] flex justify-center items-center ">
                   <img src="/assets/editPatient.svg" className="lg:w-[40px] lg:h-[40px] md:w-[30px] md:h-[30px] "/>
                </div>

                  <div className="lg:w-[100px] lg:h-[100px] relative md:w-[70px] md:h-[70px] rounded-full bg-[#FB8C5C] flex justify-center items-center ">
                    <div className="lg:w-[38px] lg:h-[38px] md:w-[26px] md:h-[26px] absolute lg:-right-1 lg:-top-2 
                    md:right-0 md:-top-1 rounded-full bg-[#ED1F22] border-[4px] border-[#FDFDFD] flex justify-center items-center ">
                      <p className="font-bold lg:text-[18px] md:text-[12px] text-white ">1</p>
                    </div>
                    <img src="/assets/folder.svg" className="lg:w-[40px] lg:h-[40px] md:w-[30px] md:h-[30px] "/>
                </div>

                  <div className="lg:w-[100px] lg:h-[100px] relative md:w-[70px] md:h-[70px] rounded-full bg-[#50B7FF] flex justify-center items-center ">
                     <div className="lg:w-[38px] lg:h-[38px] md:w-[26px] md:h-[26px] absolute lg:-right-1 lg:-top-2 
                    md:right-0 md:-top-1 rounded-full bg-[#ED1F22] border-[4px] border-[#FDFDFD] flex justify-center items-center ">
                      <p className="font-bold lg:text-[18px] md:text-[12px] text-white ">1</p>
                    </div>
                     <img src="/assets/lab.svg" className="lg:w-[40px] lg:h-[40px] md:w-[30px] md:h-[30px] "/>
                </div>

              </div>

            </div>

           </div>


           <div className="w-[95%] h-[60px] bg-[#6F3CDB] left-1/2 -translate-x-1/2 px-8 absolute -bottom-15 rounded-b-[30px] flex justify-between items-center ">
               <p className="font-semibold lg:text-[20px] md:text-[16px] text-white ">Discharge Summery Ready For Mr. Xyz </p>
               <p className="font-semibold lg:text-[20px] md:text-[16px] text-white ">Billing Discharge at 25-07-2025 </p>
           </div>

        </Link>

        )
        })}

      </div>
    </div>
  );
};

export default Patients;
