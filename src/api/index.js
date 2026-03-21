import axios from "axios";

const USER_KEY = "pharmamap_user";
const SESSION_FLAG_KEY = "pharmamap_session_active";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken"
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_FLAG_KEY);
    }
    if (status === 302 || status === 404) {
      const url = String(error.request?.responseURL || "");
      if (url.includes("/accounts/login")) {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(SESSION_FLAG_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export {
  USER_KEY,
  SESSION_FLAG_KEY
};

export default api;
