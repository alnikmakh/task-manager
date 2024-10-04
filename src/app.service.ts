import { Injectable } from '@nestjs/common';
import { ClaimService } from './prisma/claim.service';

@Injectable()
export class AppService {
  constructor(private readonly claimService: ClaimService) {}

  async getHello() {
    return await this.claimService.getIdleClaims();
  }
}
