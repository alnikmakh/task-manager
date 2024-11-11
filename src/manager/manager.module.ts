import { Module, OnModuleInit } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ManagerController } from './manager.controller';

@Module({
  imports: [PrismaModule],
  providers: [ManagerService],
  controllers: [ManagerController],
})
export class ManagerModule implements OnModuleInit {
  constructor(private managerService: ManagerService) {}
  onModuleInit() {
    this.managerService.startClaimRetrievingLoop();
    this.managerService.startSanitizingLoop();
  }
}
