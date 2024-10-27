import { Injectable } from '@nestjs/common';
import { ClaimRepository } from 'src/prisma/claim.repository';
import * as crypto from 'node:crypto';

@Injectable()
export class ManagerService {
  loopActive = true;
  constructor(private readonly claimRepository: ClaimRepository) {}

  async startClaimRetrievingLoop() {
    while (this.loopActive) {
      const claims = await this.claimRepository.getIdleClaims();
    }
  }

  async createRandomClaim() {
    return this.claimRepository.createClaim({
      payload: crypto.randomUUID(),
      status: 'IDLE',
      scenario: 'FirstScenario',
      currentScenarioStep: 0,
      fallback: false,
    });
  }
}
