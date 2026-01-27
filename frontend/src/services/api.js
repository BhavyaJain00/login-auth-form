import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000, // 15 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.response = {
        data: { message: "Request timeout - server is taking too long to respond" }
      };
    }
    return Promise.reject(error);
  }
);

// AUTH
export const register = (payload) =>
  api.post("/api/auth/register", payload);

export const login = (payload) =>
  api.post("/api/auth/login", payload);

export const googleLogin = (payload) =>
  api.post("/api/auth/google-login", payload);

export const requestForgotPassword = (payload) =>
  api.post("/api/auth/forgot-password", payload);

export const resetPassword = (payload) =>
  api.post("/api/auth/reset-password", payload);

// FORMS
export const saveForm = (payload) =>
  api.post("/api/forms", payload);

export const getMyForms = () =>
  api.get("/api/forms");

export const getForm = (id) =>
  api.get(`/api/forms/${id}`);

export const deleteForm = (id) =>
  api.delete(`/api/forms/${id}`);

export const submitForm = (formId, data) =>
  api.post(`/api/forms/${formId}/submit`, { formId, data });

export const getMySubmissions = () =>
  api.get("/api/forms/submissions");

export const getFormSubmissions = (formId) =>
  api.get(`/api/forms/${formId}/submissions`);

export const updateMySubmission = (submissionId, data) =>
  api.patch(`/api/forms/submissions/${submissionId}`, { data });

export default api;