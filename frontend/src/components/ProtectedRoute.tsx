import React, { useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, hasRole, loading } = useAuthStore();
  const location = useLocation();
  const redirectRef = useRef(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated && !redirectRef.current) {
    redirectRef.current = true;
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
