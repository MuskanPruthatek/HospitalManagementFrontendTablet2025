import axios from "axios";
import { clearAuth, getValidAuthOrNull } from "./auth";

export function setupAxiosInterceptors(navigate) {
  // Attach token to every request if present
  axios.interceptors.request.use((config) => {
    const auth = getValidAuthOrNull();
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  });

  // If backend says unauthorized, drop auth and go to login
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        clearAuth();
        // avoid infinite loops if already at /login
        if (window.location.pathname !== "/login") {
          navigate("/login");
        }
      }
      return Promise.reject(err);
    }
  );
}
