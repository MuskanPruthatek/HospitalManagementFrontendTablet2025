import { X } from "lucide-react";
import React from "react";
import CustomDropdown4 from "../../CustomDropdown/CustomDropdown4";

const MedicineMaster = ({ setSelectedMaster }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#2c2c2c98] z-50 backdrop-blur-xs flex flex-col justify-center items-center ">
      <X
        size={30}
        color="#FDFDFD"
        onClick={() => setSelectedMaster("")}
        className="absolute right-5 top-5"
      />

      <div className="w-[90%] ">
        <CustomDropdown4 label="Search Medicine" />
      </div>
    </div>
  );
};

export default MedicineMaster;
