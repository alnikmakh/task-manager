import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Claim, ClaimStatus } from '@prisma/client';

@Injectable()
export class ClaimService {
  constructor(private prisma: PrismaService) {}

  async getIdleClaims(): Promise<Claim[]> {
    return this.prisma.claim.findMany({
      where: {
        status: ClaimStatus.IDLE,
      },
    });
  }
}
