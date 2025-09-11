import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import ReferredDoctorCreateForm from "../RegisterPatient/ReferredDoctorCreateForm";
import TransferPatientForm from "../EditPatient/TransferPatientForm"
import TransferHistory from "../EditPatient/TransferHistory"
import ChangeConsultantForm from "../EditPatient/ChangeConsultantForm"
import ConsultantHistory from "../EditPatient/ConsultantHistory"
import Camera from "../RegisterPatient/Camera"
import { useAdmissionFlags } from "./Helpers/useAdmissionFlags";
import usePatientMaster from "./Helpers/usePatientMaster";
import { fetchWithCache } from "../../offline/fetchWithCache";
import { useOnline } from "../../offline/useOnline";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const AdmissionDetailsForm = ({ value, onChange, patientId, admissionId }) => {
  const [addNewReferred, setAddNewReferred] = useState(false);
  const [transferHistory, setTransferHistory] = useState(false);
  const [consultantHistory, setConsultantHistory] = useState(false);

  const [selectedFloor, setSelectedFloor] = useState("");
  const online = useOnline()

  const asId = (x) => (x && typeof x === "object" ? x._id : x);
  const asName = (x, key) => (x && typeof x === "object" ? x[key] : "");

  const {
  floors, beds, floorMap, bedMap,
  reasonOpts, reasonL2I, reasonI2L,
  doctorOpts, doctorL2I, doctorI2L,
  refOpts, refL2I, refI2L,
  labOpts, labL2I, labI2L,
  bedOptions, floorOptions,
  fetchBeds, fetchFloors, fetchDoctors, fetchReferredDoctors, fetchLabs, fetchAdmissionReasons,
  loading,
} = usePatientMaster(selectedFloor);

  useEffect(() => {
    // once floors & floorMap are loaded, pick the right label
    if (floors.length && value.floorDetails) {
      const name = floors.find(
        (f) => floorMap[f] === value.floorDetails
      );
      if (name) setSelectedFloor(name);
    }
  }, [floors, floorMap, value.floorDetails]);


  const handleFlatChange = (e) => {
    const { name, type, value: v, checked, files } = e.target;
    onChange({
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : v,
    });
  };

  const handleNestedChange = (outer, inner, newValOrEvt) => {
    const val =
      newValOrEvt && newValOrEvt.target
        ? newValOrEvt.target.type === "checkbox"
          ? newValOrEvt.target.checked
          : newValOrEvt.target.type === "file"
            ? newValOrEvt.target.files[0]
            : newValOrEvt.target.value
        : newValOrEvt;

    onChange({
      [outer]: {
        ...value[outer],
        [inner]: val,
      },
    });
  };

 useEffect(() => {
      fetchAdmissionFields()
    }, []);

  const [admissionFields, setAdmissionFields] = useState([]);

   const fetchAdmissionFields = (forceOnline = false) =>
      fetchWithCache({
        collection: "admissionFields",
        url: `${VITE_APP_SERVER}/api/v1/document-master/admissionform-master`,
        setItems: setAdmissionFields,
        forceOnline,           
      });
  
  const { show } = useAdmissionFlags(admissionFields);

  // helper to check if a field has any data in value
const hasData = (uiKey) => {
  const val = value[uiKey];

  if (val == null) return false;

  // handle nested objects like age, aadharDetails, panCardDetails, etc.
  if (typeof val === "object") {
    return Object.values(val).some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );
  }

  return String(val).trim() !== "";
};

// override show() to also consider existing data
const shouldShow = (uiKey) => {
  return show(uiKey) || hasData(uiKey);
};

  return (
    <div className="w-full relative mt-5 pb-6 ">
      <div className="w-[95%] flex justify-center mx-auto gap-x-2 ">
        <form className="w-[50%] flex flex-col gap-y-5 ">


          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Reason for Admission:</p>
            <div className="w-[60%]">
              <CustomDropdown label="Select Reason"
                options={reasonOpts}
                selected={reasonI2L[value.admissionReasonId] || ""}
                onChange={label => onChange({ admissionReasonId: reasonL2I[label] })}
              />

            </div>
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">IPD No*:</p>
            <input
              type="text"
              name="ipdNo"
              required
              placeholder="IPD No"
              value={value.ipdNo}
              onChange={handleFlatChange}
              className="input "
            />
          </div>

          {shouldShow("emergencyNo") && (<div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Emergency No:</p>
            <input
              type="number"
              name="emergencyNo"
              placeholder="Emergency No"
              value={value.emergencyNo}
              onChange={handleFlatChange}
              className="input "
            />
          </div>)}

          <div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Floor Number:</p>
            <div className="w-[60%] ">             
               <CustomDropdown label="Select Floor"
                options={floorOptions}
                
                selected={
    Object.keys(floorMap).find(k => floorMap[k] === value.floorId) || ""
  }
  onChange={(label) => {
    onChange({ floorId: floorMap[label], bedId: "" });
    setSelectedFloor(label);        
  }}
              />
            </div>
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end ">

            <div className="flex w-full gap-x-3 items-center justify-end ">
              <p className="label ">Bed Number:</p>
              <div className="w-[60%]">
                <CustomDropdown label="Select Bed"
                  options={bedOptions}
                  selected={
                    bedOptions.find((l) => bedMap[l] === value.bedId) || ""
                  }
                  onChange={(label) => onChange({ bedId: bedMap[label] })}
                />

              </div>
            </div>
          </div>

          {shouldShow("bedDepartment") && (<div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Bed Department:</p>
            <input
              type="text"
              placeholder=" Search Bed Department"
              className="input "
              name="bedDepartment"
              value={value.bedDepartment}
              onChange={handleFlatChange}
            />
          </div>)}

          {/* Weight */}
          {shouldShow("weight") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Weight (kg):</p>
            <input
              type="number"
              className="input"
              name="weight"
              value={value.weight}
              onChange={handleFlatChange}
            />
          </div>)}

          {shouldShow("height") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Height (cm):</p>
            <input
              type="number"
              className="input"
              name="height"
              value={value.height}
              onChange={handleFlatChange}
            />
          </div>)}

          {/* Blood Group */}
          {shouldShow("bloodGroup") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Blood Group:</p>
            <div className="w-[60%]">
              <CustomDropdown label="Select Blood Group"
                options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                selected={value.bloodGroup}
                onChange={(label) => onChange({ bloodGroup: label })}
              />
            </div>
          </div>)}

          {shouldShow("patientType") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Patient Type:</p>
            <div className="w-[60%]">
              <CustomDropdown label="Select Patient Type"
                options={["New", "Old"]}
                selected={value.patientType}
                onChange={(label) => onChange({ patientType: label })}
              />
            </div>
          </div>)}

          {shouldShow("patientStatus") && (<div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Patient Status:</p>
            <div className="w-[60%]">
              <CustomDropdown label="Select Patient Status"
                options={["Admitted", "Discharged"]}
                selected={value.patientStatus}
                onChange={(label) => onChange({ patientStatus: label })}
              />
            </div>
          </div>)}

          {shouldShow("applicableClass") && (<div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Applicable Class:</p>
            <div className="w-[60%]">
              <CustomDropdown label="Select Applicable Class"
                options={["Emergency", "Semi Special"]}
                selected={value.applicableClass}
                onChange={(label) => onChange({ applicableClass: label })}
              />
            </div>
          </div>)}

          <div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Admission Date*:</p>
            <input type="date" className="input " required name="admissionDate"
              value={value.admissionDate} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label ">Time of Admission*:</p>
            <input type="time" className="input " required name="admissionTime"
              value={value.admissionTime} onChange={handleFlatChange} />
          </div>


          <div className="flex w-full gap-x-3 items-center justify-end ">
            <p className="label">Consulting Doctor*:</p>
            <div className="w-[60%]">
              <CustomDropdown label="Select Doctor"
                options={doctorOpts}
                selected={doctorI2L[value.consultingDoctorId] || ""}
                onChange={label => onChange({ consultingDoctorId: doctorL2I[label] })}
              />
            </div>
          </div>


<div className="w-full">
          {shouldShow("referredByDoctorId") && (   <div className="flex w-full gap-x-3 items-center justify-end ">
              <p className="label">Referred by Doctor:</p>
              <div className="w-[60%]">
                <CustomDropdown label="Select Referred Doctor"
                  options={refOpts}
                  selected={refI2L[value.referredByDoctorId] || ""}
                  onChange={(label) =>
                    onChange({ referredByDoctorId: refL2I[label] })
                  }
                />
              </div>
            </div> )}

            <div className="flex justify-end mt-5  w-full">
              <button
                type="button"
                onClick={() => setAddNewReferred(true)}
                className="w-[60%] bg-[#ED1F22] h-[48px] rounded-[10px] font-medium cursor-pointer text-white  "
              >
                Add New Referred Doctor
              </button>
            </div>         
          </div>

          {/* Referral From Doctor (free-text, different from select box) */}
         {shouldShow("referralFromDoctor") && (  <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Referral From Doctor:</p>
            <input
              type="text"
              className="input"
              name="referralFromDoctor"
              value={value.referralFromDoctor}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("referredByDoctorSelectBox") && (  <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Referred By Doctor Select Box:</p>
            <input
              type="text"
              className="input"
              name="referredByDoctorSelectBox"
              value={value.referredByDoctorSelectBox}
              onChange={handleFlatChange}
            />
          </div> )}

        {shouldShow("otherConsultant") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Other Consultant:</p>
            <input
              className="input"
              name="otherConsultant"
              value={value.otherConsultant}
              onChange={handleFlatChange}
            />
          </div> )}

          <div className="flex w-full gap-x-3  justify-end">
            <p className="label">Patient Detail:</p>


            <div className="flex gap-x-5 items-center w-[60%]">
              {["Birth", "Expired"].map(mode => (
                <label key={mode} className="flex gap-x-2 items-center">
                  <input
                    type="radio" name="patientDetail" value={mode}
                    checked={value.patientDetail === mode}
                    onChange={handleFlatChange}
                    className="w-5 h-5 accent-[#36D7A0]"
                  />
                  <span className="font-normal text-[14px] text-[#2C2C2E]">{mode}</span>
                </label>
              ))}

              <span className="text-[#ED1F22] text-[14px] font-medium cursor-pointer">
                Reset
              </span>
            </div>
          </div>

         {shouldShow("mlcType") && ( <div className="flex w-full gap-x-3  justify-end">
            <p className="label">Patient MLC Type:</p>

            <div className="flex gap-x-5 items-center w-[60%]">
              {[
                { label: "MLC", value: true },
                { label: "Non-MLC", value: false },
              ].map(({ label, value: boolVal }) => (
                <label key={label} className="flex gap-x-2 items-center">
                  <input
                    type="radio"
                    name="mlcType"
                    value={boolVal}
                    checked={value.mlcType === boolVal}
                    onChange={() => onChange({ mlcType: boolVal })}
                    className="w-5 h-5 accent-[#36D7A0]"
                  />
                  <span className="font-normal text-[14px] text-[#2C2C2E]">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div> )}

        {shouldShow("mlcNo") && (  <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">MLC No:</p>
            <input
              type="text"
              placeholder="MLC No"
              className="input"
              name="mlcNo"
              value={value.mlcNo}
              onChange={handleFlatChange}
            />
          </div> )}

{/* Birth Asphyxia + NICU shifted */}
          {shouldShow("birthAsphyxiaAndNICUShifted") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Birth Asphyxia &amp; NICU Shifted:</p>
            <div className="w-[60%] ">
            <input
              type="checkbox"
              name="birthAsphyxiaAndNICUShifted"
              checked={value.birthAsphyxiaAndNICUShifted}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

          {/* Term of baby, Mode of delivery, Baby illness */}
         {shouldShow("termOfBaby") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Term of Baby:</p>
            <input
              type="text"
              className="input"
              name="termOfBaby"
              value={value.termOfBaby}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("modeOfDelivery") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Mode of Delivery:</p>
            <input
              type="text"
              className="input"
              name="modeOfDelivery"
              value={value.modeOfDelivery}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("babyIllness") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Baby Illness:</p>
            <input
              type="text"
              className="input"
              name="babyIllness"
              value={value.babyIllness}
              onChange={handleFlatChange}
            />
          </div> )}

          {/* Husband name / Food pref (useful in maternity) */}
          {shouldShow("husbandName") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Husband Name:</p>
            <input
              type="text"
              className="input"
              name="husbandName"
              value={value.husbandName}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("foodPreference") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Food Preference:</p>
            <input
              type="text"
              className="input"
              name="foodPreference"
              value={value.foodPreference}
              onChange={handleFlatChange}
            />
          </div> )}

          {/* Birth time & Mother age */}
         {shouldShow("birthTime") && (  <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Birth Time:</p>
            <input
              type="time"
              className="input"
              name="birthTime"
              value={value.birthTime}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("motherAge") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Mother Age:</p>
            <input
              type="number"
              className="input"
              name="motherAge"
              value={value.motherAge}
              onChange={handleFlatChange}
            /> 
          </div>)}

         {/* Operations */}
         {shouldShow("operations") && (  <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Operations:</p>
            <input
              type="text"
              className="input"
              name="operations"
              value={value.operations}
              onChange={handleFlatChange}
            />
          </div> )}

          {/* Laboratory Selection */}
           {shouldShow("laboratorySelectionId") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Laboratory Selection:</p>
            <div className="w-[60%] ">
            <CustomDropdown label="Select Laboratory"
                options={labOpts}
                selected={labI2L[value.laboratorySelectionId] || ""}
                onChange={(label) =>
                  onChange({ laboratorySelectionId: labL2I[label] })
                }
              />
            </div>
          </div> )}

          {/* COVID Report */}
         {shouldShow("covidReport") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">COVID Report:</p>
            <input
              type="text"
              className="input"
              name="covidReport"
              value={value.covidReport}
              onChange={handleFlatChange}
            />
          </div> )}

          {/* Vaccination Details */}
         {shouldShow("vaccinationDetails") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Vaccination Details:</p>
            <input
              type="text"
              className="input"
              name="vaccinationDetails"
              value={value.vaccinationDetails}
              onChange={handleFlatChange}
            />
          </div> )}

          {/* Clinical & Billing discharge checkboxes */}
         {shouldShow("clinicalDischarge") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Clinical Discharge:</p>
            <div className="w-[60%] ">
            <input
              type="checkbox"
              name="clinicalDischarge"
              checked={value.clinicalDischarge}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

         {shouldShow("billingDischarge") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap ">Billing Discharge:</p>
             <div className="w-[60%] ">
            <input
              type="checkbox"
              name="billingDischarge"
              checked={value.billingDischarge}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

          {/* Pharmacy & Lab discharge */}
         {shouldShow("pharmacyDischarge") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Pharmacy Discharge:</p>
             <div className="w-[60%] ">
            <input
              type="checkbox"
              name="pharmacyDischarge"
              checked={value.pharmacyDischarge}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

         {shouldShow("labDischarge") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Lab Discharge:</p>
             <div className="w-[60%] ">
            <input
              type="checkbox"
              name="labDischarge"
              checked={value.labDischarge}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

          {/* Maintain MRD file */}
          {shouldShow("maintainMRDFileStatus") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Maintain MRD File:</p>
             <div className="w-[60%] ">
            <input
              type="checkbox"
              name="maintainMRDFileStatus"
              checked={value.maintainMRDFileStatus}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

          {/* Add Diet Module / Clinical Score Calculator */}
         {shouldShow("addDietModule") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Add Diet Module:</p>
             <div className="w-[60%] ">
            <input
              type="checkbox"
              name="addDietModule"
              checked={value.addDietModule}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

         {shouldShow("useClinicalScoreCalculator") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Use Clinical Score Calculator:</p>
            <div className="w-[60%] ">
            <input
              type="checkbox"
              name="useClinicalScoreCalculator"
              checked={value.useClinicalScoreCalculator}
              onChange={handleFlatChange}
              className="w-5 h-5 accent-[#36D7A0]"
            />
            </div>
          </div> )}

          {/* CPT */}
         {shouldShow("CPT") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">CPT:</p>
            <input
              type="text"
              className="input"
              name="CPT"
              value={value.CPT}
              onChange={handleFlatChange}
            />
          </div> )}

      {shouldShow("relativeDetails") && ( <>
       <div className="flex w-full gap-x-3 items-center justify-end ">
          <p className="label ">Responsible Person:</p>
          <input
            type="text"
            placeholder="Responsible Person"
            className="input "
            // name="responsiblePerson"    
             value={value.relativeDetails.responsiblePerson}
             onChange={(e) =>
             handleNestedChange("relativeDetails", "responsiblePerson", e)
             }
          />
        </div> 

        <div className="flex w-full gap-x-3 items-center justify-end">
          <p className="label">Relationship:</p>
          <div className="w-[60%] ">
            <CustomDropdown label="Select Relationship"
              options={["Parent", "Spouse", "Sibling", "Other"]}
              selected={value.relativeDetails.relationship}
              onChange={(e) =>
             handleNestedChange("relativeDetails", "relationship", e)
             }
            />
          </div>
        </div>

        <div className="flex w-full gap-x-3 items-center justify-end ">
          <p className="label ">Relative Contact No:</p>
          <input
            type="number"
            placeholder="Relative Contact No"
            className="input "
            // name="relativeContactNo"
            value={value.relativeDetails.relativeContactNo}
             onChange={(e) =>
             handleNestedChange("relativeDetails", "relativeContactNo", e)
             }
          />
        </div> 
        </>)}

        {/* Employer company name & TID number */}
         {shouldShow("employerCompanyName") && (   <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label whitespace-nowrap">Employer / Company Name:</p>
            <input
              type="text"
              className="input"
              name="employerCompanyName"
              value={value.employerCompanyName}
              onChange={handleFlatChange}
            />
          </div> )}
          
         {shouldShow("TIDNumber") && (   <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">TID Number:</p>
            <input
              type="text"
              className="input"
              name="TIDNumber"
              value={value.TIDNumber}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("paymentMode") && (  <div className="flex w-full gap-x-3 items-start justify-end">
            <p className="label pt-2">Payment Mode</p>
            <div className="grid grid-cols-3 gap-2 w-[60%]">
              {[
                "Cash",
                "TPA",
                "Insurance",
                "Scheme",
                "Corporate",
                "Package",
                "Reimbursement",
              ].map((mode) => (
                <label key={mode} className="flex gap-x-2 items-center">
                  <input
                    type="radio"
                    name="paymentMode"
                    value={mode}
                    checked={value.paymentMode === mode}
                    onChange={handleFlatChange}
                    className="w-5 h-5 accent-[#36D7A0] shrink-0"
                  />
                  <span className="font-normal text-[14px] text-[#2C2C2E]">
                    {mode}
                  </span>
                </label>
              ))}
            </div>
          </div> )}

          {/* Payment remark (string separate from freeText) */}
         {shouldShow("paymentRemark") && (   <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Payment Remark:</p>
            <input
              type="text"
              className="input"
              name="paymentRemark"
              value={value.paymentRemark}
              onChange={handleFlatChange}
            />
          </div> )}

             {shouldShow("corporation") && (  <div className="flex w-full gap-x-3  justify-end">
          <p className="label whitespace-nowrap">Patient From Corporation:</p>
          <div className="flex gap-x-5 items-center w-[60%]">
            <div className="flex gap-x-2 items-center">
              <input
                type="radio"
                className="w-5 h-5  accent-[#36D7A0]"
                name="corporation"
                checked={value.corporation === "In-Corporation"}
                value="In-Corporation"
                onChange={handleFlatChange}
              />
              <label className="font-normal text-[14px] text-[#2C2C2E] ">
                In-Corporation
              </label>
            </div> 

            <div className="flex gap-x-2 items-center">
              <input
                type="radio"
                className="w-5 h-5  accent-[#36D7A0]"
                name="corporation"
                checked={value.corporation === "Out-Corporation"}
                value="Out-Corporation"
                onChange={handleFlatChange}
              />
              <label className="font-normal text-[14px] text-[#2C2C2E] ">
                Out-Corporation
              </label>
            </div>
          </div>
        </div> )}

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Cash Type:</p>
            <input type="text" className="input"
              name="cashType" value={value.cashType} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Free Text:</p>
            <input type="text" className="input"
              name="freeText" value={value.freeText} onChange={handleFlatChange} />
          </div>

          {shouldShow("remarks") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Remark:</p>
            <input type="text" className="input"
              name="remarks" value={value.remarks} onChange={handleFlatChange} />
          </div> )}

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">TPA Name:</p>
            <input type="text" className="input"
              name="tpaName" value={value.tpaName} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Policy No:</p>
            <input type="text" className="input"
              name="policyNo" value={value.policyNo} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">CCN No:</p>
            <input type="text" className="input"
              name="ccnNo" value={value.ccnNo} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Insurance:</p>
            <input type="text" className="input"
              name="insurance" value={value.insurance} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Scheme:</p>
            <input type="text" className="input"
              name="scheme" value={value.scheme} onChange={handleFlatChange} />
          </div>

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Corporate:</p>
            <input type="text" className="input"
              name="corporate" value={value.corporate} onChange={handleFlatChange} />
          </div>

          {/* <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Company Name:</p>
            <input type="text" className="input"
            name="companyName" value={value.companyName} onChange={handleFlatChange} />
          </div> */}

          <div className="flex w-full gap-x-3 items-start justify-end">
            <p className="label pt-2">Claim Status:</p>
            <div className="grid grid-cols-2 gap-4 w-[60%]">
              {[
                "Unknown",
                "Query Raised",
                "Initial Approved",
                "Final Approved",
                "Query 1",
                "Query 1 Resolved",
                "Query 2",
                "Query 2 Resolved",
                "Under Process",
              ].map((mode) => (
                <div className="flex gap-x-2 items-center ">
                  <input
                    type="radio"
                    className="w-5 h-5 shrink-0 accent-[#36D7A0]"
                    name="claimStatus"
                    value={mode}
                    checked={value.claimStatus === mode}
                    onChange={handleFlatChange}
                  />
                  <label
                    key={mode}
                    className="font-normal text-[14px] text-[#2C2C2E] "
                  >
                    {mode}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Complaints, Past family history */}
           {shouldShow("complaints") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Complaints:</p>
            <input
              type="text"
              className="input"
              name="complaints"
              value={value.complaints}
              onChange={handleFlatChange}
            />
          </div> )}

         {shouldShow("pastFamilyHistory") && (   <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Past / Family History:</p>
            <input
              type="text"
              className="input"
              name="pastFamilyHistory"
              value={value.pastFamilyHistory}
              onChange={handleFlatChange}
            />
          </div> )}

          {shouldShow("provisionalDiagnosis") && (<div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Provisional Diagnosis:</p>
            <input type="text" className="input"
              name="provisionalDiagnosis" value={value.provisionalDiagnosis} onChange={handleFlatChange} />
          </div> )}

          {shouldShow("finalDiagnosis") && ( <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Final Diagnosis:</p>
            <input type="text" className="input"
              name="finalDiagnosis" value={value.finalDiagnosis} onChange={handleFlatChange} />
          </div> )}

          <div className="flex w-full gap-x-3 items-center justify-end">
            <p className="label">Final Diagnosis ICD Code:</p>
            <input type="text" placeholder="ICD Code" className="input"
              name="finalDiagnosisICDCode" value={value.finalDiagnosisICDCode} onChange={handleFlatChange} />
          </div>

        </form>

        <div className="w-[50%]">
          <div className="w-[90%] p-10 mx-auto h-fit bg-[#FDFDFD] shadow-[0_2px_6px_rgba(0,0,0,0.06)] rounded-[4px] ">
            <div className="w-full flex flex-col gap-y-3 ">

              <Camera initialPhotoUrl={typeof value.patientPhoto === "string" ? value.patientPhoto : null}
                onCapture={blob => onChange({ patientPhoto: blob })} />

              <button className="w-full h-[50px] rounded-[10px] bg-[#FFF7F2] border border-[#FB8C5C] text-[#FB8C5C] font-medium text-[16px] ">
                Preview Admission PDF
              </button>
              <button className="w-full h-[50px] rounded-[10px] bg-[#FFE2EA] border border-[#F95484] text-[#F95484] font-medium text-[16px] ">
                Download Admission PDF
              </button>
              <button className="w-full h-[50px] rounded-[10px] bg-[#36D7A01A] border border-[#36D7A0] text-[#36D7A0] font-medium text-[16px] ">
                Send on Whatsapp
              </button>
              <button onClick={() => setConsultantHistory(true)} className="w-full h-[50px] rounded-[10px] bg-[#F6EEFC] border border-[#6F3CDB] text-[#6F3CDB] font-medium text-[16px] ">
                Show Consultant History
              </button>
              <button
                onClick={() => setTransferHistory(true)}
                className="w-full h-[50px] rounded-[10px] bg-[#FFF7F2] border border-[#FB8C5C] text-[#FB8C5C] font-medium text-[16px] cursor-pointer "
              >
                Show Transfer History
              </button>
            </div>
          </div>

          <TransferPatientForm value={value} patientId={patientId} admissionId={admissionId} onTransfer={payload => onChange(payload)} />

          <ChangeConsultantForm value={value} patientId={patientId} admissionId={admissionId} onTransfer={payload => onChange(payload)} />
        </div>
      </div>

      {addNewReferred && (
        <ReferredDoctorCreateForm addNewReferred={addNewReferred} setAddNewReferred={setAddNewReferred} fetchReferredDoctors={fetchReferredDoctors} />
      )}

      {transferHistory && (
        <TransferHistory transferHistory={transferHistory} setTransferHistory={setTransferHistory} patientId={patientId} admissionId={admissionId} />
      )}

      {consultantHistory && (
        <ConsultantHistory consultantHistory={consultantHistory} setConsultantHistory={setConsultantHistory} patientId={patientId} admissionId={admissionId} />
      )}
    </div>
  );
};

export default AdmissionDetailsForm;
