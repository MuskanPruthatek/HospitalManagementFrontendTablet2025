import { X } from "lucide-react";
import React from "react";
import CustomDropdown4 from "../../CustomDropdown/CustomDropdown4";

const InvestigationMaster = ({ setSelectedMaster }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#2c2c2c98] z-50 backdrop-blur-xs flex flex-col justify-center items-center ">
      <div className="w-[90%] portrait:max-h-[70vh] md:landscape:max-h-[70vh] lg:landscape:max-h-[70vh] overflow-y-scroll scrolll bg-white rounded-[20px] p-4 ">
        <div className="w-full flex justify-between items-center ">
          <div className="w-[90%] flex gap-x-4 ">
            <div className="w-[50%] ">
              <input className="input3 " placeholder="Lab Investigation" />
            </div>

            <div className="w-[50%] ">
              <CustomDropdown4 label="Search Medicine" />
            </div>
          </div>

          <X size={40} color="#282D30" onClick={() => setSelectedMaster("")} />
        </div>

        <div className="w-[500px] h-[400px] mx-auto ">
          <img src="/assets/empty2.svg" className="w-full h-full  " />
        </div>

        <p className="font-bold text-[40px] text-[#282D30] text-center ">
          No Data Found
        </p>
      </div>
    </div>
  );
};

export default InvestigationMaster;
