import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Auth Pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminSignupPage from "./pages/AdminSignupPage";
import UserLoginPage from "./pages/UserLoginPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Post-login pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import MySubmissionsPage from "./pages/MySubmissionsPage";
import PublicFormPage from "./pages/PublicFormPage";
import PublishedFormsPage from "./pages/PublishedFormsPage";

/**
 * ROOT ROUTING LOGIC
 * 
 * ADMIN ROUTES:
 * - /admin/signup - Create admin account (first signup becomes ADMIN)
 * - /admin/login - Admin login
 * - /admin/dashboard - Admin dashboard (manage users, forms, submissions)
 * - /admin/forms/:formId/edit - Form builder
 * 
 * USER ROUTES:
 * - /user/login - User login (created by admin)
 * - /user/dashboard - User dashboard (view assigned forms)
 * - /user/forms/:formId - Fill out form
 * - /user/submissions - View own submissions
 * 
 * PUBLIC ROUTES:
 * - /form/:publicFormToken - Public form link (no auth required)
 * - / - Redirect to login
 */

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* LANDING / DEFAULT REDIRECT */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* AUTH / LOGIN ROUTES */}
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ADMIN DASHBOARD ROUTES */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/forms/:formId/edit" element={<FormBuilderPage />} />

        {/* USER ROUTES */}
        <Route path="/user/dashboard" element={<UserDashboardPage />} />
        <Route path="/user/submissions" element={<MySubmissionsPage />} />

        {/* PUBLIC FORM ROUTES */}
        <Route path="/form/:publicFormToken" element={<PublicFormPage />} />
        <Route path="/forms" element={<PublishedFormsPage />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}


