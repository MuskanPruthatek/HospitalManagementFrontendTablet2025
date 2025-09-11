
useEffect(() => {
    if (!selectedPatient?.patientId) return;
    const fetchPatientsWithId = (forceOnline = false) =>
        fetchWithCache({
            collection: `patientData-${selectedPatient.patientId}`, // unique per patient
            url: `${VITE_APP_SERVER}/api/v1/patient/${selectedPatient.patientId}`,
            setItems: setPatientData,
            forceOnline,
        });

    fetchPatientsWithId();
}, [selectedPatient?.patientId]);

const patientId = patientData?._id || patientData?.patientId;
const admissionId = selectedPatient?.admissionId;

// fetch reports
useEffect(() => {
    if (!patientId || !admissionId) return;
    fetchRecordings(patientId, admissionId);
}, [patientId, admissionId]);


const fetchRecordings = async (patientId, admissionId, forceOnline = false) => {
    if (!patientId || !admissionId) return;

    setLoading(true);
    try {
        await fetchWithCache({
            collection: `labReports-${patientId}-${admissionId}`,
            url: `${VITE_APP_SERVER}/api/v1/files-recordings/${patientId}/${admissionId}/labReports`,
            setItems: (items) => setLabReports(items.labReports || []),
            forceOnline,
        });
    } catch (err) {
        console.error("Error fetching recordings", err);
    } finally {
        setLoading(false);
    }
};

const fetchReports = (forceOnline = false) => {
    if (patientId && admissionId) fetchRecordings(patientId, admissionId, forceOnline);
};