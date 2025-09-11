import React, { useEffect, useMemo, useState } from "react";
import { usePatient } from "../../../../context/PatientContext";
import axios from "axios";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { ChevronLeft, Pencil, Trash2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchWithCache } from "../../../../offline/fetchWithCache";
import { useOnline } from "../../../../offline/useOnline";


const toTitleCase = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());

const applyCase = (text, mode) => {
  if (mode === "Capital") return (text || "").toUpperCase();
  if (mode === "Camel") return toTitleCase(text || "");
  return text || "";
};

// ---------- Edit Modal ----------
const NoteModal = ({ open, onClose, note, onSave, saving, displayName }) => {
  const [text, setText] = useState(note?.note || "");
  const [textCase, setTextCase] = useState("Capital"); // "Capital" | "Camel"

  useEffect(() => {
    setText(note?.note || "");
  }, [note?._id]);

  if (!open || !note) return null;

  const handleCaseSwitch = (mode) => {
    setTextCase(mode);
    setText((prev) => applyCase(prev, mode)); // live transform on toggle
  };

  const handleSave = () => {
    const finalText = applyCase(text, textCase);
    onSave(finalText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-[#E7E7E7] p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-2 rounded-full hover:bg-zinc-100"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Case tabs */}
        <div className="w-[148px] h-[56px] rounded-[10px] p-1 bg-[#EAEAEA] flex items-center justify-center absolute right-4 top-12 ">
          <div
            onClick={() => handleCaseSwitch("Capital")}
            className={`w-[50%] h-full flex justify-center items-center text-[20px]
              font-semibold text-[#282D30] ${textCase === "Capital" ? "bg-[#FDFDFD]" : "bg-transparent"} cursor-pointer rounded-[8px]`}
          >
            AG
          </div>
          <div
            onClick={() => handleCaseSwitch("Camel")}
            className={`w-[50%] h-full flex justify-center items-center text-[20px]
              font-semibold text-[#282D30] ${textCase === "Camel" ? "bg-[#FDFDFD]" : "bg-transparent"} cursor-pointer rounded-[8px]`}
          >
            Ag
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-1 pr-40">{displayName}</h2>
        <p className="text-sm text-[#A1A3B2] mb-4"> {note.addedAt
                      ? new Date(note.addedAt).toLocaleString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}</p>

        <textarea
          className="w-full h-56 mt-8 resize-none rounded-[8px] border border-zinc-300 p-3 outline-none focus:ring-1 focus:ring-[#6F3CDB]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Edit note..."
        />

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-[8px] bg-[#6F3CDB] text-[#FDFDFD] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Main ----------
const NotesData = ({ selectedMaster, masters, setSelectedMaster }) => {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate();

    const config = useMemo(() => masters.find(m => m.id === selectedMaster) || {}, [masters, selectedMaster]);
    const displayName = config?.name || "Notes";
    const apiField = config?.apiField || "notes"; 
    const name = config?.id 

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [activeNote, setActiveNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false)

  const pid = selectedPatient?.patientId;
  const aid = selectedPatient?.admissionId;

  const user = JSON.parse(localStorage.getItem("auth"));
  const token = user?.token;
  const online = useOnline()

  const fetchNotes = async () => {
    if (!pid || !aid) return;
    try {
      setLoading(true);
      setFetchError("");
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/notes/${pid}/${aid}/${[apiField]}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const arr =  data?.data?.[apiField] ?? [];
      arr.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      setNotes(arr);
    } catch (err) {
      console.error(err);
      setFetchError(err?.response?.data?.message || `Failed to fetch ${displayName}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (pid && aid && apiField) fetchNotes(); 
  }, [pid, aid, apiField]);

  const openViewEdit = (note) => {
    setActiveNote(note);
    setModalOpen(true);
  };

  const handleSave = async (newText) => {
    if (!activeNote?._id) return;
    try {
      setSaving(true);
      await axios.put(
        `${VITE_APP_SERVER}/api/v1/notes/update`,
        {
          patientId: pid,
          admissionId: aid,
          field: apiField,
          noteId: activeNote._id,
          newNote: newText, // <- already transformed
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setNotes((prev) =>
        prev.map((n) => (n._id === activeNote._id ? { ...n, note: newText } : n))
      );
      setModalOpen(false);
      setActiveNote(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note) => {
    if (!note?._id) return;
    if (!window.confirm("Delete this note? This cannot be undone.")) return;

    try {
      await axios.delete(`${VITE_APP_SERVER}/api/v1/notes/delete`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        data: {
          patientId: pid,
          admissionId: aid,
          field: apiField,
          noteId: note._id,
        },
      });
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete note.");
    }
  };

  return (
    <div className='w-full portrait:h-[85%] landscape:h-[80%] overflow-y-scroll scrolll    px-5 py-10'>
    
        <div className="w-full flex justify-between items-center ">

             <div>
                <p className='font-semibold text-[24px] text-black '>{displayName}</p>
                <p className='font-semibold text-[18px] text-[#6F3CDB] '> {new Date().toLocaleDateString()}</p>
              </div>

               {/* <button
                onClick={() => setCreateOpen(true)}             
                className="w-[240px] h-[70px] bg-[#6F3CDB] rounded-[10px] flex justify-center items-center gap-x-3 text-[#FDFDFD] font-semibold text-[20px] disabled:opacity-60"
              >            
                Create Notes
              </button> */}

        </div>

      {/* States */}
      {loading && <div className="mt-8 text-zinc-600">Loading notes…</div>}
      {fetchError && !loading && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {fetchError}
        </div>
      )}
      {!loading && !fetchError && notes.length === 0 && (
        <div className="mt-8 rounded-xl border bg-white p-6 text-zinc-600">
         {`No ${displayName} yet`}
        </div>
      )}

      {/* Notes grid */}
      {!loading && !fetchError && notes.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => (
            <div
              key={n._id}
              className="group rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => openViewEdit(n)}
                  className="flex-1 text-left"
                  title="Click to view note"
                >
                  <p className="font-medium leading-6 line-clamp-1 text-zinc-900 ">
                    {n.note || "(empty)"}
                  </p>
                  <p className="mt-1 text-xs text-[#A1A3B2]">
                    {n.addedAt
                      ? new Date(n.addedAt).toLocaleString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </p>
                </button>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={() => openViewEdit(n)}
                    className="p-2 rounded-lg hover:bg-zinc-100"
                    title="Edit"
                    aria-label="Edit note"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(n)}
                    className="p-2 rounded-lg hover:bg-zinc-100"
                    title="Delete"
                    aria-label="Delete note"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      <NoteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveNote(null);
        }}
        note={activeNote}
        onSave={handleSave}
        saving={saving}
        displayName={displayName}
      />

      {/* {createOpen && <ClinicalNotes />} */}
    </div>
  );
};

export default NotesData;
