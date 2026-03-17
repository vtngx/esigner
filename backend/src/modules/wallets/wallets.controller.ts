import { JwtAuthGuard } from '../auth/jwt.guard';
import { ActionType, User } from 'src/generated/prisma/client';
import { WalletsService } from './wallets.service';
import { ConnectWalletDto } from './dto/connect.dto';
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ActionLog } from 'src/decorators/action-log.decorator';

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
  @ActionLog({
    action: ActionType.WALLET_CONNECT,
    entity: 'wallet',
    getEntityId: (_, res) => res.id,
    getMetadata: (_, res) => ({ userId: res.userId, address: res.address }),
  })
  async connect(
    @Body() body: ConnectWalletDto,
    @Request() req: { user: User },
  ) {
    return this.walletsService.connect(body, req.user);
  }
}
