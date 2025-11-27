'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Card,
  Stack,
  Alert,
  Text,
  Badge,
  Grid,
  TextInput,
  NumberInput
} from '@mantine/core';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useForm } from '@mantine/form';

interface Sale {
  id: string;
  quantity: number;
  total: number;
  synced: boolean;
  createdAt: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const form = useForm({
    initialValues: {
      quantity: 1,
    },
    validate: {
      quantity: (value) => (value <= 0 ? 'Quantity must be greater than 0' : null),
    },
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sales', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data.sales);
      } else {
        setError('Failed to fetch sales');
      }
    } catch (err) {
      setError('An error occurred while fetching sales');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    form.setValues({
      quantity: sale.quantity,
    });
    setModalOpened(true);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!editingSale) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        await fetchSales();
        setModalOpened(false);
        setEditingSale(null);
        form.reset();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Failed to update sale');
      }
    } catch (err) {
      setError('An error occurred while updating sale');
    }
  };

  const handleDelete = async (sale: Sale) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSales(sales.filter(s => s.id !== sale.id));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Failed to delete sale');
      }
    } catch (err) {
      setError('An error occurred while deleting sale');
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (value: any) => value.name
    },
    {
      key: 'user',
      label: 'User',
      render: (value: any) => value.name
    },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'total',
      label: 'Total',
      render: (value: string) => `$${parseFloat(value)}`
    },
    {
      key: 'synced',
      label: 'Status',
      render: (value: boolean) => (
        <Badge color={value ? 'green' : 'orange'}>
          {value ? 'Synced' : 'Pending'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  const totalRevenue = sales.reduce((sum, sale) => {
    const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
    return sum + (isNaN(total) ? 0 : total);
  }, 0);
  const syncedSales = sales.filter(sale => sale.synced).length;

  const calculatedTotal = editingSale ? Number(editingSale.product.price) * form.values.quantity : 0;

  return (
    <Container size="xl">
      <Title order={1} mb="xl">Sales Management</Title>

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

      <Grid mb="xl">
        <Grid.Col span={4}>
          <Card withBorder>
            <Stack align="center">
              <Text size="lg" fw={600}>
                {sales.length}
              </Text>
              <Text size="sm" c="dimmed">
                Total Sales
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card withBorder>
            <Stack align="center">
              <Text size="lg" fw={600}>
                ${totalRevenue.toFixed(2)}
              </Text>
              <Text size="sm" c="dimmed">
                Total Revenue
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card withBorder>
            <Stack align="center">
              <Text size="lg" fw={600}>
                {syncedSales} / {sales.length}
              </Text>
              <Text size="sm" c="dimmed">
                Synced Sales
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder>
        <TextInput
          placeholder="Search sales..."
          leftSection={<IconSearch size="1rem" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
          mb="md"
        />

        <DataTable
          data={filteredSales}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        title="Edit Sale"
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingSale(null);
          form.reset();
          setError('');
        }}
        onConfirm={() => form.onSubmit(handleSubmit)()}
        confirmLabel="Update"
      >
        <Stack>
          {editingSale && (
            <>
              <TextInput
                label="Product"
                value={editingSale.product.name}
                disabled
              />

              <NumberInput
                label="Quantity"
                placeholder="Enter quantity"
                min={1}
                {...form.getInputProps('quantity')}
              />

              <Card withBorder bg="blue.0">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Unit Price: ${Number(editingSale.product.price).toFixed(2)}</Text>
                  <Text size="lg" fw={700} c="blue">
                    Total: ${calculatedTotal.toFixed(2)}
                  </Text>
                </Stack>
              </Card>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
