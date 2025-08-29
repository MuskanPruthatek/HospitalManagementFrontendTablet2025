export function filterPatients(list, filters, searchTerm = "") {
  const {
    selectedAdmissionReason,
    selectedConsultant,
    selectedPaymentMode,
    admissionDate,            // expected "YYYY-MM-DD" from <input type="date" />
  } = filters;

  const norm = (s = "") => s.toLowerCase();
  const dateOnly = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

  return list
    .map((p) => {
      const ad = p.latestAdmission; // object or null
      if (!ad) return null;

      const nameMatch = norm(p.identityDetails?.patientName).includes(norm(searchTerm));

      const payModeMatch =
        !selectedPaymentMode ||
        selectedPaymentMode === "All" ||
        ad.paymentMode === selectedPaymentMode;

      const reasonMatch =
        !selectedAdmissionReason ||
        ad.admissionReasonId?.admissionReason === selectedAdmissionReason;

      const docMatch =
        !selectedConsultant ||
        ad.consultingDoctorId?.doctorName === selectedConsultant;

      const dateMatch =
        !admissionDate || dateOnly(ad.admissionDate) === admissionDate;

      if (nameMatch && payModeMatch && reasonMatch && docMatch && dateMatch) {
        // keep admissionDetails aligned with what you render
        return { ...p, admissionDetails: [ad], latestAdmission: ad };
      }
      return null;
    })
    .filter(Boolean);
}
