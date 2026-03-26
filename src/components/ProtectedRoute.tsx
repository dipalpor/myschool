import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading, hasPermission, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Map paths to modules
  const pathModuleMap: Record<string, string> = {
    '/students': 'students',
    '/teachers': 'teachers',
    '/fees': 'fees',
    '/attendance': 'attendance',
    '/exams': 'exams',
    '/reports': 'reports',
    '/admin-panel': 'admin'
  };

  const currentModule = pathModuleMap[location.pathname];
  
  if (currentModule) {
    if (currentModule === 'admin' && !isAdmin) {
      return <Navigate to="/" replace />;
    }
    if (!hasPermission(currentModule)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
