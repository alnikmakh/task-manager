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

  async updateStaleInProgressToIdle() {
    await this.prisma.claim.updateMany({
      where: {
        status: ClaimStatus.IN_PROGRESS,
        updatedAt: new Date(Date.now() + 300000),
      },
      data: {
        status: ClaimStatus.IDLE,
      },
    });
  }

  async updateRetryToIdle() {
    await this.prisma.claim.updateMany({
      where: {
        status: ClaimStatus.RETRY,
        updatedAt: new Date(Date.now() + 60000),
      },
      data: {
        status: ClaimStatus.IDLE,
      },
    });
  }

  async updateToIdle({
    claimId,
    step,
    fallback,
  }: {
    claimId: string;
    step: number;
    fallback: boolean;
  }) {
    await this.prisma.claim.update({
      where: {
        status: ClaimStatus.IN_PROGRESS,
        id: claimId,
      },
      data: {
        status: ClaimStatus.IDLE,
        currentScenarioStep: step,
        fallback,
      },
    });
  }

  async updateToRetry(claimId: string) {
    await this.prisma.claim.update({
      where: {
        status: ClaimStatus.IN_PROGRESS,
        id: claimId,
      },
      data: {
        status: ClaimStatus.RETRY,
      },
    });
  }
  async updateToFail(claimId: string) {
    await this.prisma.claim.update({
      where: {
        status: ClaimStatus.IN_PROGRESS,
        id: claimId,
      },
      data: {
        status: ClaimStatus.FAILED,
      },
    });
  }
  async updateToSuccess(claimId: string) {
    await this.prisma.claim.update({
      where: {
        status: ClaimStatus.IN_PROGRESS,
        id: claimId,
      },
      data: {
        status: ClaimStatus.SUCCEEDED,
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
