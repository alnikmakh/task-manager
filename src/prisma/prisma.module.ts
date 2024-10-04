import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ClaimService } from './claim.service';

@Module({
  providers: [PrismaService, ClaimService],
  exports: [ClaimService],
})
export class PrismaModule {}
