import { ChevronDown, ChevronLeft, Printer, Share2 } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const DocumentDetails = () => {
  const navigate = useNavigate()
  return (
    <div className="w-full h-full bg-white font-inter ">

        <div className='w-full h-[94px] bg-[#FDFDFD] drop-shadow-lg drop-shadow-[#18171740] flex justify-between items-center pr-5 '>

          <div className='flex gap-x-4 items-center '>

            <ChevronLeft size={60} onClick={() => navigate(-1)}/>
            <p className='font-semibold text-[24px] text-[#282D30] '>Mr. xyz.pdf</p>

          </div>

          <div className='flex gap-x-5 '>
            <div className='w-[97px] h-[70px] bg-[#36D7A0] rounded-[10px] flex justify-center items-center  '>
                
            </div>

            <div className='w-[97px] h-[70px] bg-[#FB8C5C] rounded-[10px] flex justify-center items-center  '>
                 <Share2 color='white' size={30} />
            </div>

            <div className='w-[97px] h-[70px] bg-[#50B7FF] rounded-[10px] flex justify-center items-center  '>
                <Printer color='white' size={30}/>
            </div>


          </div>

        </div>

        <div className='w-full relative portrait:h-[90%] landscape:h-[85%] overflow-y-scroll scrolll'>

            <div className='pagination absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-y-4'>

                <div className='w-[255px] h-[185px] rounded-[10px] bg-black relative '>
                    <div className='w-[28px] h-[28px] rounded-full absolute bottom-4 left-4 bg-[#FB8C5C] flex justify-center 
                    items-center font-semibold text-[20px] text-[#FDFDFD] '>1</div>

                </div>

                <div className='w-[255px] h-[185px] rounded-[10px] bg-black relative'>
                    <div className='w-[28px] h-[28px] rounded-full absolute bottom-4 left-4 bg-[#FB8C5C] flex justify-center 
                    items-center font-semibold text-[20px] text-[#FDFDFD] '>2</div>
                    

                </div>

            </div>

        </div>
      
    </div>
  )
}

export default DocumentDetails
