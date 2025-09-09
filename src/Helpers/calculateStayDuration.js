export const calculateStayDuration = (admissionDate, admissionTime, dischargeDate, dischargeTime) => {
  // Combine date and time into Date objects
  const admission = new Date(`${admissionDate.split("T")[0]}T${admissionTime}:00`);
  const discharge = new Date(`${dischargeDate.split("T")[0]}T${dischargeTime}:00`);

  // Calculate the difference in milliseconds
  const diffMs = discharge - admission;
  if (diffMs < 0) return "Invalid duration";

  // Convert into days, hours, and minutes
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  // Build formatted string
  let parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return parts.length ? parts.join(", ") : "0 minutes";
}

