'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';
import { Spotlight } from '@mantine/spotlight';
import { IconSearch } from '@tabler/icons-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <DatesProvider settings={{ firstDayOfWeek: 0 }}>
        <ModalsProvider>
          <Notifications />
          <Spotlight
            actions={[]}
            searchProps={{
              leftSection: <IconSearch size="1.2rem" />,
              placeholder: 'Search...',
            }}
          />
          {children}
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  );
}


