'use client';

import { Modal as MantineModal, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  opened: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: string | number;
}

export function Modal({
  title,
  children,
  opened,
  onClose,
  onConfirm,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  size = 'md',
}: ModalProps) {
  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
      centered
    >
      {children}

      <Group justify="flex-end" mt="md">
        <Button variant="subtle" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        {onConfirm && (
          <Button onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        )}
      </Group>
    </MantineModal>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmModal({
  title,
  message,
  opened,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  destructive = false,
}: ConfirmModalProps) {
  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      title={title}
      size="sm"
      centered
    >
      <Text>{message}</Text>

      <Group justify="flex-end" mt="md">
        <Button variant="subtle" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          loading={loading}
          color={destructive ? 'red' : undefined}
        >
          {confirmLabel}
        </Button>
      </Group>
    </MantineModal>
  );
}


