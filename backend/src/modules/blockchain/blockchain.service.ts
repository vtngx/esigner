import { ethers } from 'ethers';
import { Injectable } from '@nestjs/common';
import * as abi from '../../../../blockchain/artifacts/contracts/SignatureAnchor.sol/SignatureAnchor.json';

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

  async ensureContractExists() {
    const code = await this.provider.getCode(
      process.env.CONTRACT_ADDRESS!,
    );
    if (code === '0x') {
      throw new Error('Contract not deployed at address');
    }
  }

  async anchorRoot(root: string) {
    try {
      await this.ensureContractExists();
      const tx = await this.contract.anchor(root);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error anchoring root:', error);
      return null;
    }
  }

  async verifyRoot(root: string): Promise<boolean> {
    try {
      await this.ensureContractExists();
      const result = await this.contract.verify(root);
      return result;
    } catch (error) {
      console.error('Error verifying root:', error);
      return false;
    }
  }
}