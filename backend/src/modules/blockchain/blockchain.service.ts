import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as abi from '../../../../blockchain/artifacts/contracts/DocumentAnchor.sol/DocumentAnchor.json'

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL,
    );

    this.wallet = new ethers.Wallet(
      process.env.WALLET_PKEY!,
      this.provider,
    );

    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS!,
      abi.abi,
      this.wallet,
    );
  }

  async anchorDocument(docId: string, documentHash: string) {
    try {
      const tx = await this.contract.anchor(documentHash);
      const receipt = await tx.wait();

      // Verify on-chain state
      const anchoredTimestamp =
        await this.contract.anchoredAt(documentHash);

      if (!anchoredTimestamp || anchoredTimestamp == 0) {
        throw new Error('Blockchain verification failed');
      }

      return {
        txHash: receipt.hash,
        anchoredAt: Number(anchoredTimestamp),
      };
    } catch (e) {
      console.error(`Failed to anchor document ${docId}`, e);
      return null;
    }
  }

  async isAnchored(documentHash: string): Promise<boolean> {
    const result = await this.contract.isAnchored(documentHash);
    return result || false;
  }
}