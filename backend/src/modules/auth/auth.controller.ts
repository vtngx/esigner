import { JwtAuthGuard } from './jwt.guard';
import { AuthService } from './auth.service';
import { ActionType, User } from 'src/generated/prisma/client';
import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ActionLog } from 'src/decorators/action-log.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: User }) {
    return req.user || null;
  }

  @Post('register')
  async register(@Body() body: { username: string; password: string }) {
    const user = await this.authService.register(body.username, body.password);
    return this.authService.login(user.username, body.password);
  }

  @Post('login')
  @ActionLog({
    action: ActionType.USER_LOGIN,
    entity: 'user',
    getUserId: (_, res) => res?.id,
    getEntityId: (_, res) => res?.id,
  })
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }
}
