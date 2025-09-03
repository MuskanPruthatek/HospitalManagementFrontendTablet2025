import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdmissionDetailsForm from "./AdmissionDetailsForm";
import IdentityDetailsForm from "./IdentityDetailsForm";
import PatientSignature from "./PatientSignature";
import axios from "axios";
import { EMPTY } from "./Helpers/helperFunctions";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
const REG_ENDPOINT = `${VITE_APP_SERVER}/api/v1/patient`;



const RegisterPatient = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Identity Details");

const validate = () => {
  const { emergencyNo, relativeDetails } = data.admissionDetails;
  const { contactNo, whatsappNo, aadharDetails, panCardDetails } = data.identityDetails;

  // helpers
  const isTenDigits = v => /^\d{10}$/.test(v);
  const isTwelveDigits = v => /^\d{12}$/.test(v);
  const isValidPAN = v => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);

  // required numbers
  if (!isTenDigits(emergencyNo))   return alert("Emergency no must be 10 digits"), false;
  if (!isTenDigits(contactNo))     return alert("Contact no must be 10 digits"), false;

  // optional numbers – validate only if user entered something
  if (whatsappNo && !isTenDigits(whatsappNo))
    return alert("WhatsApp no must be 10 digits"), false;

  if (relativeDetails?.relativeContactNo &&
      !isTenDigits(relativeDetails.relativeContactNo))
    return alert("Relative contact no must be 10 digits"), false;

  // optional ID fields
  if (aadharDetails?.aadharNo && !isTwelveDigits(aadharDetails.aadharNo))
    return alert("Aadhar no must be 12 digits"), false;

  if (panCardDetails?.panCardId &&
      !isValidPAN(panCardDetails.panCardId.toUpperCase()))
    return alert("PAN must be 10 chars: 5 letters, 4 digits, 1 letter"), false;

  return true;
};

  const appendNested = (fd, obj, parentKey = "") => {
    Object.entries(obj).forEach(([key, val]) => {
      if (val === "" || val === undefined || val === null) return; // skip empties

      const formKey = parentKey ? `${parentKey}[${key}]` : key; // root key has no brackets

      if (val instanceof File || val instanceof Blob) {
        fd.append(formKey, val); // file
      } else if (typeof val === "object" && !(val instanceof Date)) {
        appendNested(fd, val, formKey); // dive deeper
      } else {
        fd.append(formKey, val); // primitive
      }
    });
  };

  const [data, setData] = useState(EMPTY)

  const merge = (section, payload) =>
    setData((p) => ({ ...p, [section]: { ...p[section], ...payload } }));

  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    if (!validate()) return;

    const fd = new FormData();
    appendNested(fd, data);

    try {
      
      await axios.post(REG_ENDPOINT, fd);
      alert("Patient registered successfully!");
      setData(EMPTY);
      setTab("Identity Details");
    } catch (err) {
      console.error(err);
      alert("Registration failed – check console.");
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="w-[100%] bg-[#F4F6FA] h-[95%] px-8 py-4   font-inter relative ">
      <div className="flex w-full justify-between items-center ">
        <p className="text-[#282D30] text-[22px] font-semibold ">
          Register Patient
        </p>

        <p
          onClick={() => {
            setActive("Overview");
            navigate("/main/dashboard");
          }}
          className="text-[#A1A3B2] cursor-pointer text-[14px] font-medium "
        >
          Home /{" "}
          <b className="text-[#6F3CDB] font-medium ">Patient Registration</b>
        </p>
      </div>

      <div className="w-[100%] bg-[#F4F6FA] h-[95%] scrolll2  overflow-y-scroll font-inter ">
        <div className=" w-full h-[145px] mt-3 bg-[#FDFDFD] rounded-[8px] border-[0.6px] border-[#C4C8D2] ">
          <div className="flex w-full justify-end p-1.5">
            <button onClick={()=>setData(EMPTY)} className="w-[85px] h-[36px] rounded-[8px] cursor-pointer bg-[#36D7A0] text-white text-[15px] font-medium ">
              Reset
            </button>
          </div>

          <form className="registrationForm flex gap-x-6 items-center justify-center">
            <p className="font-medium text-[16px] text-[#282D30] ">
              Registration Type:
            </p>

           {["IPD", "OPD", "Registration", "Day Care", "Dialysis"].map((opt) => (
            <div className="flex gap-x-2 items-center">
              <input
                type="radio"
                  name="registrationType"
                  value={opt}
                  checked={data.admissionDetails.registrationType === opt}
                  onChange={(e) =>
                    merge("admissionDetails", { registrationType: e.target.value })
                  }
                className="accent-[#36D7A0] w-5 h-5 "
              />
              <p className="font-normal text-[14px] text-[#282D30] ">{opt}</p>
            </div>
             ))}
          </form>

          <div className="flex gap-x-6 items-center justify-center mt-4">
            <p className="font-medium text-[16px] text-[#282D30] ">ABHA:</p>
            <button className="bg-[#6F3CDB] text-white w-[168px] h-[36px] rounded-[8px] font-medium text-[15px] ">
              Create New ABHA
            </button>
          </div>
        </div>

        <div className="w-full h-fit bg-[#FDFDFD] rounded-[8px] mt-3 ">
          <div className="w-full h-[80px] p-1.5 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.06)] rounded-[8px] flex gap-x-3 justify-between items-center  ">
           
            <div
              onClick={() => setTab("Identity Details")}
              className={`w-[50%] h-full cursor-pointer ${
                tab === "Identity Details" ? "bg-[#F6EEFC]" : "bg-transparent "
              }  rounded-[8px] flex flex-col items-center justify-center `}
            >
              <div className="flex gap-x-3 items-center ">
                {tab === "Identity Details" ? (
                  <img src="/assets/identityDetails2.svg" />
                ) : (
                  <img src="/assets/identityDetails.svg" />
                )}
                <p className="font-semibold text-[18px] text-[#282D30] ">
                  Identity Details
                </p>
              </div>

              <p className="font-medium text-[14px] text-[#A1A3B2] ">
                Address/Aadhar/PanCard
              </p>
            </div>        
           
            <div
              onClick={() => setTab("Admission Details")}
              className={`w-[50%] h-full cursor-pointer ${
                tab === "Admission Details" ? "bg-[#F6EEFC]" : "bg-transparent "
              }  rounded-[8px] flex flex-col items-center justify-center `}
            >
              <div className="flex gap-x-3 items-center ">
                {tab === "Admission Details" ? (
                  <img src="/assets/hospitalStaff.svg" />
                ) : (
                  <img src="/assets/admissionDetails.svg" />
                )}
                <p className="font-semibold text-[18px] text-[#282D30] ">
                  Admission Details
                </p>
              </div>

              <p className="font-medium text-[14px] text-[#A1A3B2] ">
                Patient Information
              </p>
            </div>          

            <div
              onClick={() => setTab("Patient's Signature")}
              className={`w-[50%] h-full cursor-pointer ${
                tab === "Patient's Signature"
                  ? "bg-[#F6EEFC]"
                  : "bg-transparent "
              }  rounded-[8px] flex flex-col items-center justify-center `}
            >
              <div className="flex gap-x-3 items-center ">
                {tab === "Patient's Signature" ? (
                  <img src="/assets/signature2.svg" />
                ) : (
                  <img src="/assets/signature.svg" />
                )}
                <p className="font-semibold text-[18px] text-[#282D30] ">
                  Patient's Signature
                </p>
              </div>

              <p className="font-medium text-[14px] text-[#A1A3B2] ">
                Signature
              </p>
            </div>
          </div>

          {tab === "Admission Details" && (
            <AdmissionDetailsForm
              value={data.admissionDetails}
              onChange={(payload) => merge("admissionDetails", payload)}
            />
          )}

          {tab === "Identity Details" && (
            <IdentityDetailsForm
              value={data.identityDetails}
              onChange={(payload) => merge("identityDetails", payload)}
            />
          )}
          {tab === "Patient's Signature" && (
           <PatientSignature
  value={data.admissionDetails.signatureDetails}
  onChange={(partial) =>
    setData((prev) => ({
      ...prev,
      admissionDetails: {
        ...prev.admissionDetails,
        signatureDetails: {
          ...prev.admissionDetails.signatureDetails,
          ...partial, // ← merges whichever signature just changed
        },
      },
    }))
  }
/>
          )}

          {/* global action buttons (preview / download / send etc.) */}
          {/* <button onClick={onSubmit} className="hidden">Save</button> */}
          <div className="p-6 flex justify-end">
            <button
              onClick={onSubmit}
              type="submit"
              className="px-6 py-2 bg-[#6F3CDB] text-white rounded-[8px] font-medium"
            >
             {loading ? "Saving..." : "Save"} 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;
