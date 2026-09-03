import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from './Loader';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on role requested
    if (allowedRoles.includes('saas_admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to home if user does not have required role
    return <Navigate to="/" replace />;
  }

  return children;
}
