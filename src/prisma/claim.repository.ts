import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Claim, ClaimStatus } from '@prisma/client';

@Injectable()
export class ClaimRepository {
  constructor(private prisma: PrismaService) {}

  async getIdleClaims(): Promise<Claim[]> {
    return this.prisma.claim.findMany({
      where: {
        status: ClaimStatus.IDLE,
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: 3,
    });
  }

  async updateSuccessStep(claimId: string, currentStep: number) {
    await this.prisma.claim.update({
      where: {
        id: claimId,
      },
      data: {
        status: ClaimStatus.IDLE,
        currentScenarioStep: currentStep,
      },
    });
  }

  async updateFailedStep(
    claimId: string,
    currentStep: number,
    fallback: boolean,
  ) {
    await this.prisma.claim.update({
      where: {
        id: claimId,
      },
      data: {
        status: fallback ? ClaimStatus.IDLE : ClaimStatus.RETRY,
        fallback,
        currentScenarioStep: currentStep,
      },
    });
  }

  async getOldestIdleClaimAtomic(): Promise<Claim> {
    return this.prisma.$runCommandRaw({
      findOneAndUpdate: 'Claim',
      sort: { updatedAt: 1 },
      query: {
        status: ClaimStatus.IDLE,
      },
      update: { $set: { status: ClaimStatus.IN_PROGRESS } },
    }) as unknown as Promise<Claim>;
  }

  async createClaim(
    claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Claim> {
    return this.prisma.claim.create({ data: claim });
  }
}
