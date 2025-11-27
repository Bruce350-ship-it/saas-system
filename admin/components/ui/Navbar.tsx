'use client';

import { AppShell, Group, Text, Button, Menu, Avatar } from '@mantine/core';
import { IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Text size="lg" fw={600}>
          SaaS Dashboard
        </Text>
        
        <Group>
          <Text size="sm" c="dimmed">
            {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Text>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="subtle" leftSection={<Avatar size="sm" />}>
                {user.name}
              </Button>
            </Menu.Target>
            
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />}>
                Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={14} />}>
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item 
                leftSection={<IconLogout size={14} />}
                onClick={onLogout}
                color="red"
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </AppShell.Header>
  );
}


