// utils/dateFormatter.js
export function formatDateTime(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert to 12h format

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}
