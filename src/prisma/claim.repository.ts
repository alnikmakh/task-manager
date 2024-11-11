import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Claim, ClaimStatus } from '@prisma/client';

@Injectable()
export class ClaimRepository {
  constructor(private prisma: PrismaService) {}

  async getIdleClaims(): Promise<Claim[]> {
    return this.prisma.$transaction(async (prismaWithSession) => {
      const claims = await prismaWithSession.claim.findMany({
        where: {
          status: ClaimStatus.IDLE,
        },
        orderBy: {
          updatedAt: 'asc',
        },
        take: 100,
      });

      await this.prisma.claim.updateMany({
        where: {
          id: {
            in: claims.map((claim) => claim.id),
          },
        },
        data: {
          status: ClaimStatus.IN_PROGRESS,
        },
      });
      return claims;
    });
  }

  async updateStaleInProgressToIdle() {
    return this.prisma.claim.updateMany({
      where: {
        status: ClaimStatus.IN_PROGRESS,
        updatedAt: {
          lte: new Date(Date.now() - 300000),
        },
      },
      data: {
        status: ClaimStatus.IDLE,
      },
    });
  }

  async updateExpiredRetryToIdle() {
    return this.prisma.claim.updateMany({
      where: {
        status: ClaimStatus.RETRY,
        updatedAt: {
          lte: new Date(Date.now() - 60000),
        },
      },
      data: {
        status: ClaimStatus.IDLE,
      },
    });
  }

  async updateInProgressToIdle({
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

  async updateInProgressToRetry(claimId: string) {
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
  async updateInProgressToFail(claimId: string) {
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
  async updateInProgressToSuccess(claimId: string) {
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
