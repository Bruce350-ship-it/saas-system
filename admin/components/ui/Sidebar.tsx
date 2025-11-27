'use client';

import { NavLink, Stack, Text, Group, ThemeIcon } from '@mantine/core';
import { 
  IconDashboard, 
  IconUsers, 
  IconPackage, 
  IconShoppingCart,
  IconBuilding,
  IconSettings 
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const superAdminLinks = [
    { label: 'Dashboard', href: '/dashboard/super-admin', icon: IconDashboard },
    { label: 'Tenants', href: '/dashboard/super-admin/tenants', icon: IconBuilding },
  ];

  const adminLinks = [
    { label: 'Dashboard', href: '/dashboard/admin', icon: IconDashboard },
    { label: 'Users', href: '/dashboard/admin/users', icon: IconUsers },
    { label: 'Products', href: '/dashboard/admin/products', icon: IconPackage },
    { label: 'Sales', href: '/dashboard/admin/sales', icon: IconShoppingCart },
  ];

  const links = userRole === 'super_admin' ? superAdminLinks : adminLinks;

  return (
    <Stack gap="xs" p="md">
      <Text size="sm" fw={600} c="dimmed" tt="uppercase">
        {userRole === 'super_admin' ? 'System' : 'Management'}
      </Text>
      
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            leftSection={<Icon size="1rem" />}
            active={pathname === link.href}
            variant="subtle"
          />
        );
      })}
    </Stack>
  );
}


