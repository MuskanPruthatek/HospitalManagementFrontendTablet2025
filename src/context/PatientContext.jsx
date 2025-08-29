// src/context/PatientContext.jsx
import { createContext, useState, useContext, useEffect } from "react";

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ✅ Load from localStorage on app start
  useEffect(() => {
    const savedPatient = localStorage.getItem("selectedPatient");
    if (savedPatient) {
      try {
        setSelectedPatient(JSON.parse(savedPatient));
      } catch (err) {
        console.error("Error parsing saved patient from localStorage", err);
      }
    }
  }, []);

  // ✅ Save to localStorage whenever it changes
  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem("selectedPatient", JSON.stringify(selectedPatient));
    } else {
      localStorage.removeItem("selectedPatient");
    }
  }, [selectedPatient]);

  return (
    <PatientContext.Provider value={{ selectedPatient, setSelectedPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => useContext(PatientContext);
