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

@Module({
  imports: [
    PrismaModule,
    TerminusModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    DocumentsModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
