import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from 'src/generated/prisma/client';
import { Controller, Get, Request, UseGuards } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('wallets')
  async listWallets(@Request() req: { user: User }) {
    return this.usersService.listWallets(req.user);
  }
}
