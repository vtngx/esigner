import { Job } from "bullmq";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { PrismaService } from "src/prisma/prisma.service";
import { ACTION_LOG_QUEUE_NAME, QUEUE_ACTIONS } from "./action-log.interface";

@Processor(ACTION_LOG_QUEUE_NAME)
export class ActionLogProcessor extends WorkerHost {

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === QUEUE_ACTIONS.CREATE_LOG) {
      const log = await this.prisma.actionLog.create({
        data: job.data,
      });
      console.log('LOG PROCESSED: ', log.action, log.id);
    }
  }
}