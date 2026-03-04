import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from 'src/generated/prisma/client';
import { WalletsService } from './wallets.service';
import { ConnectWalletDto } from './dto/connect.dto';
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Get('nonce')
  async getNonce(@Request() req: { user: User }) {
    const nonce = await this.walletsService.generateNonce(req.user);
    return { nonce };
  }

  @Post('connect')
  async connect(
    @Body() body: ConnectWalletDto,
    @Request() req: { user: User },
  ) {
    return this.walletsService.connect(body, req.user);
  }
}
