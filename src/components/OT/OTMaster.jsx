import React, { useEffect, useState } from 'react'
import axios from "axios";
import Scheduler from './Scheduler';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const OTMaster = () => {

    const [ot, setOt] = useState([])
     const [scheduleOpen, setScheduleOpen] = useState(false);
     const [selectedOT, setSelectedOT] = useState({})

     const fetchOT = async () => {
        try {
          const { data } = await axios.get(
            `${VITE_APP_SERVER}/api/v1/hospital-master/ot-master`
          );
          setOt(data.data);
        } catch (err) {
          console.error(err);
        }
      };
    
      useEffect(() => {
        fetchOT();
      }, []);
  return (
    <div className='relative'>

        {ot.map((o, index)=>{
            return (
                <div  onClick={() => {setScheduleOpen(true); setSelectedOT(o)}} className='flex '>
                   <p>{o.otName}</p>
                </div>
            )
        })}

        {scheduleOpen && (
        <div className="fixed w-full h-full bg-black/50 top-0 bottom-0 left-0 right-0 ">
          <Scheduler />
        </div>
      )}
      
    </div>
  )
}

export default OTMaster
