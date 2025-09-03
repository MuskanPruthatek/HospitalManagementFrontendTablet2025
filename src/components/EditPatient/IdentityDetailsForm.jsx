import React, { useState } from "react";
import CustomDropdown from "../CustomDropDown/CustomDropdown";
import axios from "axios";
import Camera2 from "../RegisterPatient/Camera2";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const IdentityDetailsForm = ({ value, onChange }) => {

   const getInputValue = ({ type, value, checked, files }) =>
  type === "checkbox" ? checked : type === "file" ? files[0] : value;

const calcAge = (dobStr) => {
  if (!dobStr) return { years: "", months: "" };
  const dob = new Date(dobStr);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();

  if (now.getDate() < dob.getDate()) months -= 1;           // adjust for day
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

  return (
    <div className="w-full relative mt-5 pb-6 ">
      <form className="w-[100%] px-[100px] flex flex-col gap-y-5 ">

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

           <div className="flex w-[90%] gap-x-3 items-center justify-end ">
                      <p className="label ">Salutation:</p>
                      <div className="w-[60%] ">
                        <CustomDropdown label="Select Salutation"
                          options={["Mr.", "Mrs.", "Miss"]}
                          selected={value.salutation}
                          onChange={(label) => onChange({ salutation: label })}
                        />
                      </div>
                    </div>
          
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
          
                    <div className="flex w-[90%] gap-x-3 items-center justify-end">
                      <p className="label">Date of Birth:</p>
                      <input
                        type="date"
                        placeholder="DD-MM-YYYY"
                        className="input"
                        name="dateOfBirth"
                        value={value.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
          
                    <div className="flex w-[90%] gap-x-3 items-center justify-end">
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
                    </div>
          
                    <div className="flex w-[90%] gap-x-3 items-center justify-end ">
                      <p className="label ">Contact No:</p>
                      <input
                        type="number"
                        placeholder="Contact No"
                        className="input "
                        value={value.contactNo}
                        name="contactNo"
                        onChange={handleChange}
                      />
                    </div>
          
                    <div className="flex w-[90%] gap-x-3 items-center justify-end ">
                      <p className="label ">Whatsapp No:</p>
                      <input
                        type="number"
                        placeholder="Whatsapp No"
                        className="input "
                        value={value.whatsappNo}
                        name="whatsappNo"
                        onChange={handleChange}
                      />
                    </div>
          
                    <div className="flex w-[90%] gap-x-3 items-center justify-end ">
                      <p className="label ">Email:</p>
                      <input
                        type="email"
                        placeholder="Email"
                        className="input "
                        value={value.email}
                        name="email"
                        onChange={handleChange}
                      />
                    </div>
          
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
          
                    <div className="flex w-[90%] gap-x-3 items-center justify-end">
                      <p className="label">Patient Religion:</p>
                      <div className="w-[60%] ">
                        <CustomDropdown label="Select Religion"
                          options={["Hindu", "Muslim", "Jain", "Sikh"]}
                          selected={value.patientReligion}
                          onChange={(label) => onChange({ patientReligion: label })}
                        />
                      </div>
                    </div>

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

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Aadhar No:</p>
          <input
            type="text"
            placeholder="Aadhar No"
            className="input "
            name="aadharNo"
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
            <Camera2 initialPhotoUrl={typeof value.aadharDetails.aadharCardFrontImage === "string" ? value.aadharDetails.aadharCardFrontImage : null}
              onCapture={(blob) => handleNestedChange("aadharDetails", "aadharCardFrontImage", blob)}/>          
          </div>
        </div>

        <div className="flex w-[90%] gap-x-3 items-start justify-end ">
          <label className="label whitespace-nowrap ">
            Aadhar Card Back Image:
          </label>

          <div className="flex flex-col items-center w-[60%]">
            <Camera2  initialPhotoUrl={typeof value.aadharDetails.aadharCardBackImage === "string" ? value.aadharDetails.aadharCardBackImage : null}
              onCapture={(blob) => handleNestedChange("aadharDetails", "aadharCardBackImage", blob)}/>
              
          </div>
        </div>

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Pan Card ID:</p>
          <input
            type="text"
            placeholder="Pan Card ID"
            className="input "
            name="panCardId"
            value={value.panCardDetails.panCardId}
            onChange={(e) =>   handleNestedChange("panCardDetails", "panCardId", e)  }
          />
        </div>

        <div className="flex w-[90%] gap-x-3 items-start justify-end ">
          <label className="label whitespace-nowrap">Pan Card Image:</label>

          <div className="flex flex-col items-center w-[60%]">
            <Camera2 initialPhotoUrl={typeof value.panCardDetails.panCardImage === "string" ? value.panCardDetails.panCardImage : null}
              onCapture={(blob) => handleNestedChange("panCardDetails", "panCardImage", blob)}/>            
          </div>
        </div>

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Health Card ID:</p>
          <input
            type="text"
            placeholder="Health Card ID"
            className="input "
            name="healthCardId"
            value={value.healthCardDetails.healthCardId}
            onChange={(e) =>   handleNestedChange("healthCardDetails", "healthCardId", e)  }
          />
        </div>

        <div className="flex w-[90%] gap-x-3 items-start justify-end ">
          <label className="label whitespace-nowrap">Health Card Image:</label>

          <div className="flex flex-col items-center w-[60%]">
            <Camera2 initialPhotoUrl={typeof value.healthCardDetails.healthCardImage === "string" ? value.healthCardDetails.healthCardImage : null}
              onCapture={(blob) => handleNestedChange("healthCardDetails", "healthCardImage", blob)}/>             
          </div>
        </div>    
         {/* <div className="flex w-[90%] gap-x-3  justify-end">
          <p className="label whitespace-nowrap">Patient From Corporation:</p>
          <div className="flex gap-x-5 items-center w-[60%]">
            <div className="flex gap-x-2 items-center">
              <input
                type="radio"
                className="w-5 h-5  accent-[#36D7A0]"
                name="corporation"
                checked={value.corporation === "In-Corporation"}
                value="In-Corporation"
                onChange={handleChange}
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
                onChange={handleChange}
              />
              <label className="font-normal text-[14px] text-[#2C2C2E] ">
                Out-Corporation
              </label>
            </div>
          </div>
        </div>

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Responsible Person:</p>
          <input
            type="text"
            placeholder="Responsible Person"
            className="input "
            name="responsiblePerson"
            value={value.responsiblePerson}
            onChange={handleChange}
          />
        </div>

        <div className="flex w-[90%] gap-x-3 items-center justify-end">
          <p className="label">Relationship:</p>
          <div className="w-[60%] ">
            <CustomDropdown
              options={["Parent", "Spouse", "Sibling", "Other"]}
              selected={value.relationship}
              onChange={(label) => onChange({ relationship: label })}
            />
          </div>
        </div>

        <div className="flex w-[90%] gap-x-3 items-center justify-end ">
          <p className="label ">Relative Contact No:</p>
          <input
            type="number"
            placeholder="Relative Contact No"
            className="input "
            name="relativeContactNo"
            value={value.relativeContactNo}
            onChange={handleChange}
          />
        </div> */}  
      </form>
    </div>
  );
};

export default IdentityDetailsForm;
