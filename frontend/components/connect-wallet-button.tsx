"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useConnection, useDisconnect, useSignMessage } from "wagmi"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { authFetch } from "@/lib/auth"
import { useUser } from "@/hooks/use-user"
import { AxiosError } from "axios"

type P = {
  setError: React.Dispatch<React.SetStateAction<{ wallet: string }>>
  label?: string
  icon?: React.ReactNode
  successCb?: () => void
}

export default function WalletConnect({ setError, label = '', icon = null, successCb = () => { } }: P) {
  const disconnect = useDisconnect()
  const { address, isConnected } = useConnection()
  const signMessage = useSignMessage()

  const { refetch: refetchUser, data: user } = useUser();

  const [loading, setLoading] = useState(false)
  const [nonce, setNonce] = useState<string>('');

  const connectWallet = async (openConnectModal: () => void) => {
    try {
      setError({ wallet: '' })
      setLoading(true)

      // 1️⃣ get nonce
      const nonceRes = await authFetch("/wallets/nonce")
      if (!nonceRes?.data?.nonce) throw new Error("Failed to get nonce")
      const { nonce } = nonceRes.data;
      setNonce(nonce);

      // 2️⃣ open wallet connect modal
      openConnectModal()

      // NOTE: wait until wallet connects
    } catch (err) {
      setError({ wallet: "Unable to start wallet connection" })
      setNonce('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const finishConnection = async () => {
      if (!address) return
      if (user?.wallets?.some(w => w.address.toLowerCase() === address.toLowerCase())) return

      try {
        setLoading(true)

        // 3️⃣ sign nonce
        const signature = await signMessage.mutateAsync({
          message: nonce
        })

        // 4️⃣ verify with backend
        const res = await authFetch("/wallets/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          data: { address, signature, nonce },
        })

        if (!res.data?.id) throw new Error("Wallet verification failed")

        successCb()
        alert("Wallet connected successfully 🎉")
      } catch (err) {
        setError({ wallet: (err as any).response?.data?.message || "Wallet verification failed" })
        disconnect.mutate()
      } finally {
        refetchUser()
        setLoading(false)
      }
    }

    finishConnection()
  }, [isConnected, address, nonce, user]);

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, account, mounted }) => {
        if (!mounted) return null
        if (!!account?.address) {
          return <div className="flex flex-col gap-3">
            <p className='text-base truncate'>
              {address?.slice(0, 8)}......{address?.slice(-8)}
            </p>
            <Button
              onClick={() => disconnect.mutate()}
              disabled={!account}
            >
              {'Disconnect'}
            </Button>
          </div>
        }
        return (
          <Button
            onClick={() => connectWallet(openConnectModal)}
            disabled={loading || !!account}
          >
            {loading ? "Connecting..." : (label || icon || 'Connect Wallet')}
          </Button>
        )
      }}
    </ConnectButton.Custom>
  )
}