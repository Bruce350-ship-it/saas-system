'use client';

import { AppShell } from '@mantine/core';
import { Navbar } from '@/components/ui/Navbar';
import { Sidebar } from '@/components/ui/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
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


