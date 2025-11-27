'use client';

import { AppShell } from '@mantine/core';
import { Navbar } from '@/components/ui/Navbar';
import { Sidebar } from '@/components/ui/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If no user after loading, ProtectedRoute will handle redirect
  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm' }}
        padding="md"
      >
        <AppShell.Header>
          <Navbar user={user} onLogout={logout} />
        </AppShell.Header>

        <AppShell.Navbar>
          <Sidebar userRole={user.role} />
        </AppShell.Navbar>

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}
