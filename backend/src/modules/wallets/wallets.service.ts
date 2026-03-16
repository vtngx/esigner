import { randomBytes } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/generated/prisma/client';
import { ConnectWalletDto } from './dto/connect.dto';
import { ethers } from 'ethers';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) { }

  async generateNonce(user: User): Promise<string> {
    let uNonce = await this.prisma.userNonce.findUnique({
      where: { userId: user.id },
    });

    const nonce = randomBytes(16).toString('hex');

    if (!uNonce) {
      uNonce = await this.prisma.userNonce.create({
        data: {
          userId: user.id,
          nonce,
        },
      });
    } else {
      uNonce = await this.prisma.userNonce.update({
        where: { userId: user.id },
        data: { nonce },
      });
    }

    return nonce;
  }

  async connect(body: ConnectWalletDto, user: User) {
    // Check if wallet is already connected
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { address: body.address },
    });
    if (existingWallet) {
      if (existingWallet?.userId !== user.id) {
        throw new ForbiddenException('Wallet belongs to another user')
      }
      return existingWallet;
    }
    // Validate nonce
    const uNonce = await this.prisma.userNonce.findUnique({
      where: { nonce: body.nonce, userId: user.id },
    });
    if (!uNonce) {
      throw new BadRequestException('Invalid nonce');
    }
    // Recover address from signature and compare
    const recovered = ethers.verifyMessage(body.nonce, body.signature);
    if (recovered.toLowerCase() !== body.address.toLowerCase()) {
      throw new BadRequestException('Signature does not match address');
    }
    // Create wallet record
    const wallet = await this.prisma.wallet.create({
      data: {
        address: body.address,
        userId: user.id,
      }
    });
    // Clear nonce after use
    await this.prisma.userNonce.delete({
      where: { userId: user.id, nonce: body.nonce },
    });

    return wallet;
  }
}
