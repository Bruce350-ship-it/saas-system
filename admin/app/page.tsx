'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader, Center } from '@mantine/core';

export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    const target = user?.role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard/admin';
    window.location.href = target;
  }, [isAuthenticated, loading, user]);

  return (
    <Center h="100vh">
      <Loader size="lg" />
    </Center>
  );
}
