import React, { useEffect, useMemo, useState } from "react";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const TransferPatientForm = ({
  value, 
  patientId,     
  admissionId,
  onTransfer,  
}) => {
  const [floors, setFloors]       = useState([]);
  const [floorMap, setFloorMap]   = useState({});   // label → id
  const [beds, setBeds]           = useState([]);
  const [bedMap, setBedMap]       = useState({});   // label → id

  // inverse maps: id → label
  const floorId2Label = useMemo(
    () => Object.fromEntries(Object.entries(floorMap).map(([label,id]) => [id, label])),
    [floorMap]
  );
  const bedId2Label = useMemo(
    () => Object.fromEntries(Object.entries(bedMap).map(([label,id]) => [id, label])),
    [bedMap]
  );

  // form state
  const [fromFloor, setFromFloor]     = useState("");
  const [fromBed, setFromBed]         = useState("");
  const [toFloor, setToFloor]         = useState("");
  const [toBed, setToBed]             = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("");

  // fetch floors
  useEffect(() => {
    axios.get(`${VITE_APP_SERVER}/api/v1/hospital-master/floor-master`)
      .then(({ data }) => {
        const labs = data.data.map(f => f.floorName);
        setFloors(labs);
        setFloorMap(Object.fromEntries(data.data.map(f => [f.floorName, f._id])));
      });
  }, []);

  // fetch beds

  const asId = (x) => (x && typeof x === "object" ? x._id : x);
  const asName = (x, key) => (x && typeof x === "object" ? x[key] : "");

  // useEffect(() => {
  //   axios.get(`${VITE_APP_SERVER}/api/v1/hospital-master/bed-master/vacant`)
  //     .then(({ data }) => {
  //       const labs = data.data.map(b => b.bedName);
  //       setBeds(data.data);
  //       setBedMap(Object.fromEntries(data.data.map(b => [b.bedName, b._id])));
  //     });
  // }, []);

  useEffect(() => {
  (async () => {
    try {
      // 1) get vacant beds only
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/hospital-master/bed-master/vacant`
      );
      let list = data.data; // array of bed objects: [{ _id, bedName, floorId, ... }]

      // 2) ensure current bed is present (for display)
      const curBedId   = asId(value.bedId);
      const curBedName = asName(value.bedId, "bedName");
      const curFloorId = asId(value.floorId);

      const hasCurrent = curBedId && list.some(b => b._id === curBedId);

      if (!hasCurrent && curBedId) {
        // Try to fetch the single bed (if your API supports it)
        try {
          const { data: one } = await axios.get(
            `${VITE_APP_SERVER}/api/v1/hospital-master/bed-master/${curBedId}`
          );
          if (one?.data) {
            list = [...list, one.data];
          } else {
            // Fallback: synthesize a minimal object so we can render the label
            list = [...list, { _id: curBedId, bedName: curBedName || "Current Bed", floorId: curFloorId }];
          }
        } catch {
          // If single-bed endpoint not available, synthesize
          list = [...list, { _id: curBedId, bedName: curBedName || "Current Bed", floorId: curFloorId }];
        }
      }

      // 3) commit
      setBeds(list);
      setBedMap(Object.fromEntries(list.map(b => [b.bedName, b._id])));
    } catch (e) {
      console.error(e);
    }
  })();
}, [value.bedId, value.floorId, VITE_APP_SERVER]);


  // once the maps are populated, seed the “from” values
  useEffect(() => {
    if (value.floorId) {
      setFromFloor(floorId2Label[value.floorId] || "");
    }
    if (value.bedId) {
      setFromBed(bedId2Label[value.bedId] || "");
    }
  }, [value.floorId, value.bedId, floorId2Label, bedId2Label]);

  // filter bed options for the “to” dropdown
const toBedOptions = useMemo(() => {
  const curBedId = asId(value.bedId);
  if (!beds || beds.length === 0) return [];

  const filteredByFloor = toFloor
    ? beds.filter(b => asId(b.floorId) === floorMap[toFloor])
    : beds;

  return filteredByFloor
    .filter(b => b._id !== curBedId)         // prevent selecting the same bed
    .map(b => b.bedName);
}, [beds, toFloor, floorMap, value.bedId]);


  // submit handler
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put(
        `${VITE_APP_SERVER}/api/v1/patient/transfer/${patientId}`,
        {
          admissionId: admissionId,
          currentFloor: floorMap[fromFloor],
          currentBed:   bedMap[fromBed],
          newFloor:     floorMap[toFloor],
          newBed:       bedMap[toBed],
          transferDate,
          transferTime,
        }
      );
      // tell the parent to update its admissionDetails
      onTransfer({
        floorId: floorMap[toFloor],
        bedId:      bedMap[toBed],
      });
      alert("Patient transferred successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to transfer patient");
    }
  };

  useEffect(() => {
  const now = new Date();
  setTransferDate(now.toISOString().split("T")[0]);
  setTransferTime(now.toTimeString().slice(0, 5));
}, []);


  return (
    <div className="w-[90%] mt-20 mx-auto h-fit bg-[#FDFDFD] shadow-[0_2px_6px_rgba(0,0,0,0.06)] rounded-[4px] ">
      <div className="w-full border-b border-b-[#C4C8D2] flex justify-center py-4 ">
        <p className="font-bold text-[20px] text-[#6F3CDB] ">
          Transfer Patient
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-[100%] flex flex-col gap-y-4 my-5 pb-8 ">
        <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">Current Floor:</p>
          <input type="text" className="input2 " value={fromFloor}
          disabled />
        </div>

       <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">New Floor No:</p>
          <div className="w-[100%] ">
            <CustomDropdown label="Select New Floor"
          options={floors}
          selected={toFloor}
          onChange={setToFloor}
        />
          </div>
        </div>

        <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">Current Bed:</p>
          <input type="text" className="input2 " value={fromBed}
          disabled />
        </div>

        <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">New Bed Number</p>
          <div className="w-[100%]">
           <CustomDropdown
          options={toBedOptions}
          selected={toBed}
          onChange={setToBed}
        />
          </div>
        </div>

        <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">Transfer Date:</p>
          <input type="date" className="input2 " value={transferDate}
          onChange={e => setTransferDate(e.target.value)}/>
        </div>

       <div className="w-[90%] flex flex-col gap-y-2 mx-auto ">
          <p className="label ">Transfer Time:</p>
          <input type="time" className="input2 " value={transferTime}
          onChange={e => setTransferTime(e.target.value)}/>
        </div>

        <button className="w-[90%] h-[50px] rounded-[10px] mt-3 bg-[#6F3CDB] text-white font-medium text-[16px] self-center ">
          Transfer Patient
        </button>
      </form>
    </div>
  );
};

export default TransferPatientForm;
