import React, { useEffect, useState } from 'react'
import axios from 'axios';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import TicketTrackerDemo from './TicketTrackerDemo';

const TrackTicket = () => {
   

   
    const navigate = useNavigate()
    
  return (
    <div className={`w-full relative h-full overflow-y-scroll bg-[#F4F6FA] font-inter py-10`}>

        <div className="flex items-center gap-x-5  pr-5">
          <div onClick={() => navigate(-1)}  className='w-[5%] '>
            <ChevronLeft size={60} />
          </div>

           <p className='text-black font-semibold text-[26px] '>Tracking Ticket SJ3786359B</p>

        </div>
      
       
       <TicketTrackerDemo/>
       


    </div>
  )
}

export default TrackTicket


