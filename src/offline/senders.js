import axios from "axios";

/* ---------- helpers ---------- */

// rebuild FormData from the serialized { kind:'FormDataV1', parts: [...] }
function formDataFromParts(dto) {
  const fd = new FormData();
  for (const p of dto.parts || []) {
    if (p.kind === "text") {
      fd.append(p.key, p.value);
    } else if (p.kind === "file") {
      const file =
        typeof File !== "undefined"
          ? new File([p.blob], p.name || "file", {
              type: p.type || "",
              lastModified: p.lastModified || Date.now(),
            })
          : p.blob;
      fd.append(p.key, file);
    }
  }
  return fd;
}

// Existing: build FormData from { data, files } DTO shape (kept as-is)
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

// Choose body & headers from any dto shape
function buildRequestPayload(row) {
  const method = row.method || "POST";

  // If someone already passed a native FormData, just use it.
  if (row.dto instanceof FormData) {
    return { method, data: row.dto, headers: undefined };
  }

  // Our serialized formdata path
  const isV1 = row?.dto?.kind === "FormDataV1" && Array.isArray(row?.dto?.parts);
  if (isV1) {
    const fd = formDataFromParts(row.dto);
    return { method, data: fd, headers: undefined }; // let browser set boundary
  }

  // Legacy/form-style dto
  const forceFD = row?.meta?.asFormData === true;
  const hasFiles = Array.isArray(row?.dto?.files) && row.dto.files.length > 0;
  if (forceFD || hasFiles) {
    const fd = dtoToFormData(row.dto);
    return { method, data: fd, headers: undefined };
  }

  // Default JSON
  return {
    method,
    data: row.dto,
    headers: { "Content-Type": "application/json" },
  };
}

/* ---------- generic senders ---------- */

export const senders = {
  // Smart auto picker (covers FormDataV1, native FormData, {data,files}, and JSON)
  auto: async (row) => {
    const { method, data, headers } = buildRequestPayload(row);
    await axios({
      url: row.endpoint,
      method,
      data,
      headers,
      withCredentials: true,
    });
  },

  genericJSON: async (row) => {
    const method = row.method || "POST";
    await axios({
      url: row.endpoint,
      method,
      data: row.dto,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
  },

  genericFormData: async (row) => {
    const { method, data } =
      row?.dto?.kind === "FormDataV1"
        ? { method: row.method || "POST", data: formDataFromParts(row.dto) }
        : { method: row.method || "POST", data: dtoToFormData(row.dto) };

    await axios({
      url: row.endpoint,
      method,
      data,
      // no Content-Type → browser sets multipart boundary
      withCredentials: true,
    });
  },

  // Optional aliases that force multipart
  patientReg: async (row) => {
    // ensure multipart even if dto is FormDataV1
    const fd =
      row?.dto?.kind === "FormDataV1" ? formDataFromParts(row.dto) : dtoToFormData(row.dto);
    await axios({
      url: row.endpoint,
      method: row.method || "POST",
      data: fd,
      withCredentials: true,
    });
  },

  beds: async (row) => {
    // JSON sender
    await axios({
      url: row.endpoint,
      method: row.method || "POST",
      data: row.dto,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
  },

  labReports: async (row) => {
    const fd =
      row?.dto?.kind === "FormDataV1" ? formDataFromParts(row.dto) : dtoToFormData(row.dto);
    await axios({
      url: row.endpoint,
      method: row.method || "POST",
      data: fd,
      withCredentials: true,
    });
  },

  // keep your special schedules example (uses DELETE) if you still need it:
  schedules: async (req) => {
    await axios.delete(req.url, { headers: req.headers || {}, withCredentials: true });
    return { success: true };
  },
};
