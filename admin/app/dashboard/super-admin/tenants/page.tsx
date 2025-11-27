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
  ActionIcon,
  Text
} from '@mantine/core';
import { IconPlus, IconAlertCircle, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

interface Tenant {
  id: string;
  businessName: string;
  contactEmail: string;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [error, setError] = useState('');
  const [deletingTenant, setDeletingTenant] = useState<string | null>(null);
  const [creatingTenant, setCreatingTenant] = useState(false);

  const form = useForm({
    initialValues: {
      businessName: '',
      contactEmail: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
    validate: {
      businessName: (value) => (!value ? 'Business name is required' : null),
      contactEmail: (value) => (!value ? 'Contact email is required' : null),
      adminName: (value) => (!value ? 'Admin name is required' : null),
      adminEmail: (value) => (!value ? 'Admin email is required' : null),
      adminPassword: (value) => (!value ? 'Admin password is required' : null),
    },
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants);
      } else {
        setError('Failed to fetch tenants');
      }
    } catch (err) {
      setError('An error occurred while fetching tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (values: typeof form.values) => {
    setCreatingTenant(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        setTenants([data.tenant, ...tenants]);
        setModalOpened(false);
        form.reset();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create tenant');
      }
    } catch (err) {
      setError('An error occurred while creating tenant');
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This will permanently delete the tenant and all their data.')) {
      return;
    }

    setDeletingTenant(tenantId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants?id=${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTenants(tenants.filter(tenant => tenant.id !== tenantId));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete tenant');
      }
    } catch (err) {
      setError('An error occurred while deleting tenant');
    } finally {
      setDeletingTenant(null);
    }
  };

  const columns = [
    { key: 'businessName', label: 'Business Name' },
    { key: 'contactEmail', label: 'Contact Email' },
    { 
      key: 'createdAt', 
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Tenant) => (
        <ActionIcon
          color="red"
          variant="subtle"
          onClick={() => handleDeleteTenant(row.id)}
          loading={deletingTenant === row.id}
        >
          <IconTrash size="1rem" />
        </ActionIcon>
      ),
    },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Tenant Management</Title>
        <Button
          leftSection={<IconPlus size="1rem" />}
          onClick={() => setModalOpened(true)}
          loading={creatingTenant}
        >
          Register Business
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
        <Title order={3} mb="md">Registered Businesses</Title>
        <DataTable
          data={tenants}
          columns={columns}
          loading={loading}
        />
      </Card>

      <Modal
        title="Register New Business"
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          form.reset();
          setError('');
        }}
        onConfirm={() => form.onSubmit(handleCreateTenant)()}
        confirmLabel="Create Business"
        size="lg"
        loading={creatingTenant}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            This process will create a new tenant database, set up the schema, and create an admin user. 
            Please be patient as this may take a few moments.
          </Text>
          
          <TextInput
            label="Business Name"
            placeholder="Enter business name"
            {...form.getInputProps('businessName')}
          />
          
          <TextInput
            label="Contact Email"
            placeholder="Enter contact email"
            {...form.getInputProps('contactEmail')}
          />
          
          <TextInput
            label="Admin Name"
            placeholder="Enter admin name"
            {...form.getInputProps('adminName')}
          />
          
          <TextInput
            label="Admin Email"
            placeholder="Enter admin email"
            {...form.getInputProps('adminEmail')}
          />
          
          <TextInput
            label="Admin Password"
            placeholder="Enter admin password"
            type="password"
            {...form.getInputProps('adminPassword')}
          />
        </Stack>
      </Modal>
    </Container>
  );
}
