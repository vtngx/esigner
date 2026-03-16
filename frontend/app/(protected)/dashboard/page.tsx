'use client';

import { useRouter } from 'next/navigation';
import { useSummary } from '@/hooks/use-summary';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import WalletConnect from '@/components/connect-wallet-button';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { useDocuments } from '@/hooks/use-documents';

export default function Home() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: summary, isLoading } = useSummary();
  const { data: documents } = useDocuments();
  const [error, setError] = useState({ wallet: '' });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center gap-y-5 rounded-xl bg-muted/50 h-48 border">
          <small className='text-gray-600'>Total Docs Owned</small>
          <p className='text-3xl'>{isLoading ? '-' : (summary?.owned || 0)}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-y-5 rounded-xl bg-muted/50 h-48 border">
          <small className='text-gray-600'>Total Docs Assigned</small>
          <p className='text-3xl'>{isLoading ? '-' : (summary?.assigned || 0)}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-y-5 rounded-xl bg-muted/50 h-48 border">
          <small className='text-gray-600'>Total Docs Signed</small>
          <p className='text-3xl'>{isLoading ? '-' : (summary?.signed || 0)}</p>
        </div>
      </div>
      {!isUserLoading && user?.wallets?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-y-5 rounded-xl bg-muted/50 py-8 border">
          <small className='text-gray-600 whitespace-pre text-center'>
            You are not connecting to any wallets{'\n'}Please connect a wallet to start signing documents
          </small>
          <WalletConnect setError={setError} />
          {error.wallet && (<small className='text-red-500 text-center'>{error.wallet}</small>)}
        </div>
      )}
      <DataTable data={documents || []} />
    </div>
  );
}
