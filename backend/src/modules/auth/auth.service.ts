import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) { }

  generateNonce(): string {
    return randomBytes(16).toString('hex');
  }

  async verifySignature(wallet: string, signature: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: wallet },
    });

    if (!user || !user.nonce) {
      throw new UnauthorizedException();
    }

    const recovered = ethers.verifyMessage(user.nonce, signature);

    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      throw new UnauthorizedException();
    }

    // Clear nonce after use
    await this.prisma.user.update({
      where: { walletAddress: wallet },
      data: { nonce: null },
    });

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, wallet: user.walletAddress };

    return {
      access_token: this.jwt.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: '7d' }),
    };
  }
}
