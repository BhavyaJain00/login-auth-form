import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminSignupPage from "./pages/AdminSignupPage";
import UserLoginPage from "./pages/UserLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import MySubmissionsPage from "./pages/MySubmissionsPage";
import PublishedFormsPage from "./pages/PublishedFormsPage";
import PublicFormPage from "./pages/PublicFormPage";

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

        {/* ADMIN ROUTES */}
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/forms/:formId/edit"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <FormBuilderPage />
            </ProtectedRoute>
          }
        />

        {/* USER ROUTES */}
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute requiredRole="USER">
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/forms/:formId"
          element={
            <ProtectedRoute requiredRole="USER">
              <FormBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/submissions"
          element={
            <ProtectedRoute requiredRole="USER">
              <MySubmissionsPage />
            </ProtectedRoute>
          }
        />

        {/* PUBLIC PUBLISHED FORMS */}
        <Route path="/forms/published" element={<PublishedFormsPage />} />
        <Route path="/form/:publicFormToken" element={<PublicFormPage />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}


