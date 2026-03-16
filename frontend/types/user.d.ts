export type User = {
  id: string;
  username: string;
  createdAt: string;
  wallets: Wallet[];
};

export type Wallet = {
  id: string;
  address: string;
  userId: string;
  createdAt: string;
};