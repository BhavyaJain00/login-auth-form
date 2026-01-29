import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Enforces authentication and role-based access control
 * Redirects to login if not authenticated
 * Redirects to appropriate dashboard if accessing wrong role's page
 */
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, isUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is specified, check if user has the required role
  if (requiredRole === "ADMIN" && !isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }

  if (requiredRole === "USER" && !isUser) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};
