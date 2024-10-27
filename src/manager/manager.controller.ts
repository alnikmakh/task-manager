import { Controller, Post } from '@nestjs/common';
import { ManagerService } from 'src/manager/manager.service';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}
  @Post('create-claim')
  async createClaim() {
    return this.managerService.createRandomClaim();
  }
}
