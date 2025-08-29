import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    token: "",
    newPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await axios.post(
       `${VITE_APP_SERVER}/api/v1/user/reset-password`,
        formData
      ); // Adjust URL as needed
      alert("Password reset successfull!");

      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (error) {
      alert("An error occurred. Please try again.");
      console.log("An unexpected error occurred:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const [showNewPassword, setShowNewPassword] = useState(false);

  return (
    <div className='w-full h-screen py-20 bg-[#F4F6FA] flex flex-col items-center justify-center gap-20'>
      <img src="/assets/Logo.svg" className='w-[160px] h-[140px] ' />

            <form onSubmit={handleSubmit} className='w-[70%] h-fit px-5 py-10 flex flex-col items-center bg-[#FDFDFD] rounded-[20px] '>
             <p className='font-bold font-inter text-[48px] text-black '>Reset <b className='text-[#6F3CDB] font-bold'>Password</b></p>
              <p className='mt-2 text-[#282D30] font-medium text-[16px] font-inter cursor-pointer'>
              Enter token received in your mail and set a new password. 
              </p>
             
            {/* <p className="label">Enter token sent in mail</p> */}
            <input
              className="input2 mt-12"
              type="text"
              name="token"
              required
              value={formData.token}
              onChange={handleChange}
              placeholder="Token"
              autoComplete="token"
            />

            <div className="w-full relative mt-5">
              <input
                className="input2"
                required
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                autoComplete="current-password"
              />
              {showNewPassword ? (
                <EyeOff
                  className="absolute top-3 right-5 cursor-pointer"
                  color="#A1A3B2"
                  onClick={() => setShowNewPassword(false)}
                  aria-label="Hide password"
                />
              ) : (
                <Eye
                  className="absolute top-3 right-5 cursor-pointer"
                  color="#A1A3B2"
                  onClick={() => setShowNewPassword(true)}
                  aria-label="Show password"
                />
              )}
            </div>

            <button
             className='w-full h-[70px] mt-8 bg-[#6F3CDB] text-[#FDFDFD] rounded-[20px] font-semibold text-[18px] font-inter  '
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Resetting..." : "Reset"}
            </button>

            <Link to="/login" className="mt-2 text-[#282D30] font-medium text-[16px] font-inter cursor-pointer ">
            Back to Login         
            </Link>
    
            </form>
        
    </div>
  );
};

export default ResetPassword;
