import React, { useEffect, useState } from "react";
import { usePatient } from "../../../../context/PatientContext";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, Plus } from "lucide-react";
import JoditEditor from "jodit-react";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import CustomDropdown from "../../../CustomDropDown/CustomDropdown";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { formatDate } from "../../../../Helpers/formatDate"
import { formatTime } from "../../../../Helpers/formatTime"

/* ── flat field schema (unchanged) ── */
const fields = [
  { name: "templateName", label: "Template", type: "select3"},
  { name: "nameOfSurgery", label: "Name of Surgery", type: "text" },
  { name: "diagnosis", label: "Diagnosis", type: "text" },
  { name: "procedureGrade", label: "Procedure Grade", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "primarySurgeon", label: "Primary Surgeon", type: "select" },
  { name: "associateSurgeon", label: "Associate Surgeon", type: "select" },
  { name: "assistantSurgeon", label: "Assistant Surgeon", type: "select" },
  { name: "anaesthetist", label: "Anaesthetist", type: "select" },
  { name: "nurse", label: "Nurse", type: "select2" },
  { name: "typeOfAnaesthesia", label: "Type of Anaesthesia", type: "text" },
  { name: "operativeNotes", label: "Operative Notes", type: "richtext" },
  { name: "operativeFindings", label: "Operative Findings", type: "richtext" },
  { name: "implant", label: "Implant", type: "richtext" },
  { name: "incision", label: "Incision", type: "richtext" },
  { name: "partPreparation", label: "Part Preparation", type: "richtext" },
  { name: "drain", label: "Drain", type: "richtext" },
  { name: "biopsy", label: "Biopsy", type: "richtext" },
  { name: "dressing", label: "Dressing", type: "richtext" },
  { name: "suturing", label: "Suturing", type: "richtext" },
  { name: "comments", label: "Comments", type: "richtext" },
  { name: "postoperativeInstruction", label: "Postoperative Instruction", type: "richtext" },
  { name: "bloodGroup", label: "Blood Group", type: "text" },
  { name: "bloodLoss", label: "Blood Loss", type: "text" },
  { name: "bloodTransfusion", label: "Blood Transfusion", type: "text" },
  { name: "histoPathologySampleSendTo", label: "Histo Pathology Sample Sent To", type: "text" },
  { name: "opReport", label: "OP Report", type: "text" },
  { name: "anaesthesia", label: "Anaesthesia", type: "text" },
  { name: "positioning", label: "Positioning", type: "text" },
  { name: "surgicalProcedure", label: "Surgical Procedure", type: "text" },
  { name: "saveAsTemplate", label: "Save as Template", type: "text" },
];

/* ── rich‑text jodit toolbar settings ── */
const joditConfig = {
  readonly: false,
  toolbar: true,
  toolbarAdaptive: false,
  removeButtons: "file image link table",
  buttons: ["bold", "italic", "eraser", "|", "ul", "ol"],
};

const OperativeNotes = () => {

  const navigate = useNavigate()

     const [openForm, setOpenForm] = useState(false);
     const [templates,setTemplates] = useState([])
     const [selectedTemplate, setSelectedTemplate] = useState(null);
     const [loading, setLoading] = useState(false)
    //  const [errors, setErrors] = useState()
   
     const fetchOTTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/document-master/otnotestemplate-master`
      );
       setTemplateOpts(data.data.map((t) => t.saveAsTemplate));
        setTemplateL2I(Object.fromEntries(data.data.map((t) => [t.saveAsTemplate, t._id])));
        setTemplateI2L(Object.fromEntries(data.data.map((t) => [t._id, t.saveAsTemplate])));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTTemplates();
  }, []);

  const { selectedPatient } = usePatient();
  const admissionId = selectedPatient?.admissionId;

  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    if (!selectedPatient?.patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${selectedPatient?.patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedPatient?.patientId]);

  const normalizeForForm = (tpl) => {
    if (!tpl) return {};
    const obj = {};
    fields.forEach(({ name }) => (obj[name] = tpl?.[name] ?? ""));
    ["primarySurgeon", "associateSurgeon", "assistantSurgeon", "anaesthetist", "nurse"].forEach((k) => {
      const v = obj[k];
      if (v && typeof v === "object") obj[k] = v._id ?? "";
    });
    // store chosen template id in the "templateName" field so the dropdown shows it selected
    if (tpl?._id) obj.templateName = tpl._id;
    return obj;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,                 
    formState: { isSubmitting },
  } = useForm({
    defaultValues: normalizeForForm(selectedTemplate || null), // initial—also supports edit mode via prop
  });

    useEffect(() => {
    if (selectedTemplate) {
      reset(normalizeForForm(selectedTemplate));
    }
  }, [selectedTemplate, reset]);

   const fetchTemplateById = async (id) => {
    if (!id) return;
    try {
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/document-master/otnotestemplate-master/${id}`
      );
      const tpl = data?.data || null;
      setSelectedTemplate(tpl);
    } catch (err) {
      console.error("Failed to fetch template by id", err);
    }
  };

  /* ── dropdown option state ── */
  const [doctorOpts, setDoctorOpts] = useState([]);
  const [doctorL2I, setDoctorL2I] = useState({});
  const [doctorI2L, setDoctorI2L] = useState({});

  const [nurseOpts, setNurseOpts] = useState([]);
  const [nurseL2I, setNurseL2I] = useState({});
  const [nurseI2L, setNurseI2L] = useState({});

    const [templateOpts, setTemplateOpts] = useState([]);
  const [templateL2I, setTemplateL2I] = useState({});
  const [templateI2L, setTemplateI2L] = useState({});

  /* ── fetch dropdown data once ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${VITE_APP_SERVER}/api/v1/doctor-master`);
        setDoctorOpts(data.data.map((d) => d.doctorName));
        setDoctorL2I(Object.fromEntries(data.data.map((d) => [d.doctorName, d._id])));
        setDoctorI2L(Object.fromEntries(data.data.map((d) => [d._id, d.doctorName])));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${VITE_APP_SERVER}/api/v1/nursing-master`);
        setNurseOpts(data.data.map((n) => n.nurseName));
        setNurseL2I(Object.fromEntries(data.data.map((n) => [n.nurseName, n._id])));
        setNurseI2L(Object.fromEntries(data.data.map((n) => [n._id, n.nurseName])));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* ── submit ── */
  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      if (selectedTemplate?._id) {
        await axios.put(`${VITE_APP_SERVER}/api/v1/document-master/otnotestemplate-master/${selectedTemplate._id}`, payload);
        alert("Template updated successfully!")
      } else {
        await axios.post(`${VITE_APP_SERVER}/api/v1/document-master/otnotestemplate-master`, payload);
        alert("Template added successfully!")
      }
      window.scrollTo(0, 0)
      reset(normalizeForForm({}));
      setSelectedTemplate(null);
      fetchOTTemplates();
    } catch (err) {
      console.error(err);
      alert("Failed to save template");
    }
  };

  /* ── helper — id→label ── */
  const idToLabel = (map, id) => map[id] ?? "";

  function pickAdmission(p) {
    if (!Array.isArray(p?.admissionDetails)) return {};
    return admissionId
      ? p.admissionDetails.find(a => a._id === admissionId) || {}
      : p.admissionDetails[0] || {};
  }

  const ad = pickAdmission(patientData);
  return (
  <div className={`w-full relative h-full overflow-y-scroll bg-white font-inter py-10`}>

        <div className="flex justify-between items-center gap-x-5  pr-5">
          <div onClick={() => navigate(-1)} className='w-[5%] '>
            <ChevronLeft size={60} />
          </div>

          <div className="w-[95%] h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4 ">
          <img src="/assets/patients2.svg" className="w-[24px] h-[30px] " />
          <p className="text-[#6F3CDB] font-semibold text-[20px] flex items-center gap-x-1 ">
            Patient name:&nbsp;
            {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
            {patientData?.identityDetails?.patientName ?? "Loading..."}
            <ArrowRight/> Operative Notes
          </p>
          <div className="flex">
            
          </div>
        </div>
        </div>

        <div className="w-full h-[90%] overflow-y-scroll scrolll py-10 px-5 ">

            <div className="w-[476px] h-[218px] bg-[#D9D9D9] flex justify-center items-center ">
               <p className="font-semibold text-[18px] text-black ">Logo</p>
            </div>

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

            <div className="flex items-center gap-x-8 mt-8">

                <button onClick={()=>setOpenForm(true)} className="w-[60px] h-[60px] rounded-full bg-[#FB8C5C] flex justify-center items-center "><Plus size={30} color="#FDFDFD"/></button>
                <button className="w-[367px] h-[60px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[#FDFDFD] text-[22px] ">Preview Operative Notes</button> 
            </div>


          {openForm &&  <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 border border-[#C4C8D2] divide-y divide-gray-200 mt-5"
        >
          

          {fields.map(({ name, label, type }) => {
            const isText = type === "text";
            const isSelect = type === "select";
            const isSelect2 = type === "select2";
            const isSelect3 = type === "select3";
            const isRich = type === "richtext";

            return (
              <React.Fragment key={name}>
                <label
                  htmlFor={name}
                  className="px-4 py-3 text-sm font-medium bg-white border-b border-r border-[#C4C8D2]"
                >
                  {label}
                </label>
                <div className="px-4 py-3 bg-white border-b border-[#C4C8D2]">
                  {/* {isText && (
                    <input
                      id={name}
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      {...register(name)}
                    />
                  )} */}
                  {isText && (
  <input
    id={name}
    type="text"
    className="w-full px-3 py-2 border rounded"
    {...register(name, name === "saveAsTemplate" ? { required: "Please enter a template name" } : {})}
  />
)}
{/* {errors?.saveAsTemplate && (
  <p className="text-red-500 text-sm">{errors?.saveAsTemplate.message}</p>
)} */}

                   {isSelect3 && (
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => (
                        <CustomDropdown
                          label={loading ? "Loading templates…" : "Select Template"}
                          options={templateOpts}
                          selected={idToLabel(templateI2L, field.value)} // show label from id
                          onChange={(lbl) => {
                            const id = templateL2I[lbl];
                            field.onChange(id);          // keep the id in the form
                            fetchTemplateById(id);       // ⭐ NEW: fetch & prefill
                          }}
                          placeholder="Search…"
                        />
                      )}
                    />
                  )}

                  {isSelect && (
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => (
                        <CustomDropdown label="Select Doctor"
                          options={doctorOpts}
                          selected={idToLabel(doctorI2L, field.value)}
                          onChange={(lbl) => field.onChange(doctorL2I[lbl])}
                          placeholder="Search…"
                        />
                      )}
                    />
                  )}

                  {isSelect2 && (
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => (
                        <CustomDropdown label="Select Nurse"
                          options={nurseOpts}
                          selected={idToLabel(nurseI2L, field.value)}
                          onChange={(lbl) => field.onChange(nurseL2I[lbl])}
                          placeholder="Search…"
                        />
                      )}
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
              {selectedTemplate?._id ? "Update" : "Save"}
            </button>
          </div>
             </form> }

        </div>

  </div>
  )
};

export default OperativeNotes;
