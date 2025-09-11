// PatientPages.jsx
import axios from "axios";
import { ChevronLeft, PencilIcon, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatient } from "../../../../context/PatientContext";
import { fetchWithCache } from "../../../../offline/fetchWithCache";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const PatientPages = () => {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  // 🔧 prevent crash from undefined `alert`
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    const fetchPatientsWithId = (forceOnline = false) =>
      fetchWithCache({
        collection: `patientData-${selectedPatient.patientId}`,
        url: `${VITE_APP_SERVER}/api/v1/patient/${selectedPatient.patientId}`,
        setItems: setPatientData,
        forceOnline,
      });

    fetchPatientsWithId();
  }, [selectedPatient?.patientId]);

  const patientId = patientData?._id || patientData?.patientId;
  const admissionId = selectedPatient?.admissionId;

  useEffect(() => {
    if (!patientId || !admissionId) return;
    fetchRecordings(patientId, admissionId);
  }, [patientId, admissionId]);

  const fetchRecordings = async (patientId, admissionId, forceOnline = false) => {
    if (!patientId || !admissionId) return;
    setLoading(true);
    try {
      await fetchWithCache({
        collection: `document-pdfs-${patientId}-${admissionId}`,
        url: `${VITE_APP_SERVER}/api/v1/document-pdf/${patientId}/${admissionId}`,
        setItems: (items) => setDocs(items || []),
        forceOnline,
      });
    } catch (err) {
      console.error("Error fetching recordings", err);
      setAlert({ type: "error", message: "Failed to fetch PDFs." });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = (forceOnline = false) => {
    if (patientId && admissionId) fetchRecordings(patientId, admissionId, forceOnline);
  };

  const deletePdf = async (patientId, admissionId, pdfId) => {
    const ok = window.confirm("Are you sure you want to delete this pdf?");
    if (!ok) return;

    try {
      const res = await axios.delete(`${VITE_APP_SERVER}/api/v1/document-pdf/delete-pdf/${patientId}/${admissionId}/${pdfId}`);
      alert(res.data.message);
      await fetchRecordings();
    } catch (err) {
      console.error("Delete failed", err);
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="w-full relative h-full overflow-y-scroll bg-white font-inter py-10">
      {alert.type && (
        <div
          className={`mx-5 mb-4 rounded-lg px-4 py-3 ${
            alert.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="flex justify-between items-center gap-x-5 pr-5">
        <div onClick={() => navigate(-1)} className="w-[5%] cursor-pointer">
          <ChevronLeft size={60} />
        </div>

        <div className="w-[75%] h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4">
          <img src="/assets/patients2.svg" className="w-[24px] h-[30px]" />
          <p className="text-[#6F3CDB] font-semibold text-[20px]">
            {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
            {patientData?.identityDetails?.patientName ?? "Loading..."}
          </p>
        </div>

        <div className="w-[20%] h-[70px] rounded-[10px] bg-[#FDFDFD] border-[2px] border-[#D8D8D8] flex justify-center items-center gap-x-4">
          <p className="font-semibold text-[22px] text-[#282D30]">Filters</p>
          <SlidersHorizontal color="#282D30" size={20} />
        </div>
      </div>

      <div className="w-full portrait:h-[90%] landscape:h-[85%] overflow-y-scroll px-5 py-10">
        <div>
          <p className="font-semibold text-[24px] text-black">Patient Pages</p>
          <p className="font-semibold text-[18px] text-[#6F3CDB]">
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="w-full flex flex-row flex-wrap gap-5 mt-10">
          {docs.map((doc, index) => {
            // Build query params: id, file (path), name
            const qp = new URLSearchParams();
            if (doc?._id) qp.set("id", String(doc._id));
            if (doc?.path) qp.set("file", String(doc.path));
            if (doc?.name) qp.set("name", String(doc.name));

            return (
              <div
                key={doc._id || index}
                className="relative w-[270px] h-[310px] rounded-[16px] bg-[#FDFDFD] border border-transparent hover:border-[#E7E7E7] transition-all shadow-sm hover:shadow-md flex flex-col justify-center items-center cursor-pointer"
              >
                <div className="relative">
                  <div className="w-[53px] h-[53px] absolute -top-4 -right-2 rounded-full border-[5px] border-[#FDFDFD] bg-[#6F3CDB] flex justify-center items-center">
                    <p className="font-medium text-[16px] text-white">
                      {(doc.index ?? index) + 1}
                    </p>
                  </div>
                  <img src="/assets/pdf.svg" className="w-[111px] h-[100px]" />
                </div>

                <div className="flex flex-col items-center mt-10 px-4">
                  <p className="text-[#282D30] text-[16px] font-semibold line-clamp-2 text-center">
                    {doc.name}
                  </p>

                  <div className="flex justify-center items-center gap-x-3 mt-5">
                    {/* ✏️ Open writer with BOTH query params and state fallbacks */}
                    <Link
                      to={`/main/patients/pdf?${qp.toString()}`}
                      state={{
                        id: doc?._id ?? null,
                        file: doc?.fileBlob || doc?.path || null, // Blob/File or URL
                        name: doc?.name || "Document",
                        path: doc?.path || null,
                      }}
                    >
                      <PencilIcon color="#6F3CDB" />
                    </Link>

                    <Trash2 onClick={() => deletePdf(patientId, admissionId, doc._id)} color="red" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientPages;
