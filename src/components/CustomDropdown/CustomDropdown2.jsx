// CustomDropdown2.jsx
import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

const CustomDropdown2 = ({ options = [], selected, onChange, label = "Select" }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // find selected item
  const selectedItem = useMemo(
    () => options.find(o => o?.value === selected) || null,
    [options, selected]
  );

  // filter options by label
  const filteredOptions = useMemo(() => {
    const s = String(search ?? "").toLowerCase();
    return options.filter(opt =>
      String(opt?.label ?? "").toLowerCase().includes(s)
    );
  }, [search, options]);

  const handlePick = (item) => {
    setOpen(false);
    setSearch("");
    onChange?.(item.value, item);
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full text-left px-4 h-[50px] border-[2px] whitespace-nowrap ${
          open ? "border-[#6F3CDB]" : "border-[#C4C8D2]"
        } rounded-[10px] bg-white flex justify-between items-center`}
      >
        {selectedItem?.label || label}
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#C4C8D2] rounded-md shadow-lg">
          {/* Search */}
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
          <div className="max-h-48 overflow-y-auto scrolll px-1.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={String(opt.value)}
                  onClick={() => handlePick(opt)}
                  className={`flex items-center text-[12px] justify-between rounded-[4px] px-4 py-2 cursor-pointer hover:bg-[#F6EEFC] hover:text-[#6F3CDB] ${
                    selected === opt.value ? "font-semibold text-[#6F3CDB]" : ""
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected === opt.value && <Check size={20} className="text-[#6F3CDB]" />}
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

export default CustomDropdown2;
