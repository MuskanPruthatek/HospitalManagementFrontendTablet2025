import { useState, useMemo } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

const CustomDropdown = ({ options = [], selected, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  return (
    <div className="relative w-full  ">
      <button type="button"
        onClick={() => setOpen(!open)}
        className={`w-full text-left px-4 h-[50px] border-[2px] whitespace-nowrap ${open ? "border-[#6F3CDB]" : "border-[#C4C8D2]"}  rounded-[10px] bg-white flex justify-between items-center  `}
      >
        {selected || label}

       {open ? <ChevronUp size={20}/> : <ChevronDown size={20}/>} 
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#C4C8D2] rounded-md shadow-lg">
          {/* Search Box */}
          <div className="px-1 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 border-b border-b-[#A1A3B2] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto scrolll px-1.5 ">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch(""); // Clear search on select
                  }}
                  className={`flex items-center text-[12px] justify-between rounded-[4px] px-4 py-2 cursor-pointer hover:bg-[#F6EEFC] hover:text-[#6F3CDB] ${
                    selected === option ? "font-semibold text-[#6F3CDB]" : ""
                  }`}
                >
                  <span>{option}</span>
                  {selected === option && <Check size={20} className="text-[#6F3CDB]" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;


