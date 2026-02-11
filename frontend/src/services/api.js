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
// NOTE: Creating/updating forms is an admin-only operation on the server.
// The backend exposes admin create/update under `/api/admin/forms/*`.
// Keep this function for compatibility but throw an explicit error to
// prevent accidental calls from user-facing code.
export const saveForm = (_payload) =>
  Promise.reject(new Error("saveForm is admin-only. Use adminCreateForm/adminUpdateForm as an admin."));

export const getMyForms = () =>
  api.get("/api/forms");

export const getForm = (id) =>
  api.get(`/api/forms/${id}`);

// Public form access
export const getPublicForm = (publicFormToken) =>
  api.get(`/api/forms/public/${publicFormToken}`);

export const submitPublicForm = (publicFormToken, answers) =>
  api.post(`/api/forms/public/submit`, { publicFormToken, answers });

export const deleteForm = (id) =>
  api.delete(`/api/forms/${id}`);

export const submitForm = (formId, data) =>
  api.post(`/api/forms/${formId}/submit`, { formId, answers: data });

export const getMySubmissions = () =>
  api.get("/api/forms/submissions/my");

export const getMySubmission = (submissionId) =>
  api.get(`/api/forms/submissions/${submissionId}`);

export const getFormSubmissions = (formId) =>
  api.get(`/api/forms/${formId}/submissions`);

export const updateMySubmission = (submissionId, data) =>
  api.patch(`/api/forms/submissions/${submissionId}`, { data });

// ADMIN FORM MANAGEMENT
export const adminGetForms = () =>
  api.get("/api/admin/forms");

export const adminGetForm = (id) =>
  api.get(`/api/admin/forms/${id}`);

export const adminCreateForm = (payload) =>
  api.post("/api/admin/forms/create", payload);

export const adminUpdateForm = (id, payload) =>
  api.put(`/api/admin/forms/${id}`, payload);

export const adminDeleteForm = (id) =>
  api.delete(`/api/admin/forms/${id}`);

// Public published forms
export const getPublishedForms = () => api.get("/api/forms/public");

export default api;