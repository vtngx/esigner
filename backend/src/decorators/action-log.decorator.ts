import { SetMetadata } from '@nestjs/common';
import { ActionType } from 'src/generated/prisma/enums';
import { ACTION_LOG_QUEUE_NAME } from 'src/modules/action-log/action-log.interface';

export interface ActionLogOptions {
  action: ActionType
  entity?: string
  getUserId?: (req: any, res?: any) => string
  getEntityId?: (req: any, res?: any) => string
  getMetadata?: (req: any, res?: any) => any
}

export const ActionLog = (options: ActionLogOptions) => SetMetadata(ACTION_LOG_QUEUE_NAME, options);