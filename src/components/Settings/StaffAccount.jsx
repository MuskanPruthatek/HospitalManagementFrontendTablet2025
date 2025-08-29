import React from 'react'
import { Link } from 'react-router-dom'

const StaffAccount = () => {
  return (
    <div className='w-full h-full font-inter bg-[#F4F6FA]'>

      <div className='section1 w-full lg:portrait:h-[535px] md:portrait:h-[400px] lg:landscape:h-[320px] md:landscape:h-[320px]  relative '>
         <img src="/assets/accountImg.png" className='object-cover w-full h-full '/>

         <div className='w-full h-full absolute top-0 left-0 right-0 bottom-0 px-10 flex flex-col items-end justify-center'>

            <p className='text-[#FFFFFF73] font-black text-[85px] '>Staff Account</p>
            <p className='text-white/60 font-medium text-[30px] '>ABCD Hospital Ahemedabad</p>

            <div className='w-full absolute bottom-5 flex lg:flex-row md:flex-col gap-x-20 gap-y-2 lg:justify-end lg:items-center md:items-end '>

              <p className='font-semibold lg:text-[26px] md:text-[22px] text-white '>Device ID: mdbanwej382</p>

              <p className='font-semibold lg:text-[26px] md:text-[22px] text-white '>Serial No: mdbanwej382</p>

            </div>

         </div>

         <div className='w-full absolute h-[136px] bg-[#FDFDFD]  '>

            
              <div className='bg-[#EBCFFF] w-[230px] h-[230px] border-[10px] border-white 
              drop-shadow-xl drop-shadow-[#7F7F7F40] absolute bottom-0 left-10 rounded-[10px] flex justify-center items-center'>
                <img src="/assets/patients2.svg"/>
              </div>

            <p className='absolute left-80 top-8 font-bold text-[40px] text-[#6F3CDB]  '>Dr. xyzm</p>

         </div>
      </div>

      <div className='section2 w-full flex gap-x-5 px-5 lg:portrait:h-[450px] md:portrait:h-[350px] lg:landscape:h-[300px] md:landscape:h-[150px] mt-[160px]'>

        <div className='w-[50%] h-full bg-[#FDFDFD] rounded-[12px] overflow-y-scroll scrolll flex flex-col gap-y-5 px-8 py-10 '>
           <p className='font-semibold text-[26px] text-[#282D30] '>Admission New Baby Cradle</p>
           <Link to="/main/settings/issue-ticket" className='font-semibold text-[26px] text-[#282D30] '>Create  Ticket for any kind of issues</Link>
           <Link to="/main/settings/patient-edit-document" className='font-semibold text-[26px] text-[#282D30] '>Next Follow Up Details</Link>
           <p className='font-semibold text-[26px] text-[#282D30] '>Register Book Master</p>
           <p className='font-semibold text-[26px] text-[#282D30] '>Digital Register book</p>
           <p className='font-semibold text-[26px] text-[#282D30] '>IPD Pages Templates</p>
           <p className='font-semibold text-[26px] text-[#282D30] '>Clear Gallery Files</p>
          
        </div>

        <div className='w-[50%] h-full bg-[#FDFDFD] rounded-[12px] overflow-y-scroll scrolll  px-8 py-5 '>

          <div className='flex gap-x-3 items-center  justify-center'>
            <img src="/assets/Bell.svg"/>
            <p className='font-bold text-[32px] text-[#282D30] '>Notifications</p>
          </div>

          <div className='flex flex-col gap-y-5 mt-5'>

            <div className='flex gap-x-4 '>

              <div className='w-[14px] h-[14px] rounded-full bg-[#ED1F22] shrink-0 mt-2.5 '></div>

              <div className=' '>
                <p className='text-[#282D30] font-bold text-[24px] '> Notification Title</p>
                <p className='text-[#282D30] font-normal text-[22px] '> Notification Content Display here,Notification Content Display here</p>
              </div>

            </div>

               <div className='flex gap-x-4 '>

              <div className='w-[14px] h-[14px] rounded-full bg-[#ED1F22] shrink-0 mt-2.5 '></div>

              <div className=' '>
                <p className='text-[#282D30] font-bold text-[24px] '> Notification Title</p>
                <p className='text-[#282D30] font-normal text-[22px] '> Notification Content Display here,Notification Content Display here</p>
              </div>

            </div>

               <div className='flex gap-x-4 '>

              <div className='w-[14px] h-[14px] rounded-full bg-[#ED1F22] shrink-0 mt-2.5 '></div>

              <div className=' '>
                <p className='text-[#282D30] font-bold text-[24px] '> Notification Title</p>
                <p className='text-[#282D30] font-normal text-[22px] '> Notification Content Display here,Notification Content Display here</p>
              </div>

            </div>

               <div className='flex gap-x-4 '>

              <div className='w-[14px] h-[14px] rounded-full bg-[#ED1F22] shrink-0 mt-2.5 '></div>

              <div className=' '>
                <p className='text-[#282D30] font-bold text-[24px] '> Notification Title</p>
                <p className='text-[#282D30] font-normal text-[22px] '> Notification Content Display here,Notification Content Display here</p>
              </div>

            </div>

          </div>

        </div>

      </div>
      
    </div>
  )
}

export default StaffAccount
