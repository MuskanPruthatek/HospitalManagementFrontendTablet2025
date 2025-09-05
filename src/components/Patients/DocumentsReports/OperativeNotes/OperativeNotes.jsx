import React, { useEffect, useMemo, useState } from "react";
import { usePatient } from "../../../../context/PatientContext";
import axios from "axios";
import { ArrowRight, ChevronLeft, Plus } from "lucide-react";
import JoditEditor from "jodit-react";
import { Controller, useForm } from "react-hook-form";
import CustomDropdown from "../../../CustomDropDown/CustomDropdown";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../../Helpers/formatDate";
import { formatTime } from "../../../../Helpers/formatTime";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const joditConfig = {
  readonly: false,
  toolbar: true,
  toolbarAdaptive: false,
  removeButtons: "file image link table",
  buttons: ["bold", "italic", "eraser", "|", "ul", "ol"],
};

const OperativeNotes = () => {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);

  // master field list for OT Notes layout
  const [list, setList] = useState([]);

  // template master dropdown state/maps
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateOpts, setTemplateOpts] = useState([]);
  const [templateL2I, setTemplateL2I] = useState({});
  const [templateI2L, setTemplateI2L] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // doctor/nurse dropdown state/maps
  const [doctorOpts, setDoctorOpts] = useState([]);
  const [doctorL2I, setDoctorL2I] = useState({});
  const [doctorI2L, setDoctorI2L] = useState({});
  const [nurseOpts, setNurseOpts] = useState([]);
  const [nurseL2I, setNurseL2I] = useState({});
  const [nurseI2L, setNurseI2L] = useState({});

  const { selectedPatient } = usePatient();
  const admissionId = selectedPatient?.admissionId;
  const patientId = selectedPatient?.patientId;

  const [patientData, setPatientData] = useState(null);

  // helpers
  const idToLabel = (map, id) => map[id] ?? "";
  const coerceToId = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object" && v._id) return v._id;
    return "";
  };

  // Build empty/defaults object from list
  const buildDefaults = (fields, tpl) => {
    const obj = {};
    fields.forEach(({ name, type }) => {
      const v = tpl?.[name];
      if (type === "checkbox") {
        obj[name] = typeof v === "boolean" ? v : !!v;
      } else if (type === "select") {
        obj[name] = coerceToId(v); // doctor
      } else if (type === "select2") {
        obj[name] = coerceToId(v); // nurse
      } else if (type === "richtext") {
        obj[name] = v ?? "";
      } else {
        obj[name] = v ?? "";
      }
    });
    return obj;
  };

  // If the template has labels instead of ids, convert using L2I maps
  const normalizeSelectValuesWithMaps = (fields, currentValues) => {
    const next = { ...currentValues };
    fields.forEach(({ name, type }) => {
      if (type === "select") {
        const val = next[name];
        // if it's a label, convert to doctor id
        if (val && !doctorI2L[val] && doctorL2I[val]) next[name] = doctorL2I[val];
      }
      if (type === "select2") {
        const val = next[name];
        // if it's a label, convert to nurse id
        if (val && !nurseI2L[val] && nurseL2I[val]) next[name] = nurseL2I[val];
      }
    });
    return next;
  };

  // a simpler normalize that builds from the template
  const normalizeForForm = (fields, tpl) => {
    const dv = buildDefaults(fields, tpl);
    return normalizeSelectValuesWithMaps(fields, dv);
  };

  // form
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: useMemo(() => buildDefaults(list, null), [list]),
  });

  // fetch OT notes field schema
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${VITE_APP_SERVER}/api/v1/document-master/operative-notes`
        );
        setList(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // fetch patient basics (header)
  useEffect(() => {
    if (!patientId) return;
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${patientId}`)
      .then((res) => setPatientData(res.data.data))
      .catch((err) => console.error(err));
  }, [patientId]);

  // doctor list
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

  // nurse list
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

  // template dropdown data
  const fetchOTTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/document-master/otnotestemplate-master`
      );
      const opts = data.data || [];
      setTemplateOpts(opts.map((t) => t.saveAsTemplate));
      setTemplateL2I(Object.fromEntries(opts.map((t) => [t.saveAsTemplate, t._id])));
      setTemplateI2L(Object.fromEntries(opts.map((t) => [t._id, t.saveAsTemplate])));
    } catch (err) {
      console.error(err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    fetchOTTemplates();
  }, []);

  // fetch a chosen template and reset form values
  const fetchTemplateById = async (id) => {
    if (!id) {
      setSelectedTemplate(null);
      reset(buildDefaults(list, null));
      return;
    }
    try {
      const { data } = await axios.get(
        `${VITE_APP_SERVER}/api/v1/document-master/otnotestemplate-master/${id}`
      );
      const tpl = data?.data || null;
      setSelectedTemplate(tpl);
      // normalize and reset
      const dv = normalizeForForm(list, tpl);
      reset(dv);
    } catch (err) {
      console.error("Failed to fetch template by id", err);
    }
  };

  // submit to patient route (always)
  const hasValue = (v) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (typeof v === "boolean") return true;
    if (typeof v === "number") return !Number.isNaN(v);
    if (Array.isArray(v)) return v.length > 0;
    if (typeof File !== "undefined" && v instanceof File) return v.size > 0;
    if (typeof Blob !== "undefined" && v instanceof Blob) return v.size > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return Boolean(v);
  };

  const hasAnyData = (name) => {
    const v = selectedTemplate?.[name]; // using template since it's the source when editing
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

  const onSubmit = async (formValues) => {
    try {
      const allowed = new Set(list.map((f) => f.name));
      const filteredEntries = Object.entries(formValues).filter(([k, v]) => {
        if (!allowed.has(k)) return false;
        return hasValue(v);
      });
      const payload = Object.fromEntries(filteredEntries);

      await axios.post(
        `${VITE_APP_SERVER}/api/v1/patient/ot-notes-template/${patientId}/${admissionId}`,
        payload
      );

      alert("Operative Notes saved successfully");
      setOpenForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save Operative Notes");
    }
  };

  function pickAdmission(p) {
    if (!Array.isArray(p?.admissionDetails)) return {};
    return admissionId
      ? p.admissionDetails.find((a) => a._id === admissionId) || {}
      : p.admissionDetails[0] || {};
  }
  const ad = pickAdmission(patientData);

  return (
    <div className="w-full relative h-full overflow-y-scroll bg-white font-inter py-10">
      {/* Header */}
      <div className="flex justify-between items-center gap-x-5 pr-5">
        <div onClick={() => navigate(-1)} className="w-[5%] cursor-pointer">
          <ChevronLeft size={60} />
        </div>
        <div className="w-[95%] h-[70px] rounded-[10px] bg-[#F6EEFC] flex px-5 items-center gap-x-4 ">
          <img src="/assets/patients2.svg" className="w-[24px] h-[30px]" />
          <p className="text-[#6F3CDB] font-semibold text-[20px] flex items-center gap-x-1">
            Patient name:&nbsp;
            {patientData?.identityDetails?.salutation ?? "Loading..."}{" "}
            {patientData?.identityDetails?.patientName ?? "Loading..."}
            <ArrowRight /> Operative Notes
          </p>
        </div>
      </div>

      {/* Patient meta */}
      <div className="w-full h-[90%] overflow-y-scroll scrolll py-10 px-5">
        <div className="w-[476px] h-[218px] bg-[#D9D9D9] flex justify-center items-center ">
          <p className="font-semibold text-[18px] text-black">Logo</p>
        </div>

        <div className="w-full flex justify-between items-end mt-8">
          <div className="w-[50%] flex flex-col gap-y-3 text-[20px] font-semibold text-black ">
            <p>
              UHID No:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {patientData?.identityDetails?.uhidNo ?? "-"}
              </b>
            </p>
            <p>
              Name of Patient:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {patientData?.identityDetails?.salutation ?? "-"}{" "}
                {patientData?.identityDetails?.patientName ?? "-"}
              </b>
            </p>
            <p>
              Address:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {patientData?.identityDetails?.address ?? "-"}
              </b>
            </p>
            <p>
              Age:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {patientData?.identityDetails?.age?.years ?? "-"} years,{" "}
                {patientData?.identityDetails?.age?.months ?? "-"} months
              </b>
            </p>
            <p>
              Treating Consultant name:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.consultingDoctorId?.doctorName ?? "-"}
              </b>
            </p>
            <p>
              TPA:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.tpaName ?? "-"}
              </b>
            </p>
            <p>
              Policy no:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.policyNo ?? "-"}
              </b>
            </p>
            <p>
              Date of Admission:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {formatDate(ad?.admissionDate ?? "-")}
              </b>
            </p>
            <p>Date of Discharge: </p>
          </div>

          <div className="w-[50%] flex flex-col gap-y-3 text-[20px] font-semibold text-black ">
            <p>
              IPD No:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.ipdNo ?? "-"}
              </b>
            </p>
            <p>
              Gender:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {patientData?.identityDetails?.gender ?? "-"}
              </b>
            </p>
            <p>
              Ref. By:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.referredByDoctorId?.doctorName ?? "-"}
              </b>
            </p>
            <p>
              Insurance:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.insurance ?? "-"}
              </b>
            </p>
            <p>
              CCN No:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {ad?.ccnNo ?? "-"}
              </b>
            </p>
            <p>
              Time of Admission:
              <b className="text-[#8f91a0] ml-2 font-semibold ">
                {formatTime(ad?.admissionTime ?? "-")}
              </b>
            </p>
            <p>Time of Discharge: </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-x-8 mt-8">
          <button
            onClick={() => setOpenForm(true)}
            className="w-[60px] h-[60px] rounded-full bg-[#FB8C5C] flex justify-center items-center "
          >
            <Plus size={30} color="#FDFDFD" />
          </button>
          <button className="w-[367px] h-[60px] rounded-[14px] bg-[#6F3CDB] font-semibold text-[#FDFDFD] text-[22px] ">
            Preview Operative Notes
          </button>
        </div>

        {/* FORM */}
        {openForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 border border-[#C4C8D2] divide-y divide-gray-200 mt-5"
          >
            {/* Row 0: Select Template */}
            <label className="px-4 py-3 text-sm font-medium bg-white border-b border-r border-[#C4C8D2]">
              Select Template
            </label>
            <div className="px-4 py-3 bg-white border-b border-[#C4C8D2]">
              <CustomDropdown
                label={templatesLoading ? "Loading templates…" : "Select Template"}
                options={templateOpts}
                selected={templateI2L[selectedTemplateId] || ""}
                onChange={async (lbl) => {
                  const id = templateL2I[lbl] || "";
                  setSelectedTemplateId(id);
                  await fetchTemplateById(id); // empty id clears form
                }}
                placeholder="Search…"
              />
            </div>

            {/* Rest of fields */}
            {list.filter((f) => f.status || hasAnyData(f.name)).map(({ name, label, type }) => {
              const isText = type === "text";
              const isSelect = type === "select";
              const isSelect2 = type === "select2";
              const isRich = type === "richText";

              return (
                <React.Fragment key={name}>
                  <label
                    htmlFor={name}
                    className="px-4 py-3 text-sm font-medium bg-white border-b border-r border-[#C4C8D2]"
                  >
                    {label}
                  </label>
                  <div className="px-4 py-3 bg-white border-b border-[#C4C8D2]">
                    {isText && (
                      <input
                        id={name}
                        type="text"
                        className="w-full px-3 py-2 border rounded"
                        {...register(name)}
                      />
                    )}

                    {isSelect && (
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => (
                          <CustomDropdown
                            label="Select Doctor"
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
                          <CustomDropdown
                            label="Select Nurse"
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
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OperativeNotes;
