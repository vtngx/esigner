import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { DiskHealthIndicator, HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disk: DiskHealthIndicator,
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly appService: AppService,
  ) { }

  @Get()
  @HealthCheck()
  getHealth() {
    return this.health.check([
      async () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.5 }),
      async () => this.prismaHealth.pingCheck('db', this.prisma, { timeout: 30000 }),
    ]);
  }
}
