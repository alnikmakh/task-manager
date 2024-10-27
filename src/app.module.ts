import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ManagerModule } from './manager/manager.module';

@Module({
  imports: [PrismaModule, ManagerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
