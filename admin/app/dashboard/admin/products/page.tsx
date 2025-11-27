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
  Text
} from '@mantine/core';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { TextInput, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';

interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      name: '',
      price: 0,
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      price: (value) => (value <= 0 ? 'Price must be greater than 0' : null),
    },
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingProduct ? '/api/products' : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const body = editingProduct
        ? { id: editingProduct.id, ...values }
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
        if (editingProduct) {
          setProducts(products.map(p => p.id === editingProduct.id ? data.product : p));
        } else {
          setProducts([data.product, ...products]);
        }
        setModalOpened(false);
        setEditingProduct(null);
        form.reset();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save product');
      }
    } catch (err) {
      setError('An error occurred while saving product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setValues({
      name: product.name,
      price: product.price,
    });
    setModalOpened(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products?id=${product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== product.id));
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        // Display the detailed message from the backend
        setError(errorData.message || errorData.error || 'Failed to delete product');
      }
    } catch (err) {
      setError('An error occurred while deleting product');
    }
  };

  const columns = [
    { key: 'name', label: 'Product Name' },
    {
      key: 'price',
      label: 'Price',
      render: (value: number) => `$${value}`
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ];

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Products Management</Title>
        <Button
          leftSection={<IconPlus size="1rem" />}
          onClick={() => {
            setEditingProduct(null);
            form.reset();
            setModalOpened(true);
          }}
        >
          Add Product
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
          data={products}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingProduct(null);
          form.reset();
          setError('');
        }}
        onConfirm={() => form.onSubmit(handleSubmit)()}
        confirmLabel={editingProduct ? 'Update' : 'Create'}
      >
        <Stack>
          <TextInput
            label="Product Name"
            placeholder="Enter product name"
            {...form.getInputProps('name')}
          />

          <NumberInput
            label="Price"
            placeholder="Enter price"
            min={0}
            step={0.01}
            decimalScale={2}
            prefix="$"
            {...form.getInputProps('price')}
          />
        </Stack>
      </Modal>
    </Container>
  );
}

