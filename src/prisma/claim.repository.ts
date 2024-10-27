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

  async getOldestIdleClaimAtomic(): Promise<Claim> {
    return this.prisma.$runCommandRaw({
      findOneAndUpdate: 'Claim',
      sort: { updatedAt: 1 },
      query: {
        status: ClaimStatus.IDLE,
      },
      update: { $set: { status: ClaimStatus.IN_PROGRESS } },
      limit: 100,
    }) as unknown as Promise<Claim>;
  }

  async createClaim(
    claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Claim> {
    return this.prisma.claim.create({ data: claim });
  }
}
