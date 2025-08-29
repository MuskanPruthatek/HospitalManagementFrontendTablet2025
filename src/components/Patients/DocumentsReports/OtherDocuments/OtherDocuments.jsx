import React, { useEffect, useState } from 'react'
import { usePatient } from '../../../../context/PatientContext';
import axios from 'axios';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const OtherDocuments = () => {
    const { selectedPatient } = usePatient();
     const navigate = useNavigate();

    const [patientData, setPatientData] = useState(null)

    const [docs, setDocs] = useState(true)
    const [uploadOpen, setUploadOpen] = useState(false)

      useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);



  const tabs = [
    {
      name: "Lab Reports", 
      link: "/main/patients/lab-reports"
    },
    {
      name: "Admission Form", 
      link: "/main/patients/admission-form"
    },
    {
      name: "Audios", 
      link: "/main/patients/audio-reports"
    },
    {
      name: "Videos", 
      link: "/main/patients/video-reports"
    },
    {
      name: "Operative Notes", 
      link: "/main/patients/operative-notes"
    },

  ]
  return (
    <div className={`w-full relative h-full overflow-y-scroll ${docs ? "bg-[#F4F6FA]" : "bg-white"}  font-inter py-10`}>

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

        <div className="w-full mt-5 pl-5 h-[70px] flex items-center gap-3">
  {tabs.map((tab) => (
    <Link
      key={tab.name}
      to={tab.link}
      className="inline-flex items-center h-full px-5 rounded-[10px] bg-[#FDFDFD] border-[2px] border-[#D8D8D8] font-semibold text-[22px] text-[#282D30]"
    >
      {tab.name}
    </Link>
  ))}
</div>


       {docs ?  
        <div className='w-full portrait:h-[85%] landscape:h-[80%] overflow-y-scroll scrolll    px-5 py-10'>

          <div>
            <p className='font-semibold text-[24px] text-black '>Other Documents</p>
            <p className='font-semibold text-[18px] text-[#6F3CDB] '>25 July 2025</p>
          </div>

          <div className='w-full flex flex-row flex-wrap gap-5 mt-10'>

            <div className='w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD]  flex flex-col justify-center items-center '>

             
             <div className='relative '>
              <div className='w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center '>

                <p className='font-medium text-[18px] text-white '>2</p>
              </div>
              <img src="/assets/pdf.svg" className='w-[111px] h-[100px]  '/>
               </div>

               <div className='flex flex-col items-center mt-10 '>
                <p className='text-[#282D30] text-[24px] font-semibold '>Mr. xyz.pdf</p>
                <p className='text-[#A1A3B2] text-[16px] font-medium '>July 25 2025 5:00 PM</p>
               </div>
            </div>

             <div className='w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD]  flex flex-col justify-center items-center '>

             
             <div className='relative '>
              <div className='w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center '>

                <p className='font-medium text-[18px] text-white '>2</p>
              </div>
              <img src="/assets/pdf.svg" className='w-[111px] h-[100px]  '/>
               </div>

               <div className='flex flex-col items-center mt-10 '>
                <p className='text-[#282D30] text-[24px] font-semibold '>Mr. xyz.pdf</p>
                <p className='text-[#A1A3B2] text-[16px] font-medium '>July 25 2025 5:00 PM</p>
               </div>
            </div>

             <div className='w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD]  flex flex-col justify-center items-center '>

             
             <div className='relative '>
              <div className='w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center '>

                <p className='font-medium text-[18px] text-white '>2</p>
              </div>
              <img src="/assets/pdf.svg" className='w-[111px] h-[100px]  '/>
               </div>

               <div className='flex flex-col items-center mt-10 '>
                <p className='text-[#282D30] text-[24px] font-semibold '>Mr. xyz.pdf</p>
                <p className='text-[#A1A3B2] text-[16px] font-medium '>July 25 2025 5:00 PM</p>
               </div>
            </div>

             <div className='w-[270px] h-[310px] rounded-[10px] bg-[#FDFDFD]  flex flex-col justify-center items-center '>

             
             <div className='relative '>
              <div className='w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center '>

                <p className='font-medium text-[18px] text-white '>2</p>
              </div>
              <img src="/assets/pdf.svg" className='w-[111px] h-[100px]  '/>
               </div>

               <div className='flex flex-col items-center mt-10 '>
                <p className='text-[#282D30] text-[24px] font-semibold '>Mr. xyz.pdf</p>
                <p className='text-[#A1A3B2] text-[16px] font-medium '>July 25 2025 5:00 PM</p>
               </div>
            </div>

            


          </div>



            
        </div> 
        :     
         <div className='w-full flex flex-col justify-center items-center '>

            <img src="/assets/empty.svg" className='portrait:w-[75%] mt-14'/>

            <button onClick={()=>setUploadOpen(true)} className='w-[367px] h-[70px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[22px] text-[#FDFDFD] mt-14'>Upload Files</button>

        </div> }

        {uploadOpen && <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#2c2c2c98] z-50 backdrop-blur-xs flex flex-col justify-center items-center '>
            <X size={30} color="#FDFDFD" onClick={()=>setUploadOpen(false)} className='absolute right-5 top-5'/>
            <p className='font-bold text-[44px] text-[#FDFDFD] '>Upload Documents</p>

            <div className='flex gap-x-10 mt-10 '>


            <div className='w-[295px] h-[295px] rounded-[16px] bg-[#8F8F8F33] border border-[#7D7D7D] flex flex-col gap-y-5 justify-center items-center '>
            
            <img src="/assets/takePhoto.svg"/>
            <p className='font-semibold text-[24px] text-[#FDFDFD] '>Take a Photo</p>
            </div>

            <div className='w-[295px] h-[295px] rounded-[16px] bg-[#8F8F8F33] border border-[#7D7D7D] flex flex-col gap-y-5 justify-center items-center '>
            
            <img src="/assets/pdf.svg"/>
            <p className='font-semibold text-[24px] text-[#FDFDFD] '>Upload from Gallery</p>
            </div>

            </div>
            
            </div>}
     
    </div>
  )
}

export default OtherDocuments
