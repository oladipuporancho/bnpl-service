import { Module } from '@nestjs/common';
import { LoansService } from './loan.service';
import { LoansController } from './loan.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, PrismaService, EmailService],
})
export class LoansModule {}
