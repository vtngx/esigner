import { Controller, Get, Query } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('logs')
export class ActionLogController {
  constructor(private readonly actionLogService: ActionLogService) { }

  @Get()
  async getLogs(
    @Query() query: PaginationQueryDto,
  ) {
    return this.actionLogService.list(query);
  }
}
