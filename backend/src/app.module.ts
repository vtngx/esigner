import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TerminusModule } from '@nestjs/terminus';
import { DocumentsModule } from './modules/documents/documents.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { PdfExportModule } from './modules/pdf-export/pdf-export.module';
import { BullModule } from '@nestjs/bullmq';
import { ActionLogModule } from './modules/action-log/action-log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActionLogInterceptor } from './interceptors/action-log.interceptor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    }),
    PrismaModule,
    TerminusModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    DocumentsModule,
    BlockchainModule,
    PdfExportModule,
    ActionLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActionLogInterceptor,
    }
  ],
})
export class AppModule {}
