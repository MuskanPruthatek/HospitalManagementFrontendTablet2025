// src/hooks/useHospitalMasters.js
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fetchWithCache } from "../../../offline/fetchWithCache";

const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

export default function usePatientMaster(selectedFloor) {
  // ── raw lists + timestamps ──
  const [floors, setFloors] = useState([]);
  const [floorsUpdatedAt, setFloorsUpdatedAt] = useState(null);

  const [beds, setBeds] = useState([]);
  const [bedsUpdatedAt, setBedsUpdatedAt] = useState(null);

  const [admissionReasons, setAdmissionReasons] = useState([]);
  const [admissionReasonsUpdatedAt, setAdmissionReasonsUpdatedAt] = useState(null);

  const [doctorsList, setDoctorsList] = useState([]);
  const [doctorsUpdatedAt, setDoctorsUpdatedAt] = useState(null);

  const [refDoctorsList, setRefDoctorsList] = useState([]);
  const [refDoctorsUpdatedAt, setRefDoctorsUpdatedAt] = useState(null);

  const [labsList, setLabsList] = useState([]);
  const [labsUpdatedAt, setLabsUpdatedAt] = useState(null);

  const [admissionFields, setAdmissionFields] = useState([]);
  const [admissionFieldsUpdatedAt, setAdmissionFieldsUpdatedAt] = useState(null);

  // ── loading ──
  const [loading, setLoading] = useState(false);

  // ── maps & option states ──
  const [floorMap, setFloorMap] = useState({});
  const [bedMap, setBedMap] = useState({});

  const [reasonOpts, setReasonOpts] = useState([]);
  const [reasonL2I, setReasonL2I] = useState({});
  const [reasonI2L, setReasonI2L] = useState({});

  const [doctorOpts, setDoctorOpts] = useState([]);
  const [doctorL2I, setDoctorL2I] = useState({});
  const [doctorI2L, setDoctorI2L] = useState({});

  const [refOpts, setRefOpts] = useState([]);
  const [refL2I, setRefL2I] = useState({});
  const [refI2L, setRefI2L] = useState({});

  const [labOpts, setLabOpts] = useState([]);
  const [labL2I, setLabL2I] = useState({});
  const [labI2L, setLabI2L] = useState({});

  // ── offline-first fetchers (same signature pattern) ──
  const fetchFloors = (forceOnline = false) =>
    fetchWithCache({
      collection: "floors",
      url: `${VITE_APP_SERVER}/api/v1/hospital-master/floor-master`,
      setItems: setFloors,
      setUpdatedAt: setFloorsUpdatedAt,
      forceOnline,
      setLoading,
    });

  const fetchBeds = (forceOnline = false) =>
    fetchWithCache({
      collection: "bedsVacant",
      url: `${VITE_APP_SERVER}/api/v1/hospital-master/bed-master/vacant`,
      setItems: setBeds,
      setUpdatedAt: setBedsUpdatedAt,
      forceOnline,
      setLoading,
    });

  const fetchAdmissionReasons = (forceOnline = false) =>
    fetchWithCache({
      collection: "admissionReasons",
      url: `${VITE_APP_SERVER}/api/v1/admission-reason`,
      setItems: setAdmissionReasons,
      setUpdatedAt: setAdmissionReasonsUpdatedAt,
      forceOnline,
      setLoading,
    });

  const fetchDoctors = (forceOnline = false) =>
    fetchWithCache({
      collection: "doctors",
      url: `${VITE_APP_SERVER}/api/v1/doctor-master`,
      setItems: setDoctorsList,
      setUpdatedAt: setDoctorsUpdatedAt,
      forceOnline,
      setLoading,
    });

  const fetchReferredDoctors = (forceOnline = false) =>
    fetchWithCache({
      collection: "referredDoctors",
      url: `${VITE_APP_SERVER}/api/v1/doctor-master/referred-doctor/all`,
      setItems: setRefDoctorsList,
      setUpdatedAt: setRefDoctorsUpdatedAt,
      forceOnline,
      setLoading,
    });

  const fetchLabs = (forceOnline = false) =>
    fetchWithCache({
      collection: "labs",
      url: `${VITE_APP_SERVER}/api/v1/hospital-master/lab-master`,
      setItems: setLabsList,
      setUpdatedAt: setLabsUpdatedAt,
      forceOnline,
      setLoading,
    });

  const fetchAdmissionFields = (forceOnline = false) =>
    fetchWithCache({
      collection: "admissionFormFields",
      url: `${VITE_APP_SERVER}/api/v1/document-master/admissionform-master`,
      setItems: setAdmissionFields,
      setUpdatedAt: setAdmissionFieldsUpdatedAt,
      forceOnline,
      setLoading,
    });

  // ── bootstrap once ──
  useEffect(() => {
    fetchReferredDoctors();
    fetchAdmissionReasons();
    fetchDoctors();
    fetchLabs();
    fetchFloors();
    fetchBeds();
    fetchAdmissionFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── derive maps/options whenever lists change ──
  useEffect(() => {
    setFloorMap(Object.fromEntries((floors || []).map(f => [f.floorName, f._id])));
  }, [floors]);

  useEffect(() => {
    setBedMap(Object.fromEntries((beds || []).map(b => [b.bedName, b._id])));
  }, [beds]);

  useEffect(() => {
    const labels = (admissionReasons || []).map(r => r.admissionReason);
    const l2i = Object.fromEntries((admissionReasons || []).map(r => [r.admissionReason, r._id]));
    const i2l = Object.fromEntries((admissionReasons || []).map(r => [r._id, r.admissionReason]));
    setReasonOpts(labels); setReasonL2I(l2i); setReasonI2L(i2l);
  }, [admissionReasons]);

  useEffect(() => {
    const labels = (doctorsList || []).map(d => d.doctorName);
    const l2i = Object.fromEntries((doctorsList || []).map(d => [d.doctorName, d._id]));
    const i2l = Object.fromEntries((doctorsList || []).map(d => [d._id, d.doctorName]));
    setDoctorOpts(labels); setDoctorL2I(l2i); setDoctorI2L(i2l);
  }, [doctorsList]);

  useEffect(() => {
    const labels = (refDoctorsList || []).map(d => d.doctorName);
    const l2i = Object.fromEntries((refDoctorsList || []).map(d => [d.doctorName, d._id]));
    const i2l = Object.fromEntries((refDoctorsList || []).map(d => [d._id, d.doctorName]));
    setRefOpts(labels); setRefL2I(l2i); setRefI2L(i2l);
  }, [refDoctorsList]);

  useEffect(() => {
    const labels = (labsList || []).map(l => l.labName);
    const l2i = Object.fromEntries((labsList || []).map(l => [l.labName, l._id]));
    const i2l = Object.fromEntries((labsList || []).map(l => [l._id, l.labName]));
    setLabOpts(labels); setLabL2I(l2i); setLabI2L(i2l);
  }, [labsList]);

  // ── bed options filtered by selectedFloor ──
  const bedOptions = useMemo(() => {
    if (!selectedFloor) return (beds || []).map(b => b.bedName);

    const selFloorId = floorMap[selectedFloor];
    return (beds || [])
      .filter(b => {
        const bedFloorId =
          typeof b.floorId === "object" ? b.floorId?._id
          : b.floorDetails && typeof b.floorDetails === "object" ? b.floorDetails?._id
          : b.floorId;
        return bedFloorId === selFloorId;
      })
      .map(b => b.bedName);
  }, [beds, selectedFloor, floorMap]);


const floorOptions = useMemo(
  () => (floors || []).map(f => f.floorName),
  [floors]
);


  return {
    // raw lists
    floors, beds, admissionReasons, doctorsList, refDoctorsList, labsList, admissionFields,
    // timestamps
    floorsUpdatedAt, bedsUpdatedAt, admissionReasonsUpdatedAt, doctorsUpdatedAt, refDoctorsUpdatedAt, labsUpdatedAt, admissionFieldsUpdatedAt,
    // maps/options
    floorMap, bedMap,
    reasonOpts, reasonL2I, reasonI2L,
    doctorOpts, doctorL2I, doctorI2L,
    refOpts, refL2I, refI2L,
    labOpts, labL2I, labI2L,
    // derived
    bedOptions, floorOptions,
    // loading + fetchers (for manual refresh buttons)
    loading,
    fetchFloors, fetchBeds, fetchAdmissionReasons, fetchDoctors, fetchReferredDoctors, fetchLabs, fetchAdmissionFields,
  };
}
