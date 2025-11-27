'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Grid, 
  Card, 
  Text, 
  Group, 
  Badge,
  Stack,
  Alert
} from '@mantine/core';
import { IconUsers, IconPackage, IconShoppingCart, IconAlertCircle } from '@tabler/icons-react';

interface DashboardStats {
  users: number;
  products: number;
  sales: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    products: 0,
    sales: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch users
      const usersResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] };
      
      // Fetch products
      const productsResponse = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const productsData = productsResponse.ok ? await productsResponse.json() : { products: [] };
      
      // Fetch sales
      const salesResponse = await fetch('/api/sales', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const salesData = salesResponse.ok ? await salesResponse.json() : { sales: [] };
      
      const totalRevenue = salesData.sales.reduce((sum: number, sale: any) => {
        const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
        return sum + (isNaN(total) ? 0 : total);
      }, 0);
      setStats({
        users: usersData.users.length,
        products: productsData.products.length,
        sales: salesData.sales.length,
        totalRevenue,
      });
    } catch (err) {
      setError('An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl">
        <Title order={1} mb="xl">Admin Dashboard</Title>
        <Text>Loading dashboard data...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title order={1} mb="xl">Admin Dashboard</Title>

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

      <Grid>
        <Grid.Col span={3}>
          <Card withBorder>
            <Group>
              <IconUsers size="2rem" color="blue" />
              <div>
                <Text size="lg" fw={600}>
                  {stats.users}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Users
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card withBorder>
            <Group>
              <IconPackage size="2rem" color="green" />
              <div>
                <Text size="lg" fw={600}>
                  {stats.products}
                </Text>
                <Text size="sm" c="dimmed">
                  Products
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card withBorder>
            <Group>
              <IconShoppingCart size="2rem" color="orange" />
              <div>
                <Text size="lg" fw={600}>
                  {stats.sales}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Sales
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card withBorder>
            <Group>
              <Badge color="green" size="lg">
                ${stats.totalRevenue.toFixed(2)}
              </Badge>
              <div>
                <Text size="lg" fw={600}>
                  Revenue
                </Text>
                <Text size="sm" c="dimmed">
                  Total
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid mt="xl">
        <Grid.Col span={6}>
          <Card withBorder>
            <Title order={3} mb="md">Recent Activity</Title>
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                System is running smoothly
              </Text>
              <Text size="sm" c="dimmed">
                All services are operational
              </Text>
              <Text size="sm" c="dimmed">
                Database connections are stable
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Card withBorder>
            <Title order={3} mb="md">Quick Actions</Title>
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Manage users, products, and sales
              </Text>
              <Text size="sm" c="dimmed">
                View detailed reports and analytics
              </Text>
              <Text size="sm" c="dimmed">
                Configure system settings
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}


