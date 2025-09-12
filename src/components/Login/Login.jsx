import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Eye, EyeOff } from "lucide-react"
import CustomDropdown from '../CustomDropDown/CustomDropdown';
import { useLocation, useNavigate } from 'react-router-dom';

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const Login = () => {
  const [tab, setTab] = useState("Log In")

  const navigate = useNavigate()
  const location = useLocation()
  // forms
  const [logInForm, setLogInForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    photo: null, // File
  })


  const [forgotForm, setForgotForm] = useState({ email: '' });

  // password toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // role dropdown & image preview
  const [selectedRole, setSelectedRole] = useState("") // mirrors registerForm.role
  const [photoPreview, setPhotoPreview] = useState(null) // blob url for preview

  // cleanup preview URL
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  // ----------------- handlers -----------------
  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLogInForm(prev => ({ ...prev, [name]: value }))
  }

  const handleRegisterChange = (e) => {
    const { name, value, files } = e.target

    // handle image file
    if (name === "photo") {
      const file = files?.[0]
      if (!file) return
      // optional: basic client-side validation
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.")
        return
      }
      // 5 MB guard (tweak if needed)
      const MAX_BYTES = 5 * 1024 * 1024
      if (file.size > MAX_BYTES) {
        alert("Image too large. Max 5 MB.")
        return
      }

      // preview
      const url = URL.createObjectURL(file)
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoPreview(url)

      setRegisterForm(prev => ({ ...prev, photo: file }))
      return
    }

    setRegisterForm(prev => ({ ...prev, [name]: value }))
  }

  // If your CustomDropdown exposes a different prop (e.g., onSelect), adjust here
  const handleRoleChange = (value) => {
    setSelectedRole(value)
    setRegisterForm(prev => ({ ...prev, role: value }))
  }

  // ----------------- submits -----------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await axios.post(`${VITE_APP_SERVER}/api/v1/user/login`, logInForm)

      // Expected response shape per your example:
      // { success, message, timestamp, data: { token, user: { firstName, image, ... } } }
      const token = res?.data?.data?.token
      const user = res?.data?.data?.user

      if (!token || !user) {
        throw new Error("Unexpected login response")
      }

      // Save what you need; keep one compact object
      const authPayload = {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          email: user.email,
          role: user.role,
          image: user.photo || null, // backend puts image inside user
        }
      }
      localStorage.setItem("auth", JSON.stringify(authPayload))

      // (optional) set default auth header for future axios calls
      axios.defaults.headers.common.Authorization = `Bearer ${token}`

      alert("Logged in successfully.")
      console.log("Login response:", res.data)

      const from = (location.state && location.state.from?.pathname) || "/main/patients";
      navigate(from, { replace: true });

    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || err?.message || "Login failed.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeForgot = (e) => {
    setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });
  };

  const handleSubmitForgot = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true)
      const response = await axios.post(`${VITE_APP_SERVER}/api/v1/user/forgot-password`, forgotForm);
      // alert("Mail sent!");
      navigate("/reset-password")
    } catch (error) {
      alert("An error occurred. Please try again.");
      console.log("An unexpected error occurred:", error);
    } finally {
      setSubmitting(false)
    }
  };

  return (
    <div className='w-full h-screen py-20 bg-[#F4F6FA] flex flex-col items-center justify-center gap-20'>


      <img src="/assets/Logo.svg" className='w-[160px] h-[140px] ' />

     {tab === "Log In" && <form onSubmit={handleLoginSubmit} className='w-[70%] h-fit px-5 py-10 flex flex-col items-center bg-[#FDFDFD] rounded-[20px] '>

        <p className='font-bold font-inter text-[48px] text-black '>Log <b className='text-[#6F3CDB] font-bold'>In</b></p>

        <div className='w-[90%] mt-12 '>
          <input className='input2' type='email' name="email" required
            value={logInForm.email} onChange={handleLoginChange} placeholder='Email Id' autoComplete="email" />

          <div className='w-full relative mt-5'>
            <input
              className='input2' required
              type={showLoginPassword ? 'text' : 'password'}
              name="password"
              value={logInForm.password}
              onChange={handleLoginChange}
              placeholder='Password'
              autoComplete="current-password"
            />
            {showLoginPassword ? (
              <EyeOff
                className='absolute top-6 right-5 cursor-pointer'
                color='#A1A3B2'
                onClick={() => setShowLoginPassword(false)}
                aria-label="Hide password"
              />
            ) : (
              <Eye
                className='absolute top-6 right-5 cursor-pointer'
                color='#A1A3B2'
                onClick={() => setShowLoginPassword(true)}
                aria-label="Show password"
              />
            )}
          </div>

          <p className='font-semibold text-[18px] font-inter text-[#282D30] mt-8'>Forgot Password? <b onClick={() => setTab("Forgot Password")} className='font-extrabold text-[#6F3CDB] '>Reset</b></p>

          <button type='submit' disabled={submitting} className='w-full h-[70px] mt-8 bg-[#6F3CDB] text-[#FDFDFD] rounded-[20px] font-semibold text-[18px] font-inter  '>
            {submitting ? "Logging in..." : "Login"}</button>
        </div>

      </form> }

        {tab === "Forgot Password" && (
       

            <form onSubmit={handleSubmitForgot} className='w-[70%] h-fit px-5 py-10 flex flex-col items-center bg-[#FDFDFD] rounded-[20px] '>
             <p className='font-bold font-inter text-[48px] text-black '>Forgot <b className='text-[#6F3CDB] font-bold'>Password</b></p>
              <p className='mt-2 text-[#282D30] font-medium text-[16px] font-inter cursor-pointer'>
               Submit your email id and we will send a password reset token to your mail. 
              </p>
             
              <input
                className='input2 mt-12'
                type='email'
                name="email" required
                value={forgotForm.email}
                onChange={handleChangeForgot}
                placeholder='Email Id'
                autoComplete="email"
              />

               <button type='submit' disabled={submitting} className='w-full h-[70px] mt-8 bg-[#6F3CDB] text-[#FDFDFD] rounded-[20px] font-semibold text-[18px] font-inter  '>
             {submitting ? "Sending mail..." : "Send Mail"}</button>

              <p onClick={() => setTab("Log In")} className='mt-2 text-[#282D30] font-medium text-[16px] font-inter cursor-pointer'>
                Back to Login     
              </p>
            </form>
        
      )}
    </div>
  )
}

export default Login


