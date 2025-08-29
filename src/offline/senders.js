// /src/offline/senders.js
import axios from "axios";

// Reusable: turn a DTO into FormData (supports nested objects + optional files)
export function dtoToFormData(dto) {
  const fd = new FormData();

  function appendNested(fd, obj, parentKey = "") {
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v === "" || v === undefined || v === null) return;
      const key = parentKey ? `${parentKey}[${k}]` : k;
      if (v instanceof Blob || v instanceof File) {
        fd.append(key, v, v.name || "blob");
      } else if (typeof v === "object" && !(v instanceof Date)) {
        appendNested(fd, v, key);
      } else {
        fd.append(key, v);
      }
    });
  }

  appendNested(fd, dto?.data ?? {});
  if (Array.isArray(dto?.files)) {
    dto.files.forEach((f) => fd.append(f.field, f.blob, f.blob?.name || "file"));
  }
  return fd;
}

/** Generic senders you can reuse everywhere */
export const senders = {
  // Auto-pick JSON or FormData
  auto: async (row) => {
    const forceFD = row?.meta?.asFormData === true;
    const hasFiles = Array.isArray(row?.dto?.files) && row.dto.files.length > 0;
    if (forceFD || hasFiles) {
      const fd = dtoToFormData(row.dto);
      await axios.post(row.endpoint, fd);
    } else {
      await axios.post(row.endpoint, row.dto);
    }
  },

  // Explicit styles (if you want to force one)
  genericJSON: async (row) => {
    await axios.post(row.endpoint, row.dto);
  },
  genericFormData: async (row) => {
    const fd = dtoToFormData(row.dto);
    await axios.post(row.endpoint, fd);
  },

  // Optional legacy/special keys you already used:
  patientReg: async (row) => {
    const fd = dtoToFormData(row.dto);
    await axios.post(row.endpoint, fd);
  },
  beds: async (row) => {
    await axios.post(row.endpoint, row.dto);
  },
  labReports: async (row) => {
    const fd = dtoToFormData(row.dto);
    await axios.post(row.endpoint, fd);
  },
};
