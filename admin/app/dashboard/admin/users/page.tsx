'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Group, 
  Button, 
  Card,
  Stack,
  Alert,
  Badge
} from '@mantine/core';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { TextInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'USER' as 'ADMIN' | 'USER',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      email: (value) => (!value ? 'Email is required' : null),
      password: (value) => (!editingUser && !value ? 'Password is required' : null),
      role: (value) => (!value ? 'Role is required' : null),
    },
  });

  useEffect(() => {
    // Get current user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub);
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingUser ? '/api/users' : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const body = editingUser 
        ? { id: editingUser.id, ...values }
        : values;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingUser) {
          setUsers(users.map(u => u.id === editingUser.id ? data.user : u));
        } else {
          setUsers([data.user, ...users]);
        }
        setModalOpened(false);
        setEditingUser(null);
        form.reset();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save user');
      }
    } catch (err) {
      setError('An error occurred while saving user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setValues({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setModalOpened(true);
  };

  const handleDelete = async (user: User) => {
    // Get current user info from token
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // Decode token to get current user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.sub;
      
      // Prevent admin from deleting themselves
      if (user.id === currentUserId) {
        setError('You cannot delete your own account');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this user?')) return;
      
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== user.id));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('An error occurred while deleting user');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role',
      render: (value: string) => (
        <Badge color={value === 'ADMIN' ? 'blue' : 'gray'}>
          {value}
        </Badge>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Users Management</Title>
        <Button
          leftSection={<IconPlus size="1rem" />}
          onClick={() => {
            setEditingUser(null);
            form.reset();
            setModalOpened(true);
          }}
        >
          Add User
        </Button>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
          onClose={() => setError('')}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      <Card withBorder>
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canDelete={(user) => user.id !== currentUserId}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingUser(null);
          form.reset();
          setError('');
        }}
        onConfirm={() => form.onSubmit(handleSubmit)()}
        confirmLabel={editingUser ? 'Update' : 'Create'}
      >
        <Stack>
          <TextInput
            label="Name"
            placeholder="Enter user name"
            {...form.getInputProps('name')}
          />
          
          <TextInput
            label="Email"
            placeholder="Enter user email"
            {...form.getInputProps('email')}
          />
          
          <TextInput
            label="Password"
            placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
            type="password"
            {...form.getInputProps('password')}
          />
          
          <Select
            label="Role"
            placeholder="Select role"
            data={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'USER', label: 'User' },
            ]}
            {...form.getInputProps('role')}
          />
        </Stack>
      </Modal>
    </Container>
  );
}


