import { Injectable } from '@nestjs/common';
import { ClaimRepository } from 'src/prisma/claim.repository';
import * as crypto from 'node:crypto';
import { Claim } from '@prisma/client';

@Injectable()
export class ManagerService {
  loopActive = true;
  constructor(private readonly claimRepository: ClaimRepository) {}

  async startClaimRetrievingLoop() {
    while (this.loopActive) {
      const claims = await this.claimRepository.getIdleClaims();
      await this.sendClaimsToWorker(claims);
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    }
  }

  async processWorkerResponse(workerAnswerDto: {
    claimId: string;
    currentStep: number;
    success: boolean;
    fallback: boolean;
  }) {
    const { success, claimId, fallback, currentStep } = workerAnswerDto;
    if (success) {
      await this.claimRepository.updateSuccessStep(claimId, currentStep);
    } else {
      await this.claimRepository.updateFailedStep(
        claimId,
        currentStep,
        fallback,
      );
    }
  }

  async sendClaimsToWorker(claims: Claim[]) {
    // temporal fake implementation
    for (const claim of claims) {
      (async () => {
        await this.processWorkerResponse({
          claimId: claim.id,
          fallback: false,
          currentStep: claim.currentScenarioStep + 1,
          success: true,
        });
      })();
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
