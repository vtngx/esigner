export type DocumentSummary = {
  owned: number;
  assigned: number;
  signed: number;
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  SIGNING = "SIGNING",
  SIGNED = "SIGNED",
  ANCHORED = "ANCHORED",
}

export interface User {
  id: string;
  username: string;
}

export interface Signer {
  id: string;
  signatureHex: string;
  signedAt: string;
  userId: string;
  user: User;
}

export interface Document {
  id: string;
  name: string;
  storageUrl: string;
  documentHash: string;
  ownerId: string;
  status: DocumentStatus;
  merkleRoot: string;
  blockchainTxHash: string;
  anchoredAt: string;
  createdAt: string;
  owner: User;
  signers: Signer[];
  isOwner?: boolean;
  isSigner?: boolean;
}

export interface VerifyDocument {
  doc: {
    id: string;
    status: DocumentStatus;
    hash: string;
    hashValid: boolean;
  };
  blockchain: {
    anchored: boolean;
    merkleRoot: string | null;
    txHash: string | null;
  };
  signatures: {
    status: string;
    details: {
      signer: string;
      signatureValid: boolean;
      merkleProofValid: boolean;
      wallet: (string | null);
      signedAt: (Date | null);
      reason: string;
    }[];
  };
}