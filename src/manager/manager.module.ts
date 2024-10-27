import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManagerController } from './manager.controller';

@Module({
  imports: [PrismaModule],
  providers: [ManagerService],
  controllers: [ManagerController],
})
export class ManagerModule {}
