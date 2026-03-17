import { Module } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { ActionLogController } from './action-log.controller';
import { BullModule } from '@nestjs/bullmq';
import { ActionLogProcessor } from './action-log.processor';
import { ACTION_LOG_QUEUE_NAME } from './action-log.interface';

@Module({
  imports: [
    BullModule.registerQueue({ name: ACTION_LOG_QUEUE_NAME }),
  ],
  controllers: [ActionLogController],
  providers: [ActionLogService, ActionLogProcessor],
  exports: [ActionLogService],
})
export class ActionLogModule { }
