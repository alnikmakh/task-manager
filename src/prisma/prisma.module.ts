import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ClaimRepository } from 'src/prisma/claim.repository';

@Module({
  providers: [PrismaService, ClaimRepository],
  exports: [ClaimRepository],
})
export class PrismaModule {}
