import { Controller, Post } from '@nestjs/common';
import { ManagerService } from 'src/manager/manager.service';

@Controller('manager')
export class ManagerController {
  logger: Logger;
  constructor(private readonly managerService: ManagerService) {
    this.logger = new Logger('ManagerController');
  }
  @Post('create-claim')
  async createClaim() {
    return this.managerService.createRandomClaim();
  }
}
