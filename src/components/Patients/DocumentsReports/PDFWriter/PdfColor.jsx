import axios from "axios";
import { ChevronLeft, Check, ChevronsUpDown, Loader2, X as XIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { fetchWithCache } from "../../../../offline/fetchWithCache";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

// If your API differs, change this path:
const ASSIGN_URL = `${VITE_APP_SERVER}/api/v1/document-pdf/update-color`;

const COLOR_PRESETS = [
  "#FFDEDF", "#FFDEFC", '#DEE0FF', '#DEF3FF', '#BCFFD4', '#D2EBD0', '#FEEDB0', '#F6EEFC'
];

const PatientDetails = () => {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);

  // selection + color state
  const [selectedIds, setSelectedIds] = useState([]);
  const [color, setColor] = useState("#FFDEDF");

  // alerts
  const [alert, setAlert] = useState({ type: "", message: "" }); // "success" | "error" | ""
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
   
    fetchPDFS();
  }, []);

   const fetchPDFS = (forceOnline = false) =>
      fetchWithCache({
        collection: "pdfs",
        url: `${VITE_APP_SERVER}/api/v1/document-pdf`,
        setItems: setPdfs,
        forceOnline,
      });

  const allIds = useMemo(() => pdfs.map(p => String(p._id ?? p.id)), [pdfs]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;

  const toggleOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(allIds);
  };

  const dismissAlert = () => setAlert({ type: "", message: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    dismissAlert();

    if (!selectedIds.length) {
      setAlert({ type: "error", message: "Please select at least one PDF." });
      return;
    }
    if (!color || !/^#([0-9A-Fa-f]{6})$/.test(color)) {
      setAlert({ type: "error", message: "Please choose a valid hex color (e.g., #387282)." });
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAlert({ type: "error", message: "You’re offline. Please connect to the internet to submit." });
      return;
    }

    try {
      setSubmitting(true);
      const payload = { pdfIds: selectedIds, color };
      // Add auth headers here if needed:
      const { data } = await axios.put(ASSIGN_URL, payload /*, { headers: { Authorization: `Bearer ${token}` } }*/);
      setAlert({ type: "success", message: "Color assigned successfully." });
       fetchPDFS();
       setSelectedIds([])
      // Optionally clear selection
      // setSelectedIds([]);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to assign color. Please try again.";
      setAlert({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FB]">
      {/* Top Bar */}
      <div className="w-full h-[72px] bg-white shadow-sm flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => navigate(-1)}
            title="Back"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-[#282D30]">
            PDFs — Assign Color
          </h1>
        </div>

        {/* Simple selection summary */}
        <div className="text-sm text-gray-600">
          {selectedIds.length ? `${selectedIds.length} selected` : "No selection"}
        </div>
      </div>

      {/* Alerts */}
      {alert.type && (
        <div
          className={`mx-4 sm:mx-6 mt-4 rounded-xl border p-4 flex items-start gap-3 ${
            alert.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex-1">
            <p className="font-medium">
              {alert.type === "success" ? "Success" : "Error"}
            </p>
            <p className="mt-1">{alert.message}</p>
          </div>
          <button onClick={dismissAlert} className="p-1 rounded hover:bg-black/5">
            <XIcon size={18} />
          </button>
        </div>
      )}

      {/* Actions Row */}
      <form onSubmit={onSubmit} className="mx-4 sm:mx-6 mt-4 mb-4">
        <div className="w-full bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                id="selectAll"
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300"
                checked={allSelected}
                onChange={toggleAll}
              />
              <label htmlFor="selectAll" className="text-sm sm:text-base text-gray-700">
                Select all
              </label>
            </div>

            {/* Color chooser */}
            <ColorDropdown color={color} setColor={setColor} />
          </div>

          <div className="flex items-center justify-between">
            {/* <div className="text-sm text-gray-500">
              Submit will send:
              <code className="ml-1 text-gray-700">
                {`{ pdfIds: [${selectedIds.map(s => `"${s}"`).join(", ")}], color: "${color}" }`}
              </code>
            </div> */}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#6F3CDB] text-white font-medium disabled:opacity-70"
              title="Assign Color"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              {submitting ? "Assigning..." : "Assign Color"}
            </button>
          </div>
        </div>
      </form>

      {/* PDFs Grid */}
      <div className="mx-4 sm:mx-6 pb-10">
        {loading ? (
          <div className="w-full flex justify-center items-center py-16 text-gray-600">
            <Loader2 className="animate-spin mr-2" /> Loading PDFs…
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pdfs.map((pdf, idx) => {
              const id = String(pdf._id ?? pdf.id);
              const isSelected = selectedIds.includes(id);
              const name = pdf.pdfName || pdf.name || `PDF ${idx + 1}`;
              const url = pdf.url || pdf.pdfUrl || "#";

              return (
                <div
                  key={id}
                  className={`group relative rounded-2xl bg-white border shadow-sm overflow-hidden hover:shadow-md transition ${
                    isSelected ? "border-[#6F3CDB]" : "border-gray-200"
                  }`}
                >
                  {/* Checkbox */}
                  <label className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300"
                      checked={isSelected}
                      onChange={() => toggleOne(id)}
                    />
                    <span className="text-sm text-gray-700">Select</span>
                  </label>

                  {/* Preview area (thumbnail placeholder + name) */}
                  <div style={{backgroundColor: pdf.color}}
                    className="h-40 flex items-center justify-center cursor-pointer"
                    onClick={() => toggleOne(id)}
                    title="Select PDF"
                  >
                    {/* Simple placeholder thumbnail */}
                    {/* <div className="w-16 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-500">PDF</span>
                    </div> */}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{name}</p>
                       
                      </div>
                      {/* View link */}
                      {/* {url !== "#" && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#387282] hover:underline shrink-0"
                          title="Open PDF"
                        >
                          Open
                        </a>
                      )} */}
                    </div>
                  </div>

                  {/* Selected highlight bar */}
                  {isSelected && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[#6F3CDB]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/** Color Dropdown with swatches + hex input */
function ColorDropdown({ color, setColor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const onHexChange = (e) => {
    const val = e.target.value;
    setColor(val);
  };

  const validHex = /^#([0-9A-Fa-f]{6})$/.test(color);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-3 px-4 h-11 rounded-xl border border-gray-200 bg-white"
        onClick={() => setOpen((v) => !v)}
        title="Choose Color"
      >
        <span
          className="w-6 h-6 rounded-md border border-gray-300"
          style={{ backgroundColor: validHex ? color : "#ffffff" }}
        />
        <span className="text-sm font-medium text-gray-800">{validHex ? color : "Pick color"}</span>
        <ChevronsUpDown size={16} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 z-20">
          <p className="text-xs text-gray-500 mb-2">Quick colors</p>
          <div className="grid grid-cols-10 gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-6 h-6 rounded-md border border-gray-300"
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setOpen(false);
                }}
                title={c}
              />
            ))}
          </div>

          {/* <div className="mt-3">
            <label className="text-xs text-gray-500">Hex code</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={color}
                onChange={onHexChange}
                placeholder="#387282"
                className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm"
              />
              <input
                type="color"
                value={/^#([0-9A-Fa-f]{6})$/.test(color) ? color : "#387282"}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-12 rounded-lg border border-gray-300 p-1"
                title="Pick with native color picker"
              />
            </div>
            {!validHex && color && (
              <p className="text-xs text-red-600 mt-1">Enter a valid 6-digit hex (e.g., #387282).</p>
            )}
          </div> */}

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDetails;
