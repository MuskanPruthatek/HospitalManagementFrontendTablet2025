import axios from 'axios'
import { Search, X } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import CustomDropdown from '../CustomDropDown/CustomDropdown';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
const BedStatus = () => {

    const available = [
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },
    ]

      const unavailable = [
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },
    ]

      const maintenance = [

        {
            name: "12B",
            ward: "12",
            floor: "1"
        },
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },
        {
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },{
            name: "12B",
            ward: "12",
            floor: "1"
        },
    ]


  const [selectedType, setSelectedType] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [floors, setFloors] = useState([]); 
  const [floorMap, setFloorMap] = useState({}); 
  const [beds, setBeds] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  const resolveFloorName = (bed) => {
  // 1️⃣ API may already return populated name
  if (bed.floorName) return bed.floorName;

  // 2️⃣ floorId could be object
  if (bed.floorId && typeof bed.floorId === "object") {
    if (bed.floorId.floorName) return bed.floorId.floorName;
    if (bed.floorId._id) {
      return (
        Object.keys(floorMap).find((n) => floorMap[n] === bed.floorId._id) || ""
      );
    }
  }

  // 3️⃣ floorId string
  if (typeof bed.floorId === "string") {
    return Object.keys(floorMap).find((n) => floorMap[n] === bed.floorId) || "";
  }

  return "";
};
   
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${VITE_APP_SERVER}/api/v1/hospital-master/floor-master`
        );
        const nameList = data.data.map((floor) => floor.floorName);
        const mapping = data.data.reduce((acc, floor) => {
          acc[floor.floorName] = floor._id;
          return acc;
        }, {});
        setFloors(nameList);
        setFloorMap(mapping);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

    const fetchBeds = async (query = {}) => {
  setError("");
  try {
    setLoading(true);

    const isFilter = Object.keys(query).length > 0;      // ⬅️ decide route
    const baseUrl  = isFilter
      ? `${VITE_APP_SERVER}/api/v1/hospital-master/bed-master/filter`
      : `${VITE_APP_SERVER}/api/v1/hospital-master/bed-master`;

    const url = isFilter
      ? `${baseUrl}?${new URLSearchParams(query).toString()}`
      : baseUrl;

    const { data } = await axios.get(url);
    setBeds(data.data || []);
  } catch (err) {
    console.error(err);
    setBeds([]);
    setError(
      err.response?.data?.message || err.message || "Could not load beds."
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBeds();
  }, []);

  useEffect(() => {
  const query = {};
  if (selectedType) query.bedStatus = selectedType;
  if (selectedFloor) query.floorId = floorMap[selectedFloor];

  const id = setTimeout(() => {
    if (Object.keys(query).length) {
      fetchBeds(query);   // ⇒ hits …/bed-master/filter?<params>
    } else {
      fetchBeds();        // ⇒ back to full list
    }
  }, 200);

  return () => clearTimeout(id);
}, [selectedType, selectedFloor]);


const filterBedsBySearch = (bedsArr, term, floorMap) => {
  if (!term.trim()) return bedsArr;                 // empty → return all
  const q = term.toLowerCase();

  return bedsArr.filter((bed) => {
    const floorName = (resolveFloorName(bed, floorMap) || "").toLowerCase();
    const bedName   = (bed.bedName || "").toLowerCase();

    return floorName.includes(q) || bedName.includes(q);
  });
};

const displayBeds = useMemo(
  () => filterBedsBySearch(beds, searchTerm, floorMap),
  [beds, searchTerm, floorMap]
);

  return (
    <div className="w-[90%] h-[90vh] p-7 font-inter select-none rounded-[10px] bg-white overflow-y-scroll ">

      <div className='w-full flex justify-between items-end '>

     <div className='w-[70%] flex gap-x-3 '>

    
        <div className='w-full '>
           <p className='label '>Type</p>
           <div className='w-[100%] '>
            <CustomDropdown
                options={["Vacant", "Occupied", "Under Maintenance"]}
                selected={selectedType}
                onChange={setSelectedType}
              />
           </div>
           
        </div>

        <div className='w-full '>
           <p className='label '>Floor</p>
            <div className='w-[100%] '>
            <CustomDropdown options={floors} selected={selectedFloor} onChange={setSelectedFloor}/>
           </div>
        </div>

        <div className='w-full '>
           <p className='label '>Ward</p>
           <input className='input2 mt-1'/>
        </div>
    </div>  

     <div className='w-[20%]  '>
        <div className="relative w-[100%] h-[48px]">
          
             <Search color="#A3A8B5" size={20} className="absolute top-3.5 left-3" />
             <input
               placeholder="Search here..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-[#F8FAFC] w-full h-full pl-10 pr-8 placeholder:text-[#A3A8B5] rounded-[10px] border border-[#D1D5DB]"
             />
             {searchTerm && (
               <button
                 onClick={() => setSearchTerm("")}
                 className="absolute top-2.5 right-2 text-[#A3A8B5] hover:text-[#6F3CDB] cursor-pointer"
               >
                 <X/>
               </button>
             )}
               </div>

     </div>

      </div>

      <div className='mt-5'>
        <p className='font-semibold text-[22px] font-inter text-[#282D30] '>Available Beds</p>

        <div className='w-full flex flex-wrap gap-x-2 gap-y-4 mt-5'>

           {displayBeds.filter((bed=> bed.bedStatus === "Vacant")).map((bed, index)=>{
            return (  
            <div className='w-[106px] h-[121px] rounded-[10px] flex flex-col justify-center items-center bg-[#EEFCFC] border border-[#36D7A0] drop-shadow-lg drop-shadow-[#0000000F] '>
                 <img src="/assets/AvailableBed.svg"/>
                 <p className='font-black text-[18px] font-inter text-[#36D7A0] '>{bed.bedName}</p>
                 {/* <p className='font-semibold text-[13px] font-inter text-[#282D30] '>Ward {bed.ward}</p> */}
                 <p className='font-semibold text-[12px] font-inter text-[#282D30] text-center '>Floor - {bed.floorId.floorName}</p>
            </div>
           )})} 
        </div>

      </div>

      <div className='mt-8'>
        <p className='font-semibold text-[22px] font-inter text-[#282D30] '>Temporary Unavailable </p>

        <div className='w-full flex flex-wrap gap-x-2 gap-y-4 mt-5'>

           {displayBeds.filter((bed=> bed.bedStatus === "Occupied")).map((bed, index)=>{
            return (  
            <div className='w-[106px] h-[121px] rounded-[10px] flex flex-col justify-center items-center bg-[#FFF7F2] border border-[#FB8C5C] drop-shadow-lg drop-shadow-[#0000000F] '>
                 <img src="/assets/UnavailableBed.svg"/>
                 <p className='font-black text-[18px] font-inter text-[#FB8C5C] '>{bed.bedName}</p>
                 {/* <p className='font-semibold text-[13px] font-inter text-[#282D30] '>Ward {bed.ward}</p> */}
                 <p className='font-semibold text-[12px] font-inter text-[#282D30] '>Floor - {bed.floorId.floorName}</p>
            </div>
           )})} 
        </div>

      </div>

      <div className='mt-8'>
        <p className='font-semibold text-[22px] font-inter text-[#282D30] '>Under Maintenance </p>

        <div className='w-full flex flex-wrap gap-x-2 gap-y-4 mt-5'>

            {displayBeds.filter((bed=> bed.bedStatus === "Under Maintenance")).map((bed, index)=>{
            return (  
            <div className='w-[106px] h-[121px] rounded-[10px] flex flex-col justify-center items-center bg-[#F5F5F5] border border-[#A1A3B2] drop-shadow-lg drop-shadow-[#0000000F] '>
                 <img src="/assets/MaintenanceBed.svg"/>
                 <p className='font-black text-[18px] font-inter text-[#A1A3B2] '>{bed.name}</p>
                 {/* <p className='font-semibold text-[13px] font-inter text-[#282D30] '>Ward {bed.ward}</p> */}
                 <p className='font-semibold text-[12px] font-inter text-[#282D30] '>Floor - {bed.floorId.floorName}</p>
            </div>
           )})} 
        </div>

      </div>
      
    </div>
  )
}

export default BedStatus
