import React, { useEffect, useState } from 'react'
import axios from 'axios';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const IssueTicket = () => {
   

    const [docs, setDocs] = useState(false)
    const [uploadOpen, setUploadOpen] = useState(false)
    const navigate = useNavigate()
    
  return (
    <div className={`w-full relative h-full overflow-y-scroll bg-[#F4F6FA] font-inter py-10`}>

        <div className="flex items-center gap-x-5  pr-5">
          <div onClick={() => navigate(-1)}  className='w-[5%] '>
            <ChevronLeft size={60} />
          </div>

           <p className='text-black font-semibold text-[24px] '>Your Tickets</p>

        </div>
       {docs ?  
        <div className='w-full portrait:h-[85%] landscape:h-[80%] overflow-y-scroll scrolll  px-5 py-10 flex flex-col items-center '>
             
             <div className='w-[98%] h-fit p-5 bg-[#FDFDFD] rounded-[20px] relative '>
                <p className=' font-semibold text-[28px] text-[#282D30] '>Issue Name or title</p>
                <p className='mt-3 font-normal text-[22px] text-[#282D30] '>Notification Content Display here,Notification Content Display hereNotification Content Display here,Notification Content Display hereNotification Content Display here,Notification Content Display hereNotification Content Display here,Notification Content Display here</p>
            
               <div className="w-[90%] h-[60px] bg-[#6F3CDB] left-1/2 -translate-x-1/2 px-8 absolute -bottom-15 rounded-b-[30px] flex justify-center items-center ">
               <p className="font-medium lg:text-[22px] md:text-[18px] text-[#FDFDFD] text-center ">Issue Raised our Team will contact shortly. </p>
             
           </div>
             </div>
          
        </div> 
        :     
         <div className='w-full flex flex-col justify-center items-center mt-10'>

            <p className='text-[42px] text-[#282D30] font-semibold '>There are no tickets raised!</p>
            <p className='text-[42px] text-[#36D7A0] font-semibold '>Everything works Perfectly :)</p>

            <img src="/assets/empty.svg" className='portrait:w-[75%] mt-14'/>

            <button onClick={()=>setUploadOpen(true)} className='w-[367px] h-[70px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[22px] text-[#FDFDFD] mt-14'>Raise an Issue</button>

        </div> }


        {uploadOpen && <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#2c2c2c98] z-50 backdrop-blur-xs flex flex-col justify-center items-center '>
            
            <form className='w-[80%] h-fit p-5 mx-auto bg-[#FDFDFD] rounded-[20px] drop-shadow-lg  '>

              <div className='w-full flex justify-end '>
                <X size={40} color="#A1A3B2" onClick={()=>setUploadOpen(false)} className='self-end ' />
              </div>

              <p className='font-semibold text-[20px] text-[#282D30] '>Issue Title</p>
              <input className='input2 mt-2' placeholder='Issue'/>

               <p className='font-semibold text-[20px] text-[#282D30] mt-6'>Explain in Detail</p>
               <textarea className='input4 mt-2 p-2' placeholder='Detailed Overview'/>

               <button className='w-full h-[70px] rounded-[15px] bg-[#6F3CDB] font-bold mt-6 text-[20px] text-white '>Submit</button>
             

            </form>
            
            </div>}
     
    </div>
  )
}

export default IssueTicket
