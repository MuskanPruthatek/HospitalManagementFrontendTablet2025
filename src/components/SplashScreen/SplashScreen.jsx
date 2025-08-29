import React from 'react'
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SplashScreen = () => {

  const navigate = useNavigate();

  // Kick off the timed redirect
  useEffect(() => {
    const id = setTimeout(() => navigate("/login"), 2000); // 5 s
    return () => clearTimeout(id);                         // cleanup
  }, [navigate]);

  return (
    <motion.div
      className="w-full h-screen py-20 bg-[#FDFDFD] flex flex-col items-center justify-center relative"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <img src="/assets/Logo.svg" className='w-[260px] h-[240px] '/>
      
      <div className='absolute bottom-5 flex flex-col gap-y-4 w-full items-center justify-center '>
        <p className='font-medium text-[22px] text-[#A1A3B2] font-inter '>Product of</p>
        <img src="/assets/pruthatekLogo.svg" className='w-[300px] h-[85px] -mt-8'/>
      </div>
    </motion.div>
  )
}

export default SplashScreen
