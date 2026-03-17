'use client';

import { useLogs } from '@/hooks/use-logs';
import { LogsTable } from '@/components/logs-table';

export default function Home() {
  const { data: logs } = useLogs();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <LogsTable data={logs || []} />
    </div>
  );
}
