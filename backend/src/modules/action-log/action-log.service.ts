import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ACTION_LOG_QUEUE_NAME, QUEUE_ACTIONS } from './action-log.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActionLog } from 'src/generated/prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class ActionLogService {
  constructor(
    @InjectQueue(ACTION_LOG_QUEUE_NAME) private queue: Queue,
    private prisma: PrismaService,
  ) { }

  async log(data: Partial<ActionLog>) {
    await this.queue.add(QUEUE_ACTIONS.CREATE_LOG, data, {
      removeOnComplete: true,
      attempts: 3,
    });
  }

  async list(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    return this.prisma.actionLog.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }
}
