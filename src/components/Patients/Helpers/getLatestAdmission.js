// Pick the latest admission by admissionDate + admissionTime
export const getLatestAdmission = (arr = []) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const toMillis = (ad) => {
    if (!ad) return -1;
    // admissionDate can be an ISO string; admissionTime is "HH:mm"
    const d = ad.admissionDate ? new Date(ad.admissionDate) : new Date(0);
    const [hh = "00", mm = "00"] = (ad.admissionTime || "").split(":");
    d.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
    return d.getTime();
  };

  return arr.reduce((best, cur) =>
    toMillis(cur) > toMillis(best) ? cur : best
  , arr[0]);
};
