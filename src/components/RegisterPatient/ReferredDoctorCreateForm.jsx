import axios from 'axios';
import { X } from 'lucide-react';
import React, { useState } from 'react'
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const ReferredDoctorCreateForm = ({addNewReferred, setAddNewReferred, fetchReferredDoctors}) => {

      const [selectedDoctor, setSelectedDoctor] = useState("")
      const [doctors, setDoctors] = useState("")
      const [referredDoctors, setReferredDoctors] = useState([])

      const [formData, setFormData] = useState({
        doctorName: "",
        email: "",
        address: "",
        city: "",
        contactNo: "",
        education: "",
        status: false,
      });

      const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(formData.contactNo)) {
      alert("Contact number must be exactly 10 digits");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));

    try {
      const res = await axios.post(
        `${VITE_APP_SERVER}/api/v1/doctor-master/referred-doctor`,
        data,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      alert(res.data.message);
      setAddNewReferred(false);
      setFormData({
        doctorName: "",
        email: "",
        address: "",
        city: "",
        contactNo: "",
        education: "",
        status: false,
      });
      setSelectedDoctor(""); // reset edit flag
      fetchReferredDoctors()
    } catch (err) {
      console.error("Save failed", err);
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  const resetForm = () => {
    setFormData({
      doctorName: "",
      email: "",
      address: "",
      city: "",
      contactNo: "",
      education: "",
      status: false,
    });
    setAddNewReferred(false);
  };
  return (
     <div className="fixed w-full h-full bg-black/50 top-0 bottom-0 left-0 right-0 flex justify-center items-center ">
          <div className="w-[600px] h-fit bg-[#FDFDFD] rounded-[8px] border-[1.5px] border-[#C4C8D2] ">
            <div className="w-full border-b border-b-[#C4C8D2] flex justify-between p-5 ">
              <p className="font-bold text-[18px] text-[#282D30] ">
                Add Referred Doctor
              </p>
              <X
                onClick={() => resetForm()}
                color="#A1A3B2"
                className="cursor-pointer"
              />
            </div>

            <form
              onSubmit={handleSubmit}
              className="w-[100%] flex flex-col gap-y-4 my-5 "
            >
              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-end text-[#282D30] ">
                  Doctor Name:
                </p>
                <input
                  type="text"
                  name="doctorName"
                  required
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  className="input "
                />
              </div>

              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-[#282D30] ">
                  Address:
                </p>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input "
                />
              </div>

              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-[#282D30] ">City:</p>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input "
                />
              </div>

              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-[#282D30] ">
                  Contact No:
                </p>
                <input
                  type="text"
                  name="contactNo"
                  required
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  className="input "
                />
              </div>

              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-[#282D30] ">
                  Email:
                </p>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input "
                />
              </div>

              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-[#282D30] ">
                  Education:
                </p>
                <input
                  type="text"
                  name="education"
                  required
                  value={formData.education}
                  onChange={handleInputChange}
                  className="input "
                />
              </div>

              <div className="w-[80%] justify-end flex gap-x-3 items-center ">
                <p className="font-normal text-[16px] text-[#282D30] ">
                  Status:
                </p>
                <div className="w-[60%] ">
                  <input
                    type="checkbox"
                    name="status"
                    required
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-[#36D7A0] "
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-[224px] h-[50px] rounded-[10px] bg-[#36D7A0] text-white font-medium text-[16px] self-center "
              >
                Add New Doctor
              </button>
            </form>
          </div>
        </div>
  )
}

export default ReferredDoctorCreateForm
