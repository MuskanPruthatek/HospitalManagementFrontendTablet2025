import { ChevronLeft, LockKeyhole, LockKeyholeOpen, Printer, Share2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomDropdown from '../../../CustomDropdown/CustomDropdown'
import axios from 'axios'
import JoditEditor from "jodit-react";
import { useForm, Controller } from "react-hook-form";
import { usePatient } from '../../../../context/PatientContext'
import { formatDate } from "../../../../Helpers/formatDate"
import { formatTime } from "../../../../Helpers/formatTime"

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const PatientCreateDischargeSummary = () => {
  const navigate = useNavigate();
  const [lock, setLock] = useState(false);

  // add near other state
    const [mode, setMode] = useState("patient"); // 'patient' | 'template'

    const { selectedPatient } = usePatient();
    const admissionId = selectedPatient?.admissionId;
    const patientId = selectedPatient?.patientId
  
    const [patientData, setPatientData] = useState(null);
  
    useEffect(() => {
      if (!selectedPatient?.patientId) return;
      axios
        .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
        .then((res) => setPatientData(res.data.data))
        .catch((err) => console.error(err));
    }, [selectedPatient?.patientId]);

  // NEW: local state for templates and selection
  const [loading, setLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState([]);              // full objects
  const [templateOpts, setTemplateOpts] = React.useState([]);        // labels
  const [templateL2I, setTemplateL2I] = React.useState({});          // label -> id
  const [templateI2L, setTemplateI2L] = React.useState({});          // id -> label
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(""); // chosen id
  const [template, setTemplate] = React.useState(null);              // current template obj

  // Helper: id -> label safely
  const idToLabel = (i2l, id) => (id && i2l[id]) || "";

  // Quick label maps for full object lookup
  const templatesById = React.useMemo(
    () => Object.fromEntries(templates.map(t => [t._id, t])),
    [templates]
  );

  /* ── rich-text jodit toolbar settings ── */
  const joditConfig = React.useMemo(() => ({
    readonly: lock,            // lock toggles read-only
    toolbar: true,
    toolbarAdaptive: false,
    removeButtons: "file image link table",
    buttons: ["bold", "italic", "eraser", "|", "ul", "ol"],
  }), [lock]);


  // Fetch templates once
  const fetchDischargeTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/document-master/dischargetemplate-master`
      );
      const arr = data?.data ?? [];
      setTemplates(arr);
      setTemplateOpts(arr.map((t) => t.saveAsTemplate));
      setTemplateL2I(Object.fromEntries(arr.map((t) => [t.saveAsTemplate, t._id])));
      setTemplateI2L(Object.fromEntries(arr.map((t) => [t._id, t.saveAsTemplate])));
    } catch (err) {
      console.error(err);
      alert("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDischargeTemplates();
  }, []);

  const handleTemplateSelect = (id) => {
  setSelectedTemplateId(id);
  setTemplate(templatesById[id] || null);
  setMode("patient"); // selecting a template doesn't mean editing it yet
};


    function pickAdmission(p) {
    if (!Array.isArray(p?.admissionDetails)) return {};
    return admissionId
      ? p.admissionDetails.find(a => a._id === admissionId) || {}
      : p.admissionDetails[0] || {};
  }

  const ad = pickAdmission(patientData);

    const [list, setList] = useState([])

  const buildDefaults = (fields, tpl) => {
  const obj = {};
  fields.forEach(({ name, type }) => {
    // sensible defaults per type
    const v = tpl?.[name];
    if (type === "checkbox") {
      obj[name] = typeof v === "boolean" ? v : !!v; // coerce
    } else {
      obj[name] = v ?? ""; // text/richtext/select
    }
  });
  return obj;
};

// ⬇️ replace your defaultValues/useForm block with this:
const {
  register,
  control,
  handleSubmit,
  reset,
  formState: { isSubmitting },
} = useForm({
  defaultValues: buildDefaults(list, template),
});

// ⬇️ whenever list or template changes, push values into the form
useEffect(() => {
  if (!list.length) return;
  reset(buildDefaults(list, template));
}, [list, template, reset]);

// ⬇️ add this to decide visibility when status is false but data exists
const hasAnyData = (name) => {
  const v = template?.[name]; // using template since it's the source when editing
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "boolean") return v;       // checkbox stored as boolean
  if (typeof v === "number") return true;
  if (typeof File !== "undefined" && v instanceof File) return v.size > 0;
  if (typeof Blob !== "undefined" && v instanceof Blob) return v.size > 0;
  if (typeof v === "object") {
    return Object.values(v).some((x) => hasAnyData(name, x)); // fallback
  }
  return Boolean(v);
};

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(
          `${VITE_APP_SERVER}/api/v1/document-master/dischargefield-master`
        );
        setList(response.data.data);
        console.log(response.data.data);
      } catch (err) {
        console.error(err);
        console.log(err.response?.data?.message || err.message);
      }
    })();
  }, []);


  /* ── RHF set‑up ── */
  const defaultValues = React.useMemo(() => {
    const obj = {};
    list.forEach(({ name }) => (obj[name] = template?.[name] ?? ""));
    return obj;
  }, [template]);

    // IMPORTANT: whenever template changes, reset the form so fields prefill
  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

const hasValue = (v) => {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "boolean") return true;      // <— include true or false
  if (typeof v === "number") return !Number.isNaN(v);
  if (Array.isArray(v)) return v.length > 0;
  if (typeof File !== "undefined" && v instanceof File) return v.size > 0;
  if (typeof Blob !== "undefined" && v instanceof Blob) return v.size > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
};

const onSubmit = async (data) => {
  try {
    const allowed = new Set(list.map(f => f.name));
    const payload = Object.fromEntries(
      Object.entries(data).filter(([k, v]) => allowed.has(k) && hasValue(v))
    );

    if (mode === "template") {
      // edit the selected master template
      if (!template?._id) {
        alert("No template selected to edit.");
        return;
      }
      await axios.put(
        `${VITE_APP_SERVER}/api/v1/document-master/dischargetemplate-master/${template._id}`,
        payload
      );
      alert("Template updated.");
    } else {
      // save for the patient/admission
      const pid = selectedPatient?.patientId;
      const aid = admissionId;
      if (!pid || !aid) {
        alert("Missing patient/admission.");
        return;
      }
      // optional: include which template was used as source
      const body = { ...payload, templateId: selectedTemplateId || template?._id || null };

      await axios.post(
        `${VITE_APP_SERVER}/api/v1/patient/discharge-template/${pid}/${aid}`,
        body
      );
      alert("Discharge summary saved for patient.");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to save.");
  }
};

  return (
    <div className="w-full h-full bg-white font-inter">
      <div className='w-full h-[94px] bg-[#FDFDFD] drop-shadow-lg drop-shadow-[#18171740] flex justify-between items-center pr-5 '>
        <div className='flex gap-x-4 items-center '>
          <ChevronLeft size={60} onClick={() => navigate(-1)} />
          <p className='font-semibold text-[24px] text-[#282D30] '>Mr. xyz.pdf</p>
        </div>

        <div className='flex gap-x-5 '>
          <div className='w-[97px] h-[70px] bg-[#36D7A0] rounded-[10px] flex justify-center items-center  ' />
          <div className='w-[97px] h-[70px] bg-[#FB8C5C] rounded-[10px] flex justify-center items-center  '>
            <Share2 color='white' size={30} />
          </div>
          <div className='w-[97px] h-[70px] bg-[#50B7FF] rounded-[10px] flex justify-center items-center  '>
            <Printer color='white' size={30} />
          </div>
        </div>
      </div>

      <div className='w-full p-5'>
        <div className='w-full h-fit py-10 px-5 bg-[#6F3CDB] rounded-[10px] flex justify-between items-center flex-row flex-wrap '>
          <div className='flex items-center gap-x-5 '>
            <CustomDropdown
              label="Discharge Summary"
              options={["Discharge Summary", "DAMA/LAMA Discharge", "Transfer Summary", "Transfer/Referral Summary", "Case Summary"]}
            />

            {/* SELECT TEMPLATE */}
            <CustomDropdown
              label="Select Template"
              options={templateOpts}
              selected={idToLabel(templateI2L, selectedTemplateId)}
              placeholder={loading ? "Loading..." : "Pick a template"}
              onChange={(label) => handleTemplateSelect(templateL2I[label])}
            />
          </div>

          {/* Lock/Unlock */}
          <div className='flex flex-col items-center gap-y-2 '>
            <p className='font-semibold text-[16px] text-white '>Lock/Unlock</p>
            <div className="w-[83px] h-[40px] rounded-[25px] bg-[#FDFDFD] flex justify-between items-center px-1 ">
              <div
                onClick={() => setLock(true)}
                className={`w-[32px] h-[32px] rounded-full transition-all duration-500 cursor-pointer ${lock ? "bg-[#36D7A0]  text-white" : "bg-transparent text-[#A1A3B2] "} flex justify-center items-center `}
              >
                <LockKeyhole size={18} />
              </div>
              <div
                onClick={() => setLock(false)}
                className={`w-[32px] h-[32px] rounded-full transition-all duration-500 cursor-pointer ${!lock ? "bg-[#36D7A0]  text-white" : "bg-transparent text-[#A1A3B2] "} flex justify-center items-center `}
              >
                <LockKeyholeOpen size={18} />
              </div>
            </div>
          </div>

          {/* EDIT TEMPLATE */}
          <button
  className='editTemplate w-fit h-[50px] px-3 rounded-[10px] bg-[#FB8C5C] text-[#FDFDFD] font-semibold text-[16px]'
  onClick={() => {
    if (!selectedTemplateId) {
      alert("Please select a template first.");
      return;
    }
    const t = templatesById[selectedTemplateId];
    setTemplate(t || null); // ensure the chosen template is loaded
    setMode("template");    // <<— now we're editing the master template
  }}
>
  Edit Template
</button>

        </div>
      </div>

      <div className="w-full md:portrait:h-[60%] lg:portrait:h-[70%] md:landscape:h-[30%] lg:landscape:h-[60%] overflow-y-scroll scrolll py-10 px-5 ">
        <div className="w-[476px] h-[218px] bg-[#D9D9D9] flex justify-center items-center ">
          <p className="font-semibold text-[18px] text-black ">Logo</p>
        </div>

        {/* header grid (kept as-is) */}
       <div className="w-full flex justify-between items-end mt-8">
                       <div className="w-[50%] flex flex-col gap-y-3 text-[20px] font-semibold text-black ">
       
                          <p>UHID No: <b className='text-[#8f91a0] ml-2 font-semibold '>{patientData?.identityDetails?.uhidNo ?? "-"}</b></p>
                          <p>Name of Patient: <b className='text-[#8f91a0] ml-2 font-semibold '>{patientData?.identityDetails?.salutation ?? "-"} {patientData?.identityDetails?.patientName ?? "-"}</b></p>
                          <p>Address: <b className='text-[#8f91a0] ml-2 font-semibold '>{patientData?.identityDetails?.address ?? "-"}</b></p>
                          <p>Age: <b className='text-[#8f91a0] ml-2 font-semibold '>{patientData?.identityDetails?.age?.years ?? "-"} years, {patientData?.identityDetails?.age?.months ?? "-"} months</b></p>
                          <p>Treating Consultant name: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.consultingDoctorId?.doctorName ?? "-"}</b></p>
                          <p>TPA: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.tpaName ?? "-"}</b></p>
                          <p>Policy no: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.policyNo ?? "-"}</b></p>
                          <p>Date of Admission: <b className='text-[#8f91a0] ml-2 font-semibold '>{formatDate(ad?.admissionDate ?? "-")}</b></p>
                          <p>Date of Discharge: </p>
                       </div>
       
                       <div className="w-[50%] flex flex-col gap-y-3 text-[20px] font-semibold text-black ">
                           <p>IPD No: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.ipdNo ?? "-"}</b></p>
                           <p>Gender: <b className='text-[#8f91a0] ml-2 font-semibold '>{patientData?.identityDetails?.uhidNo ?? "-"}</b></p>
                           <p>Ref. By: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.referredByDoctorId?.doctorName ?? "-"}</b></p>
                           <p>Insurance: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.insurance ?? "-"}</b></p>
                           <p>CCN No: <b className='text-[#8f91a0] ml-2 font-semibold '>{ad?.ccnNo ?? "-"}</b></p>
                           <p>Time of Admission: <b className='text-[#8f91a0] ml-2 font-semibold '>{formatTime(ad?.admissionTime ?? "-")}</b></p>
                           <p>Time of Discharge: </p>
                       </div>
                   </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 border border-[#C4C8D2] divide-y divide-gray-200 mt-5"
        >
           {list.filter((f) => f.status || hasAnyData(f.name))
            .map(({ name, label, type }) => {
              const isText = type === "text";
              const isSelect = type === "select";
              const isSelect2 = type === "select2";
              const isRich = type === "richtext";
              const isCheckbox = type === "checkbox";

              const finalLabel =
      String(label || "").trim().toLowerCase() === "acknowledgement"
        ? "I have been given medicines and care to be given at home. Received all the xrays, reports and discharge summary"
        : label;


            return (
              <React.Fragment key={name}>
                <label
                  htmlFor={name}
                  className="px-4 py-3 text-sm font-medium bg-white border-b border-r border-[#C4C8D2]"
                >
                  {finalLabel}
                </label>

                <div className="px-4 py-3 bg-white border-b border-[#C4C8D2]">
                  {isText && (
                    <input
                      id={name}
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      disabled={lock}
                      {...register(name)}
                    />
                  )}

                  {isRich && (
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => (
                        <JoditEditor
                          value={field.value}
                          config={joditConfig}
                          onBlur={(content) => field.onChange(content)}
                        />
                      )}
                    />
                  )}

                  {isCheckbox && (
                    <Controller
                      name={name}
                      control={control}
                      defaultValue={false}
                      render={({ field }) => (
                        <input
                          id={name}
                          type="checkbox"
                          className="w-10 h-10 px-3 py-2 border rounded accent-[#36D7A0]"
                          disabled={lock}
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}

          <div className="col-span-2 flex justify-center my-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-fit h-[40px] px-5 rounded-[8px] bg-[#6F3CDB] text-white font-semibold text-[15px] disabled:opacity-50"
            >
              {mode === "template" ? "Update Template" : "Save for Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientCreateDischargeSummary;
