import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, RefreshCcw, Search, X } from "lucide-react";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import axios from "axios";
import { resolveWardName, resolveFloorName } from "./Helpers/resolveName";
import ExchangeBeds from "./ExchangeBeds";
import AssignBed from "./AssignBed";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import { loadCache, saveCache } from "../../offline/cache";
import { isOnline } from "../../offline/helpers";
import { fetchWithCache } from "../../offline/fetchWithCache";
import OfflineQueueStatus from "../../offline/OfflineQueueStatus";


const Beds = () => {
  const [selectedType, setSelectedType] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [floors, setFloors] = useState([]);

  const [beds, setBeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [wards, setWards] = useState([]);

  const fetchFloors = (forceOnline = false) =>
    fetchWithCache({
      collection: "floors",
      url: `${VITE_APP_SERVER}/api/v1/hospital-master/floor-master`,
      setItems: (rows) => setFloors((rows || []).map(f => f.floorName)),
      forceOnline,
    });

    const fetchWards = (forceOnline = false) =>
    fetchWithCache({
      collection: "wards",
      url: `${VITE_APP_SERVER}/api/v1/hospital-master/ward-master`,
      setItems: (rows) => setWards((rows || []).map(w => w.wardName)),
      forceOnline,
    });

  const fetchBeds = (forceOnline = false) =>
    fetchWithCache({
      collection: "beds",
      url: `${VITE_APP_SERVER}/api/v1/hospital-master/bed-master/info`,
      setItems: setBeds,
      forceOnline,
    });

   useEffect(() => {
    // Try online → cache; if it fails or offline → show cached
    fetchBeds();
    fetchWards();
    fetchFloors()
   
    // Optional: when internet comes back, refresh lists automatically
    const onBackOnline = () => {
      fetchBeds(true);    
      fetchWards(true)  
      fetchFloors(true)
   
    };
    window.addEventListener('online', onBackOnline);
    return () => window.removeEventListener('online', onBackOnline);
  }, []);

const displayBeds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return beds.filter((bed) => {
      const floorName = bed?.floorId?.floorName || "";
      const wardName = bed?.wardId?.wardName || "";
      const bedName = bed?.bedName || "";
      const status = bed?.bedStatus || "";

      // type filter
      if (selectedType && status !== selectedType) return false;

      // floor filter
      if (selectedFloor && floorName !== selectedFloor) return false;

      // ward filter
      if (selectedWard && wardName !== selectedWard) return false;

      // search filter (by bed, floor, ward)
      if (term) {
        const hay =
          `${bedName} ${floorName} ${wardName}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }

      return true;
    });
  }, [beds, selectedType, selectedFloor, selectedWard, searchTerm]);

  // const [showDatePicker, setShowDatePicker] = useState(false);
  // const dateWrapRef = useRef(null);

  // // close when clicking outside
  // useEffect(() => {
  //   const onDocClick = (e) => {
  //     if (!dateWrapRef.current) return;
  //     if (!dateWrapRef.current.contains(e.target)) setShowDatePicker(false);
  //   };
  //   document.addEventListener("mousedown", onDocClick);
  //   return () => document.removeEventListener("mousedown", onDocClick);
  // }, []);

  // // optional: ensure we always store YYYY-MM-DD
  // const onDateChange = (e) => {
  //   const val = e.target.value; // already "YYYY-MM-DD" from <input type="date">
  //   setFilter("admissionDate", val);
  // };

  const reset = () => {
     setSelectedFloor("")
     setSelectedWard("")
     setSelectedType("")
     setSearchTerm("")
  };

  const fullCount = displayBeds.length;
    const refreshPage = () => {
     window.location.reload()
  }

    const [openExchangeBedForm, setOpenExchangeBedForm] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);

  const [openAssignBedForm, setOpenAssignBedForm] = useState(false);
  const [selectedBed2, setSelectedBed2] = useState(null)

const openExchangeForBed = (bed) => {
  if (!bed?.occupiedBy?.patientId) {
    alert("This bed has no admitted patient to exchange.");
    return;
  }
  setSelectedBed(bed);
  setOpenExchangeBedForm(true);
};

const openAssignBed = (bed) => {
  setSelectedBed2(bed);
  setOpenAssignBedForm(true);
};

const refreshBeds = async () => {
    await fetchBeds();
  };

    // const { queued, uploaded } = useQueueCounts(["bedAssign", "bedExchange"]);

  return (
    <div className="w-full h-full bg-[#F4F6FA] font-inter relative">
      <div className="w-full h-fit py-10 px-5 bg-[#FDFDFD] flex justify-between items-center ">
        <div className="flex flex-col gap-y-4 font-semibold text-[24px]  ">
           {/* <p className="text-[#6F3CDB]">Uploaded: {uploaded.total}</p>
          <p className="text-[#FB8C5C]">Un-uploaded: {queued.total}</p> */}
           <OfflineQueueStatus />
        </div>

         <div className="flex flex-col gap-y-1 items-center  ">
          <p className="font-semibold text-[36px] text-[#282D30] ">Beds</p>
          <p className={` ${navigator.onLine ? "text-[#0CB001]" : "text-[#ED1F22]"}  font-semibold lg:text-[26px] md:text-[24px] `}>{navigator.onLine ? "Online" : "Offline"}</p> 
        </div>

        <div className="flex flex-col gap-y-2 items-end  ">
          <button onClick={refreshPage} className="w-fit flex justify-center items-center px-3 h-[50px] gap-x-2 rounded-[10px] bg-[#6F3CDB] text-[#FDFDFD] font-semibold text-[18px] cursor-pointer ">
            <RefreshCcw />
            <p>Refresh</p>
          </button>

           <p className={`font-semibold text-[22px] text-end ${navigator.onLine ? "text-[#0CB001]" : "text-[#ED1F22]"} `}>
            {navigator.onLine ? "Online Mode" : "Offline Mode"} <br></br>
            <b className="text-[#282D30] font-semibold ">Bed Count:</b>{fullCount}
          </p>
        </div>
      </div>

      <div className="w-full px-5 mt-5  ">
        <div className="w-full grid grid-cols-4 gap-4  ">
          <CustomDropdown
            label="Type"
            options={["Vacant", "Occupied", "Under Maintenance", "Temperory Unavailable"]}
            selected={selectedType}
            onChange={setSelectedType}
          />

           <CustomDropdown
            label="Floor"
            options={floors}
            selected={selectedFloor}
            onChange={setSelectedFloor}
          />

          <CustomDropdown
            label="Ward"
            options={wards}
            selected={selectedWard}
            onChange={setSelectedWard}
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

          {/* <div ref={dateWrapRef} className="relative">
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
          </div> */}

          <div
            onClick={reset}
            className="w-[50px] h-[50px] bg-[#FB8C5C] rounded-[14px] flex justify-center items-center text-[#FDFDFD] "
          >
            <RefreshCcw size={24} />
          </div>
        </div>
      </div>

      <div className="w-full px-5 mt-10 flex flex-col gap-y-10 md:portrait:h-[50vh] md:landscape:h-[5vh] lg:portrait:h-[55vh] lg:landscape:h-[45vh] overflow-y-scroll">
        <div className="">
          <p className="font-semibold text-[22px] font-inter text-[#282D30] ">
            Available Beds
          </p>

          <div className="w-full flex flex-wrap gap-x-3 gap-y-4 mt-5">
            {displayBeds
              .filter((bed) => bed.bedStatus === "Vacant")
              .map((bed, index) => {
                return (
                  <div onClick={() => openAssignBed(bed)} className="w-[176px] h-[201px] rounded-[10px] flex flex-col justify-center items-center bg-[#EEFCFC] border border-[#36D7A0] drop-shadow-lg drop-shadow-[#0000000F] ">
                    <img src="/assets/AvailableBed.svg" className="w-[60px] h-[41px] "/>
                    <p className="font-black text-[24px] font-inter text-[#36D7A0] ">
                      {bed.bedName}
                    </p>
                    <p className="font-bold text-[18px] font-inter text-[#282D30] ">
                      {bed.wardId?.wardName}
                    </p>
                    <p className="font-semibold text-[16px] font-inter text-[#282D30] text-center ">
                     {bed.floorId?.floorName}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="">
          <p className="font-semibold text-[22px] font-inter text-[#282D30] ">
           Temperory Unavailable
          </p>

          <div className="w-full flex flex-wrap gap-x-3 gap-y-4 mt-5">
            {displayBeds
              .filter((bed) => bed.bedStatus === "Temperory Unavailable")
              .map((bed, index) => {
                return (
                  <div className="w-[176px] h-[201px] rounded-[10px] flex flex-col justify-center items-center bg-[#FFF7F2] border border-[#FB8C5C] drop-shadow-lg drop-shadow-[#0000000F] ">
                    <img src="/assets/UnavailableBed.svg" className="w-[60px] h-[41px] "/>
                    <p className="font-black text-[24px] font-inter text-[#FB8C5C] ">
                      {bed.bedName}
                    </p>
                    <p className="font-bold text-[18px] font-inter text-[#282D30] ">
                      {bed.wardId?.wardName}
                    </p>
                    <p className="font-semibold text-[16px] font-inter text-[#282D30] text-center ">
                     {bed.floorId?.floorName}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="">
          <p className="font-semibold text-[22px] font-inter text-[#282D30] ">
          Under Maintenance
          </p>

          <div className="w-full flex flex-wrap gap-x-3 gap-y-4 mt-5">
            {displayBeds
              .filter((bed) => bed.bedStatus === "Under Maintenance")
              .map((bed, index) => {
                return (
                  <div className="w-[176px] h-[201px] rounded-[10px] flex flex-col justify-center items-center bg-[#F5F5F5] border border-[#A1A3B2] drop-shadow-lg drop-shadow-[#0000000F] ">
                    <img src="/assets/MaintenanceBed.svg" className="w-[60px] h-[41px] "/>
                    <p className="font-black text-[24px] font-inter text-[#A1A3B2] ">
                      {bed.bedName}
                    </p>
                    <p className="font-bold text-[18px] font-inter text-[#282D30] ">
                      {bed.wardId?.wardName}
                    </p>
                    <p className="font-semibold text-[16px] font-inter text-[#282D30] text-center ">
                     {bed.floorId?.floorName}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>

           <div className="">
          <p className="font-semibold text-[22px] font-inter text-[#282D30] ">
           Occupied
          </p>

          <div className="w-full flex flex-wrap gap-x-3 gap-y-4 mt-5">
            {displayBeds
              .filter((bed) => bed.bedStatus === "Occupied")
              .map((bed, index) => {
                return (
                  <div onClick={() => openExchangeForBed(bed)} className="w-[176px] h-[201px] rounded-[10px] flex flex-col justify-center items-center bg-[#EEFCFC] border border-[#50B7FF] drop-shadow-lg drop-shadow-[#0000000F] ">
                    <img src="/assets/OccupiedBed.svg" className="w-[60px] h-[41px] "/>
                    <p className="font-black text-[24px] font-inter text-[#50B7FF] ">
                      {bed.bedName}
                    </p>
                    <p className="font-bold text-[18px] font-inter text-[#282D30] ">
                      {bed.wardId?.wardName}
                    </p>
                    <p className="font-semibold text-[16px] font-inter text-[#282D30] text-center ">
                     {bed.floorId?.floorName}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>


        {openExchangeBedForm && (
  <ExchangeBeds
    open={openExchangeBedForm}
    onClose={() => setOpenExchangeBedForm(false)}
    selectedBed={selectedBed}
    beds={beds}
    refreshBeds={refreshBeds}
    // fetchPatients={fetchPatients} 
    />
)}

  {openAssignBedForm && (
  <AssignBed
    open={openAssignBedForm}
    onClose={() => setOpenAssignBedForm(false)}
    selectedBed2={selectedBed2}
    beds={beds}
    refreshBeds={refreshBeds}
    // fetchPatients={fetchPatients}  
  />
)}
    </div>
  );
};

export default Beds;
