import { Injectable } from '@nestjs/common';
import { ClaimRepository } from 'src/prisma/claim.repository';

@Injectable()
export class AppService {
  constructor(private readonly claimService: ClaimRepository) {}

  async getHello() {
    return await this.claimService.getIdleClaims();
  }
}
