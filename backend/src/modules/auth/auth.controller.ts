import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from './jwt.guard';
import { User } from 'src/generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: User }) {
    return req.user || null;
  }

  @Post('nonce')
  async getNonce(@Body('walletAddress') wallet: string) {
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: wallet },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: wallet },
      });
    }

    const nonce = this.authService.generateNonce();

    await this.prisma.user.update({
      where: { walletAddress: wallet },
      data: { nonce },
    });

    return { nonce };
  }

  @Post('verify')
  async verify(
    @Body() body: { walletAddress: string; signature: string },
  ) {
    const user = await this.authService.verifySignature(
      body.walletAddress,
      body.signature,
    );

    return this.authService.login(user);
  }
}
