'use client';

import { Table, Text, Badge, ActionIcon, Group, Button } from '@mantine/core';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onView?: (record: any) => void;
  loading?: boolean;
  canDelete?: (record: any) => boolean;
}

export function DataTable({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onView, 
  loading = false,
  canDelete
}: DataTableProps) {
  if (loading) {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key}>{column.label}</Table.Th>
            ))}
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={columns.length + 1}>
              <Text ta="center" c="dimmed">Loading...</Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  if (data.length === 0) {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key}>{column.label}</Table.Th>
            ))}
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={columns.length + 1}>
              <Text ta="center" c="dimmed">No data available</Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          {columns.map((column) => (
            <Table.Th key={column.key}>{column.label}</Table.Th>
          ))}
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((record, index) => (
          <Table.Tr key={record.id || index}>
            {columns.map((column) => (
              <Table.Td key={column.key}>
                {column.render 
                  ? column.render(record[column.key], record)
                  : record[column.key]
                }
              </Table.Td>
            ))}
            <Table.Td>
              <Group gap="xs">
                {onView && (
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => onView(record)}
                  >
                    <IconEye size="1rem" />
                  </ActionIcon>
                )}
                {onEdit && (
                  <ActionIcon
                    variant="subtle"
                    color="orange"
                    onClick={() => onEdit(record)}
                  >
                    <IconEdit size="1rem" />
                  </ActionIcon>
                )}
                {onDelete && (!canDelete || canDelete(record)) && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(record)}
                  >
                    <IconTrash size="1rem" />
                  </ActionIcon>
                )}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}


