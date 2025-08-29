import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Bulletproof CustomDropdown
 *
 * Props:
 * - options: (Array) items can be string | number | object | mixed
 * - selected: selected value OR selected object (we'll detect both)
 * - onChange: function(value, option) -> void
 * - label: placeholder when nothing selected
 * - getOptionLabel?: (opt) => string
 * - getOptionValue?: (opt) => any
 */
const CustomDropdown3 = ({
  options = [],
  selected,
  onChange,
  label = "Select",
  getOptionLabel,
  getOptionValue,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Robust value getter
  const extractValue = (opt) => {
    if (getOptionValue) return getOptionValue(opt);
    if (opt == null) return ""; // null/undefined
    if (typeof opt !== "object") return opt; // string/number/bool
    // common id fields
    return (
      opt.value ??
      opt._id ??
      opt.id ??
      opt.key ??
      opt.code ??
      // last resort: JSON
      JSON.stringify(opt)
    );
  };

  // Robust label getter
  const extractLabel = (opt) => {
    if (getOptionLabel) return getOptionLabel(opt);
    if (opt == null) return "";
    if (typeof opt !== "object") return String(opt);
    return (
      opt.label ??
      opt.name ??
      opt.title ??
      opt.otName ?? // helpful default for your OT data
      opt.text ??
      opt.display ??
      // fallback: stringified value
      String(extractValue(opt))
    );
  };

  // Normalize all options once
  const normalized = useMemo(() => {
    return (options || []).map((opt, idx) => {
      const value = extractValue(opt);
      const labelText = extractLabel(opt);
      // stable key: prefer value, else idx
      const key = value != null ? String(value) : `idx-${idx}`;
      return { key, value, label: String(labelText ?? ""), raw: opt };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, getOptionLabel, getOptionValue]);

  // Determine selected value and label no matter what "selected" is
  const selectedValue = useMemo(() => {
    // if user passed the actual object as selected, convert it to value
    if (selected && typeof selected === "object") return extractValue(selected);
    return selected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const selectedItem = useMemo(
    () => normalized.find((n) => n.value === selectedValue),
    [normalized, selectedValue]
  );

  // Safe search: convert to string and lower it
  const searchLC = String(search ?? "").toLowerCase();
  const filtered = useMemo(() => {
    if (!searchLC) return normalized;
    return normalized.filter((n) =>
      n.label.toLowerCase().includes(searchLC)
    );
  }, [normalized, searchLC]);

  const handlePick = (item) => {
    setOpen(false);
    setSearch("");
    // return both value and raw option for flexibility
    onChange?.(item.value, item.raw);
  };

  return (
    <div className="relative w-full">
      {/* <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left px-4 h-[50px] border-[2px] text-[#6F3CDB] whitespace-nowrap ${
          open ? "border-[#6F3CDB]" : "border-[#C4C8D2]"
        } rounded-[10px] bg-white flex justify-between items-center`}
      >
        {selectedItem?.label || label}
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button> */}

      {/* {open && ( */}
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#C4C8D2] rounded-md shadow-lg">
          {/* Search Box */}
          <div className="px-1 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 border-b border-b-[#A1A3B2] text-[#6F3CDB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto scrolll px-1.5">
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <div
                  key={item.key}
                  onClick={() => handlePick(item)}
                  className={`flex items-center text-[12px] justify-between rounded-[4px] px-4 py-2 cursor-pointer hover:bg-[#F6EEFC] hover:text-[#6F3CDB] ${
                    selectedValue === item.value
                      ? "font-semibold text-[#6F3CDB]"
                      : "text-[#6F3CDB]"
                  }`}
                >
                  <span>{item.label}</span>
                  {selectedValue === item.value && (
                    <Check size={20} className="text-[#6F3CDB]" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No results found
              </div>
            )}
          </div>
        </div>
      {/* )} */}
    </div>
  );
};

export default CustomDropdown3;
