import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import AdmissionDetailsForm from './AdmissionDetailsForm';
import IdentityDetailsForm from './IdentityDetailsForm';
import PatientSignature from './PatientSignature';
import axios from 'axios';
import { usePatient } from '../../context/PatientContext';
const VITE_APP_SERVER   = import.meta.env.VITE_APP_SERVER;
const REG_ENDPOINT      = `${VITE_APP_SERVER}/api/v1/patient`;

const EditPatient = () => {

    const { selectedPatient } = usePatient();
    const navigate = useNavigate();
    
    const [tab, setTab] = useState("Identity Details")

    const patientId = selectedPatient?.patientId;
    const admissionId = selectedPatient?.admissionId;

  const [patientData, setPatientData] = useState(null);

   useEffect(() => {
    if (!patientId) return;                       // guard for first render
    axios
      .get(`${VITE_APP_SERVER}/api/v1/patient/${patientId}`)
      .then(res => setPatientData(res.data.data))
      .catch(err => console.error(err));
  }, [patientId]);

     function pickAdmission(p) {
    if (!Array.isArray(p?.admissionDetails)) return {};
    return admissionId
      ? p.admissionDetails.find(a => a._id === admissionId) || {}
      : p.admissionDetails[0] || {};
  }

const appendNested = (fd, obj, parentKey = "") => {
   Object.entries(obj).forEach(([key, val]) => {
     // only skip truly absent values
     if (val === "" || val === undefined || val === null) return;

     const formKey = parentKey
       ? `${parentKey}[${key}]`
       : key;

     // if it's a File or Blob, send the binary
     if (val instanceof File || val instanceof Blob) {
       fd.append(formKey, val);

     // if it's a nested object, recurse
     } else if (typeof val === "object" && !(val instanceof Date)) {
       appendNested(fd, val, formKey);

     // otherwise (string, number, boolean, etc.) send as-is
     } else {
       fd.append(formKey, val);
     }
   });
 };

function buildInitial(p) {
  const ad = pickAdmission(p);
  return {
    admissionDetails: {
      _id: ad?._id ?? "", 
      admissionReasonId: ad?.admissionReasonId?._id ?? "",
      ipdNo: ad?.ipdNo ?? "",
      registrationType: ad?.registrationType ?? "",
      weight: ad?.weight ?? "",
      mlcType: ad?.mlcType ?? "",
      patientPhoto: ad?.patientPhoto ?? null,
      birthAsphyxiaAndNICUShifted: ad?.birthAsphyxiaAndNICUShifted ?? false,
      bloodGroup: ad?.bloodGroup ?? "",
      termOfBaby: ad?.termOfBaby ?? "",
      modeOfDelivery: ad?.modeOfDelivery ?? "",
      babyIllness: ad?.babyIllness ?? "",
      referredByDoctorId: ad?.referredByDoctorId?._id ?? "",
      referredByDoctorSelectBox: ad?.referredByDoctorSelectBox ?? "",
      provisionalDiagnosis: ad?.provisionalDiagnosis ?? "",
      finalDiagnosis: ad?.finalDiagnosis ?? "",
      operations: ad?.operations ?? "",
      floorId: ad?.floorId?._id ?? "",
      bedId: ad?.bedId?._id ?? "",
      consultingDoctorId: ad?.consultingDoctorId?._id ?? "",
      laboratorySelectionId: ad?.laboratorySelectionId?._id ?? "",
      tpaName: ad?.tpaName ?? "",
      policyNo: ad?.policyNo ?? "",
      ccnNo: ad?.ccnNo ?? "",
      insurance: ad?.insurance ?? "",
      scheme: ad?.scheme ?? "",
      cashType: ad?.cashType ?? "",
      freeText: ad?.freeText ?? "",
      claimStatus: ad?.claimStatus ?? "",
      finalDiagnosisICDCode: ad?.finalDiagnosisICDCode ?? "",
      admissionDate: ad?.admissionDate?.split("T")[0] ?? "",
      admissionTime: ad?.admissionTime ?? "",
      corporation: ad?.corporation ?? "",
      relativeDetails: {
        responsiblePerson: ad?.relativeDetails?.responsiblePerson ?? "",
        relationship: ad?.relativeDetails?.relationship ?? "",
        relativeContactNo: ad?.relativeDetails?.relativeContactNo ?? "",
      },
      covidReport: ad?.covidReport ?? "",
      vaccinationDetails: ad?.vaccinationDetails ?? "",
      signatureDetails: {
        patientGuardianSign: ad?.signatureDetails?.patientGuardianSign ?? null,
        interpreterNurseSign: ad?.signatureDetails?.interpreterNurseSign ?? null,
        receptionSign: ad?.signatureDetails?.receptionSign ?? null,
        relativeWitnessSign: ad?.signatureDetails?.relativeWitnessSign ?? null,
        dischargeInterpreterNurseSign: ad?.signatureDetails?.dischargeInterpreterNurseSign ?? null,
        dischargePatientGuardianSign: ad?.signatureDetails?.dischargePatientGuardianSign ?? null,
        dischargeRelativeWitnessSign: ad?.signatureDetails?.dischargeRelativeWitnessSign ?? null,
      },
      height: ad?.height ?? "",
      otherConsultant: ad?.otherConsultant ?? "",
      patientAllergicOrUnderPrecaution: ad?.patientAllergicOrUnderPrecaution ?? "",
      clinicalDischarge: ad?.clinicalDischarge ?? false,
      billingDischarge: ad?.billingDischarge ?? false,
      applicableClass: ad?.applicableClass ?? "",
      paymentRemark: ad?.paymentRemark ?? "",
      mlcNo: ad?.mlcNo ?? "",
      employerCompanyName: ad?.employerCompanyName ?? "",
      TIDNumber: ad?.TIDNumber ?? "",
      pharmacyDischarge: ad?.pharmacyDischarge ?? false,
      paymentMode: ad?.paymentMode ?? "",
      maintainMRDFileStatus: ad?.maintainMRDFileStatus ?? false,
      patientGuardianDetails: ad?.patientGuardianDetails ?? "",
      consultantUnit: ad?.consultantUnit ?? "",
      bedDepartment: ad?.bedDepartment ?? "",
      patientType: ad?.patientType ?? "New",
      patientStatus: ad?.patientStatus ?? "",
      husbandName: ad?.husbandName ?? "",
      foodPreference: ad?.foodPreference ?? "",
      birthTime: ad?.birthTime ?? "",
      motherAge: ad?.motherAge ?? "",
      complaints: ad?.complaints ?? "",
      pastFamilyHistory: ad?.pastFamilyHistory ?? "",
      remark: ad?.remark ?? "",
      addDietModule: ad?.addDietModule ?? false,
      useClinicalScoreCalculator: ad?.useClinicalScoreCalculator ?? false,
      labDischarge: ad?.labDischarge ?? false,
      CPT: ad?.CPT ?? "",
      referralFromDoctor: ad?.referralFromDoctor ?? "",
      emergencyNo: ad?.emergencyNo ?? "",
      declareAsCriticalPatient: ad?.declareAsCriticalPatient ?? false,
      patientDetail: ad?.patientDetail ?? ""
    },
    identityDetails: {
      patientName: p?.identityDetails?.patientName ?? "",
      uhidNo: p?.identityDetails?.uhidNo ?? "",
      salutation: p?.identityDetails?.salutation ?? "",
      gender: p?.identityDetails?.gender ?? "",
      age: {
        years: p?.identityDetails?.age?.years ?? "",
        months: p?.identityDetails?.age?.months ?? ""
      },
      dateOfBirth: p?.identityDetails?.dateOfBirth?.split("T")[0] ?? "",
      contactNo: p?.identityDetails?.contactNo ?? "",
      whatsappNo: p?.identityDetails?.whatsappNo ?? "",
      email: p?.identityDetails?.email ?? "",
      patientReligion: p?.identityDetails?.patientReligion ?? "",
      address: p?.identityDetails?.address ?? "",
      city: p?.identityDetails?.city ?? "",
      pinCode: p?.identityDetails?.pinCode ?? "",
      aadharDetails: {
        aadharNo: p?.identityDetails?.aadharDetails?.aadharNo ?? "",
        aadharCardFrontImage: p?.identityDetails?.aadharDetails?.aadharCardFrontImage ?? null,
        aadharCardBackImage: p?.identityDetails?.aadharDetails?.aadharCardBackImage ?? null
      },
      panCardDetails: {
        panCardId: p?.identityDetails?.panCardDetails?.panCardId ?? "",
        panCardImage: p?.identityDetails?.panCardDetails?.panCardImage ?? null
      },
      healthCardDetails: {
        healthCardId: p?.identityDetails?.healthCardDetails?.healthCardId ?? "",
        healthCardImage: p?.identityDetails?.healthCardDetails?.healthCardImage ?? null
      }
    }
  };
}

const [data, setData] = useState(() => buildInitial(patientData));

useEffect(() => {
    if (patientData) setData(buildInitial(patientData));
  }, [patientData, admissionId]);

const validate = () => {
  const { emergencyNo, relativeDetails } = data.admissionDetails;
  const { contactNo, whatsappNo, aadharDetails, panCardDetails } = data.identityDetails;

  // helpers
  const isTenDigits   = v => /^\d{10}$/.test(v);
  const isTwelveDigits = v => /^\d{12}$/.test(v);
  const isValidPAN     = v => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);

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


 const merge = (section, payload) =>
    setData((p) => ({ ...p, [section]: { ...p[section], ...payload } }));

 const [loading, setLoading] = useState(false)

const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    appendNested(fd, data);
    fd.append("admissionId", data.admissionDetails._id);

    try {
      setLoading(true)
      await axios.put(`${VITE_APP_SERVER}/api/v1/patient/${patientData._id}`, fd);
      alert("Patient updated successfully!");
      // setData(EMPTY);
      // setTab("Identity Details");
    } catch (err) {
      console.error(err);
      alert("Registration failed – check console.");
    } finally{
      setLoading(false)
    }
  };

  return (
    <div className='w-[100%] bg-[#F4F6FA] h-[95%] px-8 py-4   font-inter relative '>
       <div className='flex w-full justify-between items-center '>
           <p className='text-[#282D30] text-[22px] font-semibold '>Edit Patient</p>  

           {/* <p onClick={() => { setActive("Overview"); navigate("/main/dashboard"); }} className='text-[#A1A3B2] cursor-pointer text-[14px] font-medium '>Home / <b className='text-[#6F3CDB] font-medium '>Patient Registration</b></p>   */}
       </div>

     <div className='w-[100%] bg-[#F4F6FA] h-[95%] scrolll2  overflow-y-scroll font-inter '>
       <div className=' w-full h-[80px] flex justify-center items-center mt-3 bg-[#FDFDFD] rounded-[8px] border-[0.6px] border-[#C4C8D2] '>

         {/* <div className='flex w-full justify-end p-1.5'>
          <button className='w-[85px] h-[36px] rounded-[8px] bg-[#36D7A0] text-white text-[15px] font-medium '>Reset</button>
         </div> */}

         <form className='registrationForm flex gap-x-6 items-center justify-center'>
            <p className='font-medium text-[16px] text-[#282D30] '>Registration Type:</p>

            {/* <div className='flex gap-x-2 items-center'>
               <input	type="radio" name="registrationType" value="IPD" checked={data.registrationType === "IPD"}		
               onChange={e =>	setData(prev => ({ ...prev, registrationType: e.target.value }))} className='accent-[#36D7A0] w-5 h-5 '/>
               <p className='font-normal text-[14px] text-[#282D30] '>IPD</p>
            </div> */}

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

         {/* <div className='flex gap-x-6 items-center justify-center mt-4'>
           <p className='font-medium text-[16px] text-[#282D30] '>ABHA:</p>
           <button className='bg-[#6F3CDB] text-white w-[168px] h-[36px] rounded-[8px] font-medium text-[15px] '>Create New ABHA</button>

         </div> */}

       </div>

       <div className='w-full h-fit bg-[#FDFDFD] rounded-[8px] mt-3 '>

          <div className='w-full h-[80px] p-1.5 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.06)] rounded-[8px] flex gap-x-3 justify-between items-center  '>

 <div onClick={()=>setTab("Identity Details")} className={`w-[50%] h-full cursor-pointer ${tab === "Identity Details" ? "bg-[#F6EEFC]" : "bg-transparent "}  rounded-[8px] flex flex-col items-center justify-center `}>

                 <div className='flex gap-x-3 items-center '>

                   {tab === "Identity Details" ?  <img src="/assets/identityDetails2.svg"/> :  <img src="/assets/identityDetails.svg"/>}
                    <p className='font-semibold text-[18px] text-[#282D30] '>Identity Details</p>

                 </div>

                 <p className='font-medium text-[14px] text-[#A1A3B2] '>Address/Aadhar/PanCard</p>

              </div>

              <div onClick={()=>setTab("Admission Details")} className={`w-[50%] h-full cursor-pointer ${tab === "Admission Details" ? "bg-[#F6EEFC]" : "bg-transparent "}  rounded-[8px] flex flex-col items-center justify-center `}>

                 <div className='flex gap-x-3 items-center '>

                   {tab === "Admission Details" ?  <img src="/assets/hospitalStaff.svg"/> :  <img src="/assets/admissionDetails.svg"/>}
                    <p className='font-semibold text-[18px] text-[#282D30] '>Admission Details</p>

                 </div>

                 <p className='font-medium text-[14px] text-[#A1A3B2] '>Patient Information</p>

              </div>

              
               <div onClick={()=>setTab("Patient's Signature")} className={`w-[50%] h-full cursor-pointer ${tab === "Patient's Signature" ? "bg-[#F6EEFC]" : "bg-transparent "}  rounded-[8px] flex flex-col items-center justify-center `}>

                 <div className='flex gap-x-3 items-center '>

                   {tab === "Patient's Signature" ?  <img src="/assets/signature2.svg"/> :  <img src="/assets/signature.svg"/>}
                    <p className='font-semibold text-[18px] text-[#282D30] '>Patient's Signature</p>

                 </div>

                 <p className='font-medium text-[14px] text-[#A1A3B2] '>Signature</p>

              </div>

          </div>      

         {tab==="Admission Details" && (
         <AdmissionDetailsForm
             value={data.admissionDetails}
              // onChange={payload=>updateSection("admissionDetails",payload)}
              onChange={(payload) => merge("admissionDetails", payload)}
              patientId={patientData._id} admissionId={admissionId}
         />)}
         
      {tab==="Identity Details" && (
         <IdentityDetailsForm
             value={data.identityDetails}
            //  onChange={payload=>updateSection("identityDetails",payload)}
              onChange={(payload) => merge("identityDetails", payload)}
         />)}
      {tab==="Patient's Signature" && (
         <PatientSignature
            //  value={data.patientSignature}
            //  onChange={file     =>setData(prev=>({ ...prev, patientSignature:file }))}

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
         />)}

      {/* global action buttons (preview / download / send etc.) */}
      {/* <button onClick={onSubmit} className="hidden">Save</button> */}
        <div className="p-6 flex justify-end">
      <button onClick={onSubmit}
        type="submit"                 
        className="px-6 py-2 bg-[#6F3CDB] text-white rounded-[8px] font-medium"
      >
          {loading ? "Updating..." : "Update"} 
      </button>
    </div>

       </div>
       </div>
    </div>
  )
}

export default EditPatient
