import { Injectable, Logger } from '@nestjs/common';
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
export type WorkerResponse = WorkerResponseClaimIdPart &
  WorkerResponseStatusPart;

@Injectable()
export class ManagerService {
  loopActive = true;
  logger: Logger;
  constructor(private readonly claimRepository: ClaimRepository) {
    this.logger = new Logger('ManagerService');
  }

  async startClaimRetrievingLoop() {
    while (this.loopActive) {
      const claims = await this.claimRepository.getIdleClaims();
      await this.sendClaimsToWorker(claims);
      this.logger.debug(`Claims ${claims.map((claim) => claim.id)} sent`);
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    }
  }
  async sanitize() {
    const updatedInProgress =
      await this.claimRepository.updateStaleInProgressToIdle();
    const updatedRetry = await this.claimRepository.updateExpiredRetryToIdle();
    this.logger.debug(
      `Sanitized: inProgress: ${updatedInProgress.count}, retry: ${updatedRetry.count}`,
    );
  }

  async startSanitizingLoop() {
    while (true) {
      await this.sanitize();
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }
  }

  async processWorkerResponse(workerAnswerDto: WorkerResponse) {
    // TODO: add zod validation for worker response and process error
    const { claimId, status } = workerAnswerDto;
    this.logger.debug(`Processing ${claimId} ${status}`);
    if (status === 'NEXT' || status === 'PREV') {
      await this.claimRepository.updateInProgressToIdle({
        claimId,
        step: workerAnswerDto.nextStep,
        fallback: status === 'PREV',
      });
    }
    if (status === 'RETRY') {
      await this.claimRepository.updateInProgressToRetry(claimId);
    }
    if (status === 'FAIL') {
      await this.claimRepository.updateInProgressToFail(claimId);
    }
    if (status === 'SUCCESS') {
      await this.claimRepository.updateInProgressToSuccess(claimId);
    }
    return;
  }

  async sendClaimsToWorker(claims: Claim[]) {
    return fetch('http://localhost:3001', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claims }),
    });
  }

  async createRandomClaim() {
    return this.claimRepository.createClaim({
      payload: crypto.randomUUID(),
      status: 'IDLE',
      scenario: 'FirstScenario',
      currentScenarioStep: 0,
      fallback: false,
      retries: 0,
    });
  }
}
