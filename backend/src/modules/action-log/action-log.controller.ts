import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { User } from 'src/generated/prisma/client';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class ActionLogController {
  constructor(private readonly actionLogService: ActionLogService) { }

  @Get()
  async getLogs(@Request() req: { user: User }) {
    return this.actionLogService.list(req.user);
  }
}
