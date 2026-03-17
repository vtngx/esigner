import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import { ActionLogOptions } from '../decorators/action-log.decorator';
import { ActionLogService } from 'src/modules/action-log/action-log.service';
import { ACTION_LOG_QUEUE_NAME } from 'src/modules/action-log/action-log.interface';

@Injectable()
export class ActionLogInterceptor implements NestInterceptor {

  constructor(
    private reflector: Reflector,
    private logService: ActionLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {

    const options = this.reflector.get<ActionLogOptions>(
      ACTION_LOG_QUEUE_NAME,
      context.getHandler(),
    );

    if (!options) return next.handle();

    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async (response) => {

        const user = req.user;

        await this.logService.log({
          userId: options.getUserId?.(req, response) || user?.id,
          action: options.action,
          entity: options.entity || null,
          entityId: options.getEntityId?.(req, response) || null,
          metadata: options.getMetadata?.(req, response),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

      }),
    );
  }
}