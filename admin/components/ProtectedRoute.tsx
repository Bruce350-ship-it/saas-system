'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader, Center } from '@mantine/core';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('super_admin' | 'admin' | 'user')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['super_admin', 'admin', 'user'],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [loading, isAuthenticated, redirectTo]);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Center h="100vh">
        <div>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </Center>
    );
  }

  return <>{children}</>;
}


