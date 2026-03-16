'use client';

import WalletConnect from "@/components/connect-wallet-button";
import { useUser } from "@/hooks/use-user";
import { Copy, Plus } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { useConnection } from "wagmi";
import { useState } from "react";

export default function MePage() {
  const { data: user, isLoading, error: userError, refetch: refetchUser } = useUser();
  const { address, isConnected } = useConnection()
  const [error, setError] = useState({ wallet: '' });

  if (isLoading) return <p>Loading...</p>;
  if (userError) {
    const message = (userError as Error)?.message || 'An error occurred';
    return <p>{message}</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 size-full p-4">
      <p className="text-sm text-gray-600">Account</p>
      <div className="flex flex-col gap-4 p-4 py-8 rounded-xl bg-muted/50 text-center border">
        {user ? (
          <p>Username: {user.username}</p>
        ) : (
          <p>No user data</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">Connected Wallet</p>
        <div className="flex h-full flex-col gap-4 p-4 py-8 rounded-xl bg-muted/50 justify-center text-center border">
          <p className="text-xs text-muted-foreground tracking-wide">
            {!isConnected ? 'Connect a wallet before signing a document' : 'You are connected to wallet address'}
          </p>
          <div className="flex justify-center">
            <WalletConnect setError={setError} successCb={() => refetchUser()} />
          </div>
          {error?.wallet && (
            <p className="text-xs text-red-500 tracking-wide">
              (!) {error?.wallet}
            </p>
          )}
        </div>
      </div>

      {!!user?.wallets?.length && (
        <div className="flex h-full flex-col gap-4">
          <p className="text-sm text-gray-600">Your Saved Wallets</p>
          <div className="grid auto-rows-min gap-4 md:grid-cols-5">
            {user?.wallets?.map((wallet, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-y-3 rounded-xl bg-muted/50 aspect-square truncate border">
                <p className='text-base truncate'>
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </p>
                <Button variant={'outline'}><Copy size={20} /></Button>
                <small className="text-xs text-gray-400">
                  {dayjs(wallet.createdAt).format("MMM D, YYYY h:mm")}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
