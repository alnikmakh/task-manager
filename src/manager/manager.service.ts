import { Injectable } from '@nestjs/common';
import { ClaimRepository } from 'src/prisma/claim.repository';
import * as crypto from 'node:crypto';
import { Claim } from '@prisma/client';

export type WorkerResponseStatus =
  | 'NEXT'
  | 'PREV'
  | 'RETRY'
  | 'SUCCESS'
  | 'FAIL';
type WorkerResponseClaimIdPart = {
  claimId: string;
};
type WorkerResponseStatusPart =
  | {
      status: 'NEXT' | 'PREV';
      nextStep: number;
    }
  | {
      status: 'RETRY' | 'SUCCESS' | 'FAIL';
    };
type WorkerResponse = WorkerResponseClaimIdPart & WorkerResponseStatusPart;

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

  async startSanitizingLoop() {
    while (true) {
      await this.claimRepository.updateStaleInProgressToIdle();
      await this.claimRepository.updateRetryToIdle();
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }
  }

  async processWorkerResponse(workerAnswerDto: WorkerResponse) {
    // TODO: add zod validation for worker response and process error
    const { claimId, status } = workerAnswerDto;
    if (status === 'NEXT' || status === 'PREV') {
      await this.claimRepository.updateToIdle({
        claimId,
        step: workerAnswerDto.nextStep,
        fallback: status === 'PREV',
      });
    }
    if (status === 'RETRY') {
      await this.claimRepository.updateToRetry(claimId);
    }
    if (status === 'FAIL') {
      await this.claimRepository.updateToFail(claimId);
    }
    if (status === 'SUCCESS') {
      await this.claimRepository.updateToSuccess(claimId);
    }
    return;
  }

  async sendClaimsToWorker(claims: Claim[]) {
    // temporal fake implementation
    for (const claim of claims) {
      (() => {
        this.processWorkerResponse({
          claimId: claim.id,
          status: claim.currentScenarioStep === 5 ? 'SUCCESS' : 'NEXT',
          nextStep:
            claim.currentScenarioStep === 5
              ? claim.currentScenarioStep
              : claim.currentScenarioStep + 1,
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
