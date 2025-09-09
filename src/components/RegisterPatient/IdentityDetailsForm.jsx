import React, { useEffect, useMemo, useState } from "react";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import axios from "axios";
import Camera2 from "./Camera2";
import { fetchWithCache } from "../../offline/fetchWithCache";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
//

const FIELD_BINDINGS = {
  salutation: "Salutation",
  dateOfBirth: "Age & Date Of Birth",
  age: "Age & Date Of Birth",
  contactNo: "Contact No",
  whatsappNo: "WhatsApp Number",                // backend uses this exact case in your JSON
  email: "Email",
  patientReligion: "Religion",
  address: "Patient Address",
  city: "Patient Address",                      // tie city/pincode to address flag (optional)
  pinCode: "Patient Address",

  aadhar: "Aadhar details",                     // one flag controls the 3 Aadhar inputs
  pan: "Pan Card details",                      // controls both PAN inputs
  healthCard: "Health Card Details",            // controls both health card inputs
};

// 2) Small hook to create a `show()` helper from the fetched config
function useAdmissionFlags(fields = []) {
  const lookup = useMemo(() => {
    const m = new Map();
    for (const f of fields) {
      m.set((f.fieldName || "").trim().toLowerCase(), !!f.status);
    }
    return m;
  }, [fields]);

  const showByFieldName = (name, fallback = true) => {
    const key = (name || "").trim().toLowerCase();
    return lookup.has(key) ? lookup.get(key) : fallback; // default to visible if not configured
  };

  const show = (uiKey, fallback = true) => {
    const bound = FIELD_BINDINGS[uiKey] ?? uiKey;
    if (Array.isArray(bound)) {
      // visible if ANY bound field is enabled; switch to .every if you want ALL required
      return bound.some((n) => showByFieldName(n, fallback));
    }
    return showByFieldName(bound, fallback);
  };

  return { show };
}

const IdentityDetailsForm = ({ value, onChange }) => {

  const getInputValue = ({ type, value, checked, files }) =>
    type === "checkbox" ? checked : type === "file" ? files[0] : value;

  const calcAge = (dobStr) => {
    if (!dobStr) return { years: "", months: "" };
    const dob = new Date(dobStr);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();

    if (now.getDate() < dob.getDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years: String(years), months: String(months) };
  };

  const handleChange = (e) => {
    const { name } = e.target;
    const newVal = getInputValue(e.target);

    // if DOB changed, update both dateOfBirth and age.*
    if (name === "dateOfBirth") {
      const { years, months } = calcAge(newVal);
      onChange({ dateOfBirth: newVal });                     // update DOB
      onChange({ age: { ...value.age, years, months } });    // update age
    } else {
      onChange({ [name]: newVal });
    }
  };

  const handleNestedChange = (outerKey, innerKey, eOrVal) => {
    const newVal =
      eOrVal && eOrVal.target ? getInputValue(eOrVal.target) : eOrVal;

    onChange({
      [outerKey]: { ...value[outerKey], [innerKey]: newVal },
    });
  };


  const [patients, setPatients] = useState([])
  const [selectedPatientLabel, setSelectedPatientLabel] = useState("");

  const labelFor = (p) =>
    `${p.identityDetails.patientName || "Unnamed"} (${p.identityDetails.uhidNo})`;


  useEffect(() => {
    fetchPatients();
    fetchIdentityFields()
  }, []);

    const fetchPatients = (forceOnline = false) =>
    fetchWithCache({
      collection: "patients",
      url: `${VITE_APP_SERVER}/api/v1/patient`,
      setItems: setPatients,
      forceOnline,           
    });

  const patientOptions = patients.map(labelFor);


  const [identityFields, setIdentityFields] = useState([]);

      const fetchIdentityFields = (forceOnline = false) =>
    fetchWithCache({
      collection: "admissionFields",
      url: `${VITE_APP_SERVER}/api/v1/document-master/admissionform-master`,
      setItems: setIdentityFields,
      forceOnline,           
    });

  const { show } = useAdmissionFlags(identityFields);

  return (
    <div className="w-full relative mt-5 pb-6 ">
      <form className="w-[100%] px-[100px] flex flex-col gap-y-5 ">

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Existing Patient:</p>
          <div className="w-[60%] ">
            <CustomDropdown label="Select Existing Patient"
              options={patientOptions}
              selected={selectedPatientLabel}
              onChange={(label) => {
                setSelectedPatientLabel(label);

                // 1️⃣ find the full record
                const picked = patients.find((p) => labelFor(p) === label);
                if (!picked) return;

                // 2️⃣ normalise DOB string for <input type="date">
                const dobIso =
                  picked.identityDetails.dateOfBirth &&
                  new Date(picked.identityDetails.dateOfBirth)
                    .toISOString()
                    .slice(0, 10); // YYYY-MM-DD

                // 3️⃣ auto-compute age
                const { years, months } = calcAge(dobIso);

                // 4️⃣ send entire identityDetails object to parent
                onChange({
                  ...picked.identityDetails,
                  dateOfBirth: dobIso,
                  age: { years, months },
                });
              }}
            />
          </div>
        </div>

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">UHID No*:</p>
          <input
            type="text"
            required
            placeholder="UHID No"
            name="uhidNo"
            value={value.uhidNo}
            onChange={handleChange}
            className="input "
          />
        </div>

        {show("salutation") && (<div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Salutation:</p>
          <div className="w-[60%] ">
            <CustomDropdown label="Select Salutation"
              options={["Mr.", "Mrs.", "Miss"]}
              selected={value.salutation}
              onChange={(label) => onChange({ salutation: label })}
            />
          </div>
        </div>)}

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Patient Name*:</p>
          <input
            type="text"
            required
            placeholder="Patient Name"
            className="input "
            name="patientName"
            value={value.patientName}
            onChange={handleChange}
          />
        </div>

        {show("dateOfBirth") && (<div className="flex w-[90%] gap-x-3 items-center justify-end">
          <p className="label">Date of Birth:</p>
          <input
            type="date"
            placeholder="DD-MM-YYYY"
            className="input"
            name="dateOfBirth"
            value={value.dateOfBirth}
            onChange={handleChange}
          />
        </div>)}

        {show("age") && (<div className="flex w-[90%] gap-x-3 items-center justify-end">
          <p className="label">Age:</p>
          <div className="flex gap-x-3 w-[60%]">
            <input
              placeholder="Years"
              value={value.age.years}
              onChange={(e) =>
                handleNestedChange("age", "years", e)
              }
              className="input w-[50%]"
            />
            <input
              placeholder="Months"
              value={value.age.months}
              onChange={(e) =>
                handleNestedChange("age", "months", e)
              }
              className="input w-[50%]"
            />
          </div>
        </div>)}

        {show("contactNo") && (<div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Contact No:</p>
          <input
            type="number"
            placeholder="Contact No"
            className="input "
            value={value.contactNo}
            name="contactNo"
            onChange={handleChange}
          />
        </div>)}

        {show("whatsappNo") && (<div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Whatsapp No:</p>
          <input
            type="number"
            placeholder="Whatsapp No"
            className="input "
            value={value.whatsappNo}
            name="whatsappNo"
            onChange={handleChange}
          />
        </div>)}

        {show("email") && (<div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Email:</p>
          <input
            type="email"
            placeholder="Email"
            className="input "
            value={value.email}
            name="email"
            onChange={handleChange}
          />
        </div>)}

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Gender*:</p>
          <div className="w-[60%] ">
            <CustomDropdown label="Select Gender"
              options={["Male", "Female", "Other"]}
              selected={value.gender}
              onChange={(label) => onChange({ gender: label })}
            />
          </div>
        </div>

        {show("patientReligion") && (<div className="flex w-[90%] gap-x-3 items-center justify-end">
          <p className="label">Patient Religion:</p>
          <div className="w-[60%] ">
            <CustomDropdown label="Select Religion"
              options={["Hindu", "Muslim", "Jain", "Sikh"]}
              selected={value.patientReligion}
              onChange={(label) => onChange({ patientReligion: label })}
            />
          </div>
        </div>)}

        {show("address") && (
          <>
            <div className="flex w-[90%] gap-x-3 items-center justify-end ">
              <p className="label ">Address:</p>
              <input
                type="text"
                placeholder="Address"
                className="input "
                name="address"
                value={value.address}
                onChange={handleChange}
              />
            </div>

            <div className="flex w-[90%] gap-x-3 items-center justify-end ">
              <p className="label ">City:</p>
              <input
                type="text"
                placeholder="City"
                className="input "
                name="city"
                value={value.city}
                onChange={handleChange}
              />
            </div>

            <div className="flex w-[90%] gap-x-3 items-center justify-end ">
              <p className="label ">Pin Code:</p>
              <input
                type="number"
                placeholder="Pin Code"
                className="input "
                name="pinCode"
                value={value.pinCode}
                onChange={handleChange}
              />
            </div>
          </>)}


        {show("aadhar") && (
          <>
            <div className="flex w-[90%] gap-x-3 items-center justify-end ">
              <p className="label ">Aadhar No:</p>
              <input
                type="text"
                placeholder="Aadhar No"
                className="input "
                value={value.aadharDetails.aadharNo}
                onChange={(e) =>
                  handleNestedChange("aadharDetails", "aadharNo", e)
                }
              />
            </div>

            <div className="flex w-[90%] gap-x-3 items-start justify-end ">
              <label className="label whitespace-nowrap">
                Aadhar Card Front Image:
              </label>

              <div className="flex flex-col items-center w-[60%]">
                <Camera2
                  initialPhotoUrl={value.aadharDetails.aadharCardFrontImage}
                  onCapture={(blob) =>
                    handleNestedChange("aadharDetails", "aadharCardFrontImage", blob)
                  }
                />
              </div>
            </div>

            <div className="flex w-[90%] gap-x-3 items-start justify-end ">
              <label className="label whitespace-nowrap ">
                Aadhar Card Back Image:
              </label>

              <div className="flex flex-col items-center w-[60%]">
                <Camera2
                  initialPhotoUrl={value.aadharDetails.aadharCardBackImage}
                  onCapture={(blob) =>
                    handleNestedChange("aadharDetails", "aadharCardBackImage", blob)
                  }
                />
              </div>
            </div>
          </>
        )}


        {show("pan") && (
          <>
            <div className="flex w-[90%] gap-x-3 items-center justify-end ">
              <p className="label ">Pan Card ID:</p>
              <input
                type="text"
                placeholder="Pan Card ID"
                className="input "
                value={value.panCardDetails.panCardId}
                onChange={(e) =>
                  handleNestedChange("panCardDetails", "panCardId", e)
                }
              />
            </div>

            <div className="flex w-[90%] gap-x-3 items-start justify-end ">
              <label className="label whitespace-nowrap">Pan Card Image:</label>

              <div className="flex flex-col items-center w-[60%]">
                <Camera2
                  initialPhotoUrl={value.panCardDetails.panCardImage}
                  onCapture={(blob) =>
                    handleNestedChange("panCardDetails", "panCardImage", blob)
                  } />
              </div>
            </div>

          </>)}


        {show("healthCard") && (
          <>

            <div className="flex w-[90%] gap-x-3 items-center justify-end ">
              <p className="label ">Health Card ID:</p>
              <input
                type="text"
                placeholder="Health Card ID"
                className="input "
                value={value.healthCardDetails.healthCardId}
                onChange={(e) =>
                  handleNestedChange("healthCardDetails", "healthCardId", e)
                }
              />
            </div>

            <div className="flex w-[90%] gap-x-3 items-start justify-end ">
              <label className="label whitespace-nowrap">Health Card Image:</label>

              <div className="flex flex-col items-center w-[60%]">
                <Camera2
                  initialPhotoUrl={value.healthCardDetails.healthCardImage}
                  onCapture={(blob) =>
                    handleNestedChange("healthCardDetails", "healthCardImage", blob)
                  }
                />
              </div>
            </div>
          </>)}
      </form>
    </div>
  );
};

export default IdentityDetailsForm;
