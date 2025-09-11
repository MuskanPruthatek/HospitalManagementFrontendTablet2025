import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./components/Login/Login";
import SplashScreen from "./components/SplashScreen/SplashScreen";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/Dashboard/Dashboard";
import Patients from "./components/Patients/Patients";
import Beds from "./components/Beds/Beds";
import PatientDetails from "./components/Patients/PatientDetails";
import { useEffect, useState } from "react";
import Scheduler from "./components/OT/Scheduler";
import OTMaster from "./components/OT/OTMaster";
import StaffAccount from "./components/Settings/StaffAccount";
import PatientEditDocuments from "./components/Patients/PatientEditDocuments";
import OtherDocuments from "./components/Patients/DocumentsReports/OtherDocuments/OtherDocuments";
import { PatientProvider } from "./context/PatientContext";
import DocumentDetails from "./components/Patients/DocumentsReports/OtherDocuments/DocumentDetails";
import PatientEditDocument from "./components/Settings/PatientEditDocument/PatientEditDocument";
import OperativeNotes from "./components/Patients/DocumentsReports/OperativeNotes/OperativeNotes";
import axios from "axios";
import AudioRecording from "./components/Patients/DocumentsReports/AudioRecording/AudioRecording";
import PatientDischargeSummary from "./components/Patients/DocumentsReports/PatientDischargeSummary/PatientDischargeSummary";
import PatientCreateDischargeSummary from "./components/Patients/DocumentsReports/PatientDischargeSummary/PatientCreateDischargeSummary";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;
import { setupAxiosInterceptors } from './authProtection/axiosSetup';
import ProtectedRoute from "./authProtection/ProtectedRoute";
import ResetPassword from "./components/Login/ResetPassword";
import RadiologyReports from "./components/Patients/DocumentsReports/RadiologyReports/RadiologyReports";
import IssueTicket from "./components/Settings/IssueTicket/IssueTicket";
import TrackTicket from "./components/Settings/IssueTicket/TrackTicket";
import TicketTrackerDemo, { TicketTracker } from "./components/Settings/IssueTicket/TicketTrackerDemo";
import DigitalNotes from "./components/Patients/DocumentsReports/DigitalNotes/DigitalNotes";
import VideoRecording from "./components/Patients/DocumentsReports/VideoRecording/VideoRecording";
import { drainOutbox, isOnline } from "./offline/helpers";
import { senders } from "./offline/senders";
import RegisterPatient from "./components/RegisterPatient/RegisterPatient";
import EditPatient from "./components/EditPatient/EditPatient";
import LabReports from "./components/Patients/DocumentsReports/Labreports/LabReports";
import PDFWriter from "./components/Patients/DocumentsReports/PDFWriter/PDFWriter"
import PatientPages from "./components/Patients/DocumentsReports/PatientPages/PatientPages"

  function AppWithInterceptors() {
  const navigate = useNavigate();
    const location = useLocation(); 

  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

  useEffect(() => {
    const flush = async () => {
      const res = await drainOutbox(senders);
      // Optional: show success if anything processed
      if (res.processed > 0) {
        // You can branch by collection if you want a specific message
        if (res.byCollection?.bedExchange) {
          alert("Bed exchanged successfully");
        }
      }
    };

    // run now (in case app opens already online)
    flush();

    // run when network comes back
    window.addEventListener("online", flush);

    // run periodically while online
    const id = setInterval(() => { if (isOnline()) flush(); }, 15000);

    return () => {
      window.removeEventListener("online", flush);
      clearInterval(id);
    };
  }, []);


  return (
    <PatientProvider>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
         <Route element={<ProtectedRoute />}>
         <Route path="/main" element={<Layout />}>
            <Route path="patients" element={<Patients />} />
            <Route path="patients/patient-details" element={<PatientDetails  />}/>
            <Route path="patients/pdf" element={<PDFWriter />} />
            <Route path="patients/patient-pages" element={<PatientPages />} />
            {/* <Route path="patients/edit-documents" element={<PatientEditDocuments selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />} /> */}
            <Route path="patients/other-documents" element={<OtherDocuments  />} />
            <Route path="patients/radiology-reports" element={<RadiologyReports  />} />
            <Route path="patients/lab-reports" element={<LabReports  />} />
            <Route path="patients/audio-reports" element={<AudioRecording  />} />
            <Route path="patients/video-reports" element={<VideoRecording  />} />
            <Route path="patients/document-details" element={<DocumentDetails  />} />
            <Route path="patients/operative-notes" element={<OperativeNotes  />} />
            <Route path="patients/discharge-summary" element={<PatientDischargeSummary  />} />
            <Route path="patients/create-discharge-summary" element={<PatientCreateDischargeSummary  />} />
            <Route path="patients/digital-notes" element={<DigitalNotes  />} />
            <Route path="patients/register-patient" element={<RegisterPatient  />} />
            <Route path="patients/edit-patient" element={<EditPatient  />} />
            <Route path="beds" element={<Beds />} />
            <Route path="ot" element={<Scheduler />} />
            <Route path="settings" element={<StaffAccount />} />
            <Route path="settings/patient-edit-document" element={<PatientEditDocument />} />    
            <Route path="settings/issue-ticket" element={<IssueTicket />} />  
            <Route path="settings/track-ticket" element={<TrackTicket />} />    
         </Route>
         </Route>
      </Routes>
    </AnimatePresence>
    </PatientProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithInterceptors />
    </BrowserRouter>
  );
}
